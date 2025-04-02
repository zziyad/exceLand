({
  access: 'public',
  method: async ({ id }) => {
    const appError = await lib.appError();
    const { deactivateUser } = api.user.provider();
    try {
      const users = await deactivateUser(id);
      return users;
    } catch (error) {
      new appError('Email already exists', 400);
    } finally {
      await prisma.$disconnect();
    }
  },
});
