({
  access: 'public',
  method: async ({ name }) => {
    try {
      if (!name)
        return {
          status: 'error',
          response: { msg: 'Department name is required' },
        };
      const existingDept = await prisma.department.findUnique({
        where: { name },
      });
      if (existingDept)
        return {
          status: 'error',
          response: { msg: 'Department already exists' },
        };

      const department = await prisma.department.create({
        data: {
          name,
        },
      });
      return {
        status: 'success',
        response: {
          msg: 'Department created successfully',
          department: { id: department.id, name: department.name },
        },
      };
    } catch (error) {
      throw new appError(e.message, 500);
    } finally {
      await prisma.$disconnect();
    }
  },
});
