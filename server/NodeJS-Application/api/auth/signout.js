({
  access: 'public',
  method: async () => {
    context.client.destroy();
    return { status: 'User has been signed out' };
  },
});
