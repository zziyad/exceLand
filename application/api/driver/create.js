({
  access: 'driver.create',
  method: async (payload) => {
    try {
      const res = await domain.driver.create(payload);
      return { status: 'fulfilled', response: res };
    } catch (err) {
      console.error('driver/create error:', err);
      return { status: 'rejected', response: err.message || 'DB error' };
    }
  },
});
