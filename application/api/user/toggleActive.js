({
  access: 'public',
  method: async ({ id }) => {
    const appError = await lib.appError();
    const { toggleUserStatus } = api.user.provider();
    try {
      const users = await toggleUserStatus(id);
      return users;
    } catch (error) {
      new appError('Email already exists', 400);
    } finally {
      await prisma.$disconnect();
    }
  },
});
