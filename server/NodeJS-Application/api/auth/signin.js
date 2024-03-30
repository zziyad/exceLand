({
  access: 'public',
  method: async ({ email, password }) => {
    if (!email && !password) throw new Error('No argument was passed');
    const { getUser, generateToken } = api.auth.provider();
    const user = await getUser(email);
    if (!user) return { status: 'rejected', response: 'Incorrect login' };
    const { id, password: hash, is_admin } = user;
    const valid = await metarhia.metautil.validatePassword(password, hash);
    if (!valid) return { status: 'rejected', response: 'Incorrect login' };
    console.log(`Logged user: ${email}`);
    const token = generateToken();
    const data = { id, isAdmin: is_admin };
    context.client.startSession(token, data);
    const { password: pass, ...rest } = user;
    return { status: 'logged', response: rest };
  },
});
