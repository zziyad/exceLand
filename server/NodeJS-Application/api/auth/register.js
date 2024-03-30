({
  access: 'public',
  method: async ({ username, password, email }) => {
    try {
      const { getUser } = api.auth.provider();
      const user = await getUser(email);
      if (user)
        return { status: 'rejected', response: 'User Name already exists' };
      const hash = await metarhia.metautil.hashPassword(password);
      await provider.registerUser(username, email, hash);
      return { status: 'success', response: 'Success registration' };
    } catch (error) {
      console.log({ errorR: error.stack });
      return {
        status: 'rejected',
        response: 'Server Error',
      };
    }
  },
});
