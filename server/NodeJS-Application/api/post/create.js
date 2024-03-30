({
  access: 'private',
  method: async (post) => {
    const { id } = context.client.session.state;
    try {
      const result = await domain.post.create(post, id);
      console.log({ result })
      return { status: 'fulfilled', response: result };
    } catch (error) {
      console.error(error);
      return {
        status: 'rejected',
        response: error,
      };
    }
  },
});
