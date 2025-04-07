({
  access: 'public',
  method: async ({ page = 1, limit = 10 }) => {
    const appError = await lib.appError();

    try {
      // Validate pagination parameters
      const parsedPage = parseInt(page);
      const parsedLimit = parseInt(limit);
      if (isNaN(parsedPage) || parsedPage < 1) {
        return {
          status: 'error',
          response: { msg: 'Invalid page number. Must be a positive integer.' },
        };
      }
      if (isNaN(parsedLimit) || parsedLimit < 1) {
        return {
          status: 'error',
          response: { msg: 'Invalid limit. Must be a positive integer.' },
        };
      }

      // Calculate skip value for pagination
      const skip = (parsedPage - 1) * parsedLimit;

      // Fetch total count of removals for pagination
      const total = await prisma.removal.count();

      // Fetch removals with related data
      const removals = await prisma.removal.findMany({
        skip,
        take: parsedLimit,
        orderBy: { createdAt: 'desc' }, // Sort by creation date, newest first
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
        },
      });

      // Calculate total pages
      const totalPages = Math.ceil(total / parsedLimit);

      // Format the response
      const formattedRemovals = removals.map((removal) => ({
        id: removal.id,
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
        status: removal.status,
        createdAt: removal.createdAt.toISOString(),
      }));

      return {
        status: 'success',
        response: {
          msg: 'Removal requests retrieved successfully',
          removals: formattedRemovals,
          pagination: {
            total,
            page: parsedPage,
            limit: parsedLimit,
            pages: totalPages,
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
