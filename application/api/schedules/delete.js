({
  access: 'flight_schedule.delete',
  method: async ({ flightId }) => {
    try {
      const res = await domain.schedules.delete(flightId);
      return { status: 'fulfilled', response: res };
    } catch (err) {
      console.error('schedules/delete error:', err);
      return { status: 'rejected', response: 'DB error' };
    }
  },
});
