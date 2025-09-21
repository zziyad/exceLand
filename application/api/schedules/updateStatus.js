({
  access: 'flight_schedule.update',
  method: async ({ flightId, status }) => {
    try {
      const res = await domain.schedules.updateStatus(flightId, status);
      return { status: 'fulfilled', response: res };
    } catch (err) {
      console.error('schedules/updateStatus error:', err);
      return { status: 'rejected', response: 'DB error' };
    }
  },
});
