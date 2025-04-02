({
  access: 'public',
  method: async ({ email, password }) => {
    console.log({ email, password });

    if (!email && !password)
      return {
        status: 'error',
        response: { msg: 'one of arguments was not passed' },
      };
    const user = await prisma.user.findUnique({ where: { email } });

    console.log({ user });

    if (
      !user ||
      !(await metarhia.metautil.validatePassword(password, user.password))
    ) {
      return {
        status: 'error',
        response: { msg: 'Incorrect email or password' },
      };
    }
    const data = { user, sessionId: context.uuid };
    const token = await context.client.encrypt(data);
    console.log({ token });

    context.client.startSession(token);
    return {
      status: 'logged',
      response: { msg: 'You have successfully logged in', user },
    };
  },
});
