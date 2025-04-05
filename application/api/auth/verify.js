({
  access: 'public',
  method: async () => {
    const appError = await lib.appError();
    const token = await context.client.getCookies();
    // console.log({ token });
    if (!token || typeof token !== 'string') {
      return {
        status: 'error',
        error: 'No token provided',
      };
    }
    try {
      const decoded = await context.client.decrypt(token);
      // console.log({ decoded });
      return {
        status: 'logged', // Match React app expectation
        response: decoded,
      };
    } catch (error) {
      console.log({ verifyError: error.message });
      if (error.message === 'jwt expired') {
        return {
          status: 'error',
          error: 'Token has expired',
        };
      } else if (error.message === 'invalid token') {
        return {
          status: 'error',
          error: 'Invalid token',
        };
      }
      throw new appError(error.message, 500);
    }
  },
});
