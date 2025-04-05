({
  access: 'public',
  method: async ({
    fullName,
    email,
    password,
    position, // Added required field
    role = 'LEVEL_1', // Updated default role to match enum
    departmentId,
  }) => {
    const appError = await lib.appError();
    try {
      // Validate required fields
      if (!fullName || !email || !password || !position || !departmentId) {
        return {
          status: 'error',
          response: new appError(
            'All fields (fullName, email, password, position, departmentId) are required',
            400,
          ),
        };
      }

      // Check if email already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        return {
          status: 'error',
          response: new appError('Email already exists', 400),
        };
      }

      // Validate role is part of the Role enum
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

      const hash = await metarhia.metautil.hashPassword(password);

      const newUser = await prisma.user.create({
        data: {
          fullName,
          email,
          password: hash,
          position, // New required field
          role, // Will use the validated role
          departmentId: parseInt(departmentId),
        },
      });

      return {
        status: 'success',
        response: {
          msg: 'User registered successfully',
          user: {
            id: newUser.id,
            fullName: newUser.fullName,
            email: newUser.email,
            position: newUser.position,
            role: newUser.role,
            departmentId: newUser.departmentId,
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
