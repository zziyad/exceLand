({
  access: 'public',
  method: async ({ id, newPassword }) => {
    const appError = await lib.appError();
    try {
      if (!id || !newPassword)
        return {
          status: 'error',
          response: { msg: 'User ID and new password are required' },
        };

      const user = await prisma.user.findUnique({ where: { id } });
      if (!user)
        return {
          status: 'error',
          response: { msg: 'User not found' },
        };

      const hash = await metarhia.metautil.hashPassword(newPassword);

      await prisma.user.update({
        where: { id },
        data: { password: hash },
      });

      return {
        status: 'success',
        response: { msg: 'Password reset successfully' },
      };
    } catch (e) {
      throw new appError(e.message, 500);
    } finally {
      await prisma.$disconnect();
    }
  },
});
