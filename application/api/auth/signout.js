({
  access: 'public',
  method: async () => {
    console.log('SIGN OUT');
    // context.client.removeSession(context.client.session.state.sessionId);
    context.client.removeSession();
    return {
      status: 'fulfilled',
      reasponse: { msg: 'Logged out successfully' },
    };
  },
});
