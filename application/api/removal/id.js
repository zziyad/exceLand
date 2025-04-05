({
  access: 'public',
  method: async ({ id }) => {
    const appError = await lib.appError();

    try {
      // Validate input
      if (!id || isNaN(parseInt(id))) {
        return {
          status: 'error',
          response: { msg: 'Valid removal ID is required' },
        };
      }

      // Fetch the removal by ID with related data
      const removal = await prisma.removal.findUnique({
        where: { id: parseInt(id) },
        include: {
          department: {
            select: { name: true }, // Get department name
          },
          removalReason: {
            select: { name: true }, // Get removal reason name
          },
          images: true, // Include associated images
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
            departmentName: removal.department.name, // Return department name instead of ID
            itemDescription: removal.itemDescription,
            removalReason: removal.removalReason.name, // Return reason name instead of ID
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
