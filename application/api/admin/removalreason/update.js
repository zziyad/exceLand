({
  access: 'public',
  method: async ({ id, name }) => {
    const appError = await lib.appError();
    try {
      if (!id || !name)
        return {
          status: 'error',
          response: { msg: 'Both ID and new name are required' },
        };

      const reason = await prisma.removalReason.findUnique({ where: { id } });
      if (!reason)
        return {
          status: 'error',
          response: { msg: 'Removal reason not found' },
        };

      const updated = await prisma.removalReason.update({
        where: { id },
        data: { name },
      });

      return {
        status: 'success',
        response: {
          msg: 'Removal reason updated successfully',
          reason: { id: updated.id, name: updated.name },
        },
      };
    } catch (e) {
      throw new appError(e.message, 500);
    } finally {
      await prisma.$disconnect();
    }
  },
});
