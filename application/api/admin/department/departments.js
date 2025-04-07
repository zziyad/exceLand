({
  access: 'public',
  method: async () => {
    const appError = await lib.appError();

    try {
      const departments = await prisma.department.findMany({
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          _count: {
            select: { users: true },
          },
        },
      });

      return {
        status: 'success',
        response: {
          msg: 'Departments fetched successfully',
          departments: departments.map((d) => ({
            id: d.id,
            name: d.name,
            userCount: d._count.users,
          })),
        },
      };
    } catch (e) {
      throw new appError(e.message, 500);
    } finally {
      await prisma.$disconnect();
    }
  },
});
