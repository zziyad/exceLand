({
  access: 'public',
  method: async ({ id }) => {
    const appError = await lib.appError();
    try {
      if (!id)
        return {
          status: 'error',
          response: { msg: 'User ID is required' },
        };

      const user = await prisma.user.findUnique({ where: { id } });
      if (!user)
        return {
          status: 'error',
          response: { msg: 'User not found' },
        };

      await prisma.user.delete({ where: { id } });

      return {
        status: 'success',
        response: { msg: 'User deleted successfully' },
      };
    } catch (e) {
      throw new appError(e.message, 500);
    } finally {
      await prisma.$disconnect();
    }
  },
});
