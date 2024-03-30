async (post, id) => {
  const { create } = await lib.repository;
  const { title, content, category, image } = post;
  const slug = title
    .split(' ')
    .join('-')
    .toLowerCase()
    .replace(/[^a-zA-Z0-9-]/g, '');
  try {
    const postClass = await create('posts', 'id');
    const newPost = await postClass({
      user_id: id,
      title,
      content,
      category,
      image,
      slug,
    });

    return newPost;
  } catch (error) {
    throw new Error(error);
  }
};
