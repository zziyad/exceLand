({
  access: 'public',
  method: async () => {
    const appError = await lib.appError();
    const { getActiveUsers } = api.user.provider();
    try {
      const users = await getActiveUsers();
      return users;
    } catch (error) {
      new appError('Email already exists', 400);
    } finally {
      await prisma.$disconnect();
    }
  },
});
