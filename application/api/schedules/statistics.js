({
  access: 'flight_schedule.read',
  method: async ({ eventId }) => {
    try {
      const res = await domain.schedules.statistics(eventId);
      return { status: 'fulfilled', response: res };
    } catch (err) {
      console.error('schedules/statistics error:', err);
      return { status: 'rejected', response: 'DB error' };
    }
  },
});
