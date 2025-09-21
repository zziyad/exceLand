({
  access: 'public',
  method: async (eventId, options) => {
    try {
      const res = await domain.task.list(eventId, options);
      return { status: 'fulfilled', response: res };
    } catch (err) {
      console.error('task/list error:', err);
      return { status: 'rejected', response: 'DB error' };
    }
  },
});
