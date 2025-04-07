({
  access: 'public',
  method: async () => {
    const appError = await lib.appError();
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          fullName: true,
          email: true,
          position: true,
          role: true,
          department: {
            select: { name: true },
          },
        },
        orderBy: { email: 'asc' },
      });

      // Apply the standard formattedUser structure
      const formattedUsers = users.map((user) => ({
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        position: user.position,
        role: user.role,
        departmentName: user.department.name, // Extract department name
      }));

      return {
        status: 'success',
        response: {
          msg: 'Users fetched successfully',
          users: formattedUsers,
        },
      };
    } catch (e) {
      throw new appError(e.message, 500);
    } finally {
      await prisma.$disconnect();
    }
  },
});
