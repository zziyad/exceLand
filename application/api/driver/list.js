({
  access: 'driver.read',
  method: async ({ eventId, opts }) => {
    console.log({ eventId, opts });
    try {
      const res = await domain.driver.list(eventId, opts);
      return { status: 'fulfilled', response: res };
    } catch (err) {
      console.error('driver/list error:', err);
      return { status: 'rejected', response: err.message || 'DB error' };
    }
  },
});
