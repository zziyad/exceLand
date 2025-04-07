({
  access: 'public',
  method: async ({ email, password }) => {
    if (!email || !password) {
      return {
        status: 'error',
        response: { msg: 'Email and password are required' },
      };
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        department: {
          select: { name: true },
        },
      },
    });

    if (
      !user ||
      !(await metarhia.metautil.validatePassword(password, user.password))
    ) {
      return {
        status: 'error',
        response: { msg: 'Incorrect email or password' },
      };
    }

    const formattedUser = {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      position: user.position,
      role: user.role,
      departmentName: user.department.name,
      // expiry: config.sessions.expiry,
    };
    console.log({ formattedUser });

    const data = { user: formattedUser, sessionId: context.uuid };
    const token = await context.client.encrypt(data);
    console.log({ token });
    context.client.session = {
      id: user.id,
      role: user.role,
      departmentName: user.department.name,
    };

    console.log({ context });

    context.client.startSession(token);

    return {
      status: 'logged',
      response: {
        msg: 'You have successfully logged in',
        user: formattedUser,
      },
    };
  },
});
