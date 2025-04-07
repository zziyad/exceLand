({
  access: 'public',
  method: async ({ id }) => {
    const appError = await lib.appError();
    try {
      if (!id)
        return {
          status: 'error',
          response: { msg: 'Reason ID is required' },
        };

      const reason = await prisma.removalReason.findUnique({ where: { id } });
      if (!reason)
        return {
          status: 'error',
          response: { msg: 'Removal reason not found' },
        };

      await prisma.removalReason.delete({ where: { id } });

      return {
        status: 'success',
        response: { msg: 'Removal reason deleted successfully' },
      };
    } catch (e) {
      throw new appError(e.message, 500);
    } finally {
      await prisma.$disconnect();
    }
  },
});
