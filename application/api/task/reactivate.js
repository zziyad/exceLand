({
  access: 'public',
  method: async (taskId, eventId) => {
    try {
      const res = await domain.task.reactivate(taskId, eventId);
      return { status: 'fulfilled', response: res };
    } catch (err) {
      console.error('task/reactivate error:', err);
      return { status: 'rejected', response: 'DB error' };
    }
  },
});
