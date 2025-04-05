({
  access: 'public',
  method: async ({ id, name }) => {
    const appError = await lib.appError();

    try {
      if (!id || !name)
        return {
          status: 'error',
          response: { msg: 'Department ID and new name are required' },
        };

      const department = await prisma.department.findUnique({ where: { id } });
      if (!department)
        return {
          status: 'error',
          response: { msg: 'Department not found' },
        };

      const updated = await prisma.department.update({
        where: { id },
        data: { name },
      });

      return {
        status: 'success',
        response: {
          msg: 'Department updated successfully',
          department: { id: updated.id, name: updated.name },
        },
      };
    } catch (e) {
      throw new appError(e.message, 500);
    } finally {
      await prisma.$disconnect();
    }
  },
});
