({
  access: 'flight_schedule.read',
  method: async ({ eventId, opts }) => {
    console.log({ eventId, opts });
    try {
      const res = await domain.schedules.list(eventId, opts);
      return { status: 'fulfilled', response: res };
    } catch (err) {
      console.error('schedules/list error:', err);
      return { status: 'rejected', response: 'DB error' };
    }
  },
});
