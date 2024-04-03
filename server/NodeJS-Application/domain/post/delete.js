async (post_id) => {
  try {
    const query = 'DELETE FROM posts WHERE id = $1';
    await db.pg.query(query, [post_id]);
    return 'The post has been deleted';
  } catch (error) {
    throw new Error(error);
  }
};
