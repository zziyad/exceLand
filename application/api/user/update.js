({
  access: 'public',
  method: async ({ id, data }) => {
    const appError = await lib.appError();
    const { updateUser } = api.user.provider();
    try {
      const user = await updateUser();
      return users;
    } catch (error) {
      new appError('Email already exists', 400);
    } finally {
      await prisma.$disconnect();
    }
  },
});
