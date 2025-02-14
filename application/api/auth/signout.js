({
  access: 'public',
  method: async () => {
    console.log('SIGN OUT');
    context.client.removeSession(context.client.session.state.sessionId);
    context.client.destroy();
    return { status: 'fulfilled', reasponse: 'User has been signed out' };
  },
});
