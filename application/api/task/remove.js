({
  access: 'public',
  method: async (taskId, eventId) => {
    try {
      const res = await domain.task.remove(taskId, eventId);
      return { status: 'fulfilled', response: res };
    } catch (err) {
      console.error('task/remove error:', err);
      return { status: 'rejected', response: 'DB error' };
    }
  },
});
