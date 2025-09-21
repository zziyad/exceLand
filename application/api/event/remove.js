({
  access: 'event.delete',
  method: async ({ id }) => {
    try {
      const res = await domain.event.remove(id);
      return { status: 'fulfilled', response: res };
    } catch (err) {
      console.error('event/remove error:', err);
      return { status: 'rejected', response: 'DB error' };
    }
  },
});
