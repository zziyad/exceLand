({
  access: 'event.create',
  method: async (payload) => {
    try {
      const res = await domain.event.create(payload);
      return { status: 'fulfilled', response: res };
    } catch (err) {
      console.error('event/create error:', err);
      return { status: 'rejected', response: 'DB error' };
    }
  },
});
