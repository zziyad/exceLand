({
  access: 'driver.delete',
  method: async ({ id }) => {
    try {
      const res = await domain.driver.delete(id);
      return { status: 'fulfilled', response: res };
    } catch (err) {
      console.error('driver/delete error:', err);
      return { status: 'rejected', response: err.message || 'DB error' };
    }
  },
});
