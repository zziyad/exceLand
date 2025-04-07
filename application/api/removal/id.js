({
  access: 'public',
  method: async ({ id }) => {
    const appError = await lib.appError();

    const cc = await context;
    console.log({ cc });

    try {
      // Validate input
      if (!id || isNaN(parseInt(id))) {
        return {
          status: 'error',
          response: { msg: 'Valid removal ID is required' },
        };
      }

      // Fetch the removal by ID with related data, excluding user info
      const removal = await prisma.removal.findUnique({
        where: { id: parseInt(id) },
        include: {
          department: {
            select: { name: true }, // Get department name
          },
          items: {
            include: {
              removalReason: {
                select: { name: true }, // Get removal reason name for each item
              },
            },
          },
          images: true, // Include associated images
          approvals: true, // Include approvals
        },
      });

      // Check if removal exists
      if (!removal) {
        return {
          status: 'error',
          response: { msg: 'Removal not found' },
        };
      }

      // Format the response
      return {
        status: 'success',
        response: {
          msg: 'Removal fetched successfully',
          removal: {
            id: removal.id,
            status: removal.status,
            createdAt: removal.createdAt.toISOString(),
            removalTerms: removal.removalTerms,
            dateFrom: removal.dateFrom.toISOString(),
            dateTo: removal.dateTo ? removal.dateTo.toISOString() : null,
            employee: removal.employee,
            departmentName: removal.department.name,
            items: removal.items.map((item) => ({
              id: item.id,
              description: item.description,
              removalReason: item.removalReason.name,
              customReason: item.customReason,
            })),
            images: removal.images.map((image) => ({
              id: image.id,
              url: image.url,
            })),
            approvals: removal.approvals.map((approval) => ({
              id: approval.id,
              level: approval.level,
              approval: approval.approval,
              signature: approval.signature,
              signatureDate: approval.signatureDate
                ? approval.signatureDate.toISOString()
                : null,
              approverId: approval.approverId,
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
