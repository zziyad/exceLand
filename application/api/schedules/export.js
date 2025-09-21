({
  access: 'flight_schedule.read',
  method: async ({ eventId, format = 'excel' }) => {
    try {
      const res = await domain.schedules.export(eventId, format);
      return { status: 'fulfilled', response: res };
    } catch (err) {
      console.error('schedules/export error:', err);
      return { status: 'rejected', response: 'DB error' };
    }
  },
});
