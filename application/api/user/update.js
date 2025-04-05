({
  access: 'public',
  method: async ({ id, fullName, email, position, role, departmentId }) => {
    const appError = await lib.appError();
    try {
      if (!id) {
        return {
          status: 'error',
          response: new appError('User ID is required', 400),
        };
      }

      const user = await prisma.user.findUnique({ where: { id } });
      if (!user) {
        return {
          status: 'error',
          response: new appError('User not found', 404),
        };
      }

      // Validate role if provided
      if (role) {
        const validRoles = [
          'LEVEL_1',
          'LEVEL_2',
          'LEVEL_3',
          'LEVEL_4',
          'SECURITY',
          'ADMIN',
        ];
        if (!validRoles.includes(role)) {
          return {
            status: 'error',
            response: new appError('Invalid role specified', 400),
          };
        }
      }

      const updatedUser = await prisma.user.update({
        where: { id },
        data: {
          fullName: fullName || undefined,
          email: email || undefined,
          position: position || undefined,
          role: role || undefined,
          departmentId: departmentId ? parseInt(departmentId) : undefined,
        },
      });

      return {
        status: 'success',
        response: {
          msg: 'User updated successfully',
          user: {
            id: updatedUser.id,
            fullName: updatedUser.fullName,
            email: updatedUser.email,
            position: updatedUser.position,
            role: updatedUser.role,
            departmentId: updatedUser.departmentId,
          },
        },
      };
    } catch (e) {
      throw new appError(e.message, 500);
    } finally {
      await prisma.$disconnect();
    }
  },
});
