({
  access: 'driver.read',
  method: async ({ eventId }) => {
    try {
      const res = await domain.driver.statistics(eventId);
      return { status: 'fulfilled', response: res };
    } catch (err) {
      console.error('driver/statistics error:', err);
      return { status: 'rejected', response: err.message || 'DB error' };
    }
  },
});
