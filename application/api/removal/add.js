({
  access: 'public',
  method: async ({
    removalTerms,
    dateFrom,
    dateTo,
    employee,
    departmentId,
    items,
    images,
  }) => {
    const appError = await lib.appError();

    try {
      // Basic required field validation
      if (!removalTerms || !departmentId || !items || !employee) {
        return {
          status: 'error',
          response: {
            msg: 'Missing required fields: removalTerms, departmentId, items, employee',
          },
        };
      }

      // Validate items array
      if (!Array.isArray(items) || items.length === 0) {
        return {
          status: 'error',
          response: {
            msg: 'items must be a non-empty array',
          },
        };
      }

      // Validate removalTerms
      const validTerms = ['returnable', 'non-returnable'];
      if (!validTerms.includes(removalTerms.toLowerCase())) {
        return {
          status: 'error',
          response: {
            msg: 'Invalid removalTerms. Must be "returnable" or "non-returnable"',
          },
        };
      }
      const normalizedTerms = removalTerms.toLowerCase();

      // Conditional validation based on removalTerms
      if (normalizedTerms === 'returnable') {
        if (!dateTo) {
          return {
            status: 'error',
            response: { msg: 'dateTo is required for returnable items' },
          };
        }
        if (!dateFrom || isNaN(Date.parse(dateFrom))) {
          return {
            status: 'error',
            response: {
              msg: 'dateFrom must be a valid ISO date for returnable items',
            },
          };
        }
        if (isNaN(Date.parse(dateTo))) {
          return {
            status: 'error',
            response: { msg: 'dateTo must be a valid ISO date' },
          };
        }
      } else if (normalizedTerms === 'non-returnable') {
        if (!dateFrom || isNaN(Date.parse(dateFrom))) {
          return {
            status: 'error',
            response: {
              msg: 'dateFrom must be a valid ISO date for non-returnable items',
            },
          };
        }
        if (dateTo) {
          return {
            status: 'error',
            response: {
              msg: 'dateTo should be undefined for non-returnable items',
            },
          };
        }
      }

      // Validate department existence
      const department = await prisma.department.findUnique({
        where: { id: departmentId },
      });
      if (!department) {
        return {
          status: 'error',
          response: { msg: 'Department not found' },
        };
      }

      // Validate removal reasons for each item
      for (const item of items) {
        if (!item.description || !item.removalReasonId) {
          return {
            status: 'error',
            response: {
              msg: 'Each item must have a description and removalReasonId',
            },
          };
        }

        const removalReason = await prisma.removalReason.findUnique({
          where: { id: item.removalReasonId },
          select: { id: true, name: true },
        });
        if (!removalReason) {
          return {
            status: 'error',
            response: {
              msg: `Removal reason ${item.removalReasonId} not found`,
            },
          };
        }

        if (removalReason.name === 'OTHER' && !item.customReason) {
          return {
            status: 'error',
            response: {
              msg: 'customReason is required when removal reason is "OTHER"',
            },
          };
        }
      }

      // Validate images if provided
      if (
        images &&
        (!Array.isArray(images) ||
          images.some((img) => typeof img !== 'string'))
      ) {
        return {
          status: 'error',
          response: { msg: 'images must be an array of strings' },
        };
      }

      // Create the removal request with nested RemovalItem and RemovalImage creation
      const removal = await prisma.removal.create({
        data: {
          userId: 1, // Replace with actual authenticated user ID
          removalTerms: normalizedTerms,
          dateFrom: new Date(dateFrom),
          dateTo: dateTo ? new Date(dateTo) : null,
          employee,
          departmentId,
          status: 'pending',
          items: {
            create: items.map((item) => ({
              description: item.description,
              removalReasonId: item.removalReasonId,
              customReason: item.customReason || null,
            })),
          },
          images: images
            ? {
                create: images.map((url) => ({ url })),
              }
            : undefined,
        },
        include: {
          items: {
            include: {
              removalReason: true, // Include removal reason details
            },
          },
          images: true,
        },
      });

      return {
        status: 'success',
        response: {
          msg: 'Removal request created successfully',
          removal: {
            id: removal.id,
            status: removal.status,
            createdAt: removal.createdAt.toISOString(),
            removalTerms: removal.removalTerms,
            dateFrom: removal.dateFrom.toISOString(),
            dateTo: removal.dateTo ? removal.dateTo.toISOString() : null,
            employee: removal.employee,
            departmentId: removal.departmentId,
            items: removal.items.map((item) => ({
              id: item.id,
              description: item.description,
              removalReasonId: item.removalReasonId,
              removalReason: item.removalReason.name,
              customReason: item.customReason,
            })),
            images: removal.images.map((image) => ({
              id: image.id,
              url: image.url,
            })),
          },
        },
      };
    } catch (e) {
      throw new appError(e.message, 500);
    } finally {
      await prisma.$disconnect();
    }
  },
});
