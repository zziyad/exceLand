({
  access: 'private',
  method: async ({ post_id }) => {
    console.log({ post_id });
    try {
      const result = await domain.post.delete(post_id);
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
