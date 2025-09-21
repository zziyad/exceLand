({
  access: 'event.update',
  method: async ({ id, patch }) => {
    console.log({ 'event/update': { id, patch } });
    try {
      const res = await domain.event.update(id, patch);
      return { status: 'fulfilled', response: res };
    } catch (err) {
      console.error('event/update error:', err);
      return { status: 'rejected', response: 'DB error' };
    }
  },
});
