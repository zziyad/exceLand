({
  access: 'private',
  method: async (post) => {
    if (Object.keys(post).length === 0) {
      return { status: 'rejected', response: 'Empty post object' };
    }
    const { id } = context.client.session.state;
    console.log({ post });
    try {
      const result = await domain.post.create(post, id);
      console.log({ result });
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
