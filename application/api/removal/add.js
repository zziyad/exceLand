({
  access: 'public',
  method: async ({
    removalTerms,
    dateFrom,
    dateTo,
    departmentId,
    itemDescription,
    removalReasonId,
    customReason,
    images,
  }) => {
    const appError = await lib.appError();

    try {
      // Basic required field validation
      if (
        !removalTerms ||
        !departmentId ||
        !itemDescription ||
        !removalReasonId
      ) {
        return {
          status: 'error',
          response: {
            msg: 'Missing required fields: removalTerms, departmentId, itemDescription, removalReasonId',
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

      // Validate removal reason existence
      const removalReason = await prisma.removalReason.findUnique({
        where: { id: removalReasonId },
        select: { id: true, name: true }, // Include name for "OTHER" check
      });
      if (!removalReason) {
        return {
          status: 'error',
          response: { msg: 'Removal reason not found' },
        };
      }

      // Check if customReason is required (assuming "OTHER" is a reason name)
      if (removalReason.name === 'OTHER' && !customReason) {
        return {
          status: 'error',
          response: {
            msg: 'customReason is required when removal reason is "OTHER"',
          },
        };
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

      // Create the removal request with nested RemovalImage creation
      const removal = await prisma.removal.create({
        data: {
          userId: 1, // Placeholder; replace with actual authenticated user ID (e.g., context.user.id)
          removalTerms: normalizedTerms,
          dateFrom: new Date(dateFrom),
          dateTo: dateTo ? new Date(dateTo) : null,
          employee: normalizedTerms === 'non-returnable' ? '' : '', // Default empty string
          departmentId,
          itemDescription,
          removalReasonId,
          customReason: customReason || null,
          status: 'pending', // Initial status
          images: images
            ? {
                create: images.map((url) => ({ url })), // Create RemovalImage records
              }
            : undefined,
        },
        include: {
          images: true, // Include created images in the response
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
            itemDescription: removal.itemDescription,
            removalReasonId: removal.removalReasonId,
            customReason: removal.customReason,
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
