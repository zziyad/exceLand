({
  access: 'public',
  method: async ({
    startIndex = 0,
    limit = 9,
    order = 'desc',
    userId = null,
    category = null,
    slug = null,
    postId = null,
    searchTerm = null,
  }) => {
    const values = [
      startIndex,
      limit,
      order,
      userId,
      category,
      slug,
      postId,
      searchTerm,
    ];
    try {
      const result = await domain.post.getPosts(values);
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
