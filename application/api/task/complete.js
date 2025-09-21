({
  access: 'public',
  method: async (taskId, eventId) => {
    try {
      const res = await domain.task.complete(taskId, eventId);
      return { status: 'fulfilled', response: res };
    } catch (err) {
      console.error('task/complete error:', err);
      return { status: 'rejected', response: 'DB error' };
    }
  },
});
