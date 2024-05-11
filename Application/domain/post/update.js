async (formData) => {
  try {
    const { postId, ...rest } = formData;
    await db.pg.update('posts', { ...rest }, { id: postId });
    return { status: 'fulfilled', response: 'Update successful' };
  } catch (error) {
    return { status: 'rejected', response: 'Server error' };
  }
};
