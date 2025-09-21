({
  access: 'event.read',
  method: async () => {
    try {
      const res = await domain.event.list();
      console.log({ event_list: res });
      return { status: 'fulfilled', response: res };
    } catch (err) {
      console.error('event/list error:', err);
      return { status: 'rejected', response: 'DB error' };
    }
  },
});
