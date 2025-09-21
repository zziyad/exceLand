({
  access: 'driver.update',
  method: async (payload) => {
    try {
      const res = await domain.driver.update(payload);
      return { status: 'fulfilled', response: res };
    } catch (err) {
      console.error('driver/update error:', err);
      return { status: 'rejected', response: err.message || 'DB error' };
    }
  },
});
