({
  access: 'public',
  method: async (taskData) => {
    try {
      const res = await domain.task.create(taskData);
      return { status: 'fulfilled', response: res };
    } catch (err) {
      console.error('task/create error:', err);
      return { status: 'rejected', response: 'DB error' };
    }
  },
});
