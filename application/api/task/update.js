({
  access: 'public',
  method: async (id, patch) => {
    try {
      const res = await domain.task.update(id, patch);
      return { status: 'fulfilled', response: res };
    } catch (err) {
      console.error('task/update error:', err);
      return { status: 'rejected', response: 'DB error' };
    }
  },
});
