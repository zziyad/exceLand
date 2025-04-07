({
  access: 'public',
  method: async ({ name }) => {
    const appError = await lib.appError();
    try {
      if (!name)
        return {
          status: 'error',
          response: { msg: 'Reason name is required' },
        };

      const exists = await prisma.removalReason.findFirst({ where: { name } });
      if (exists)
        return {
          status: 'error',
          response: { msg: 'Removal reason already exists' },
        };

      const reason = await prisma.removalReason.create({
        data: { name },
      });

      return {
        status: 'success',
        response: {
          msg: 'Removal reason created successfully',
          reason: { id: reason.id, name: reason.name },
        },
      };
    } catch (e) {
      throw new appError(e.message, 500);
    } finally {
      await prisma.$disconnect();
    }
  },
});
