({
  access: 'public',
  method: async ({ email, password }) => {
    if (!email && !password)
      return {
        status: 'rejected',
        response: 'one of arguments was not passed',
      };
    const { getUser, generateToken } = api.auth.provider();
    const user = await getUser(email);
    if (!user) return { status: 'rejected', response: 'Incorrect login' };
    const { id, password: hash, is_admin } = user;
    const valid = await metarhia.metautil.validatePassword(password, hash);
    if (!valid) return { status: 'rejected', response: 'Incorrect password' };
    console.log(`Logged user: ${email}`);
    const token = generateToken();
    const data = { id, isAdmin: is_admin, sessionId: context.uuid };
    context.client.startSession(token, data);
    const { password: pass, ...rest } = user;
    return { status: 'logged', response: { ...rest, sessionId: context.uuid } };
  },
});
