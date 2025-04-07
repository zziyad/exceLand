({
  access: 'public',
  method: async ({ id }) => {
    const appError = await lib.appError();

    try {
      if (!id)
        return {
          status: 'error',
          response: { msg: 'Department ID is required' },
        };

      const department = await prisma.department.findUnique({ where: { id } });
      if (!department)
        return {
          status: 'error',
          response: { msg: 'Department not found' },
        };

      await prisma.department.delete({ where: { id } });

      return {
        status: 'success',
        response: { msg: 'Department deleted successfully' },
      };
    } catch (e) {
      throw new appError(e.message, 500);
    } finally {
      await prisma.$disconnect();
    }
  },
});
