({
  access: 'public',
  method: async () => {
    const appError = await lib.appError();
    try {
      const reasons = await prisma.removalReason.findMany({
        orderBy: { name: 'asc' },
        select: { id: true, name: true },
      });

      return {
        status: 'success',
        response: {
          msg: 'Removal reasons fetched successfully',
          reasons,
        },
      };
    } catch (e) {
      throw new appError(e.message, 500);
    } finally {
      await prisma.$disconnect();
    }
  },
});
