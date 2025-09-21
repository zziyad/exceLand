({
  access: 'flight_schedule.upload',
  method: async ({ eventId, batch }) => {
    try {
      const res = await domain.schedules.create(eventId, batch);
      return { status: 'fulfilled', response: res };
    } catch (err) {
      console.error('schedules/import error:', err);
      return { status: 'rejected', response: 'DB error' };
    }
  },
});

// ({
//   access: 'public',
//   method: async (id, batch) => {
//     if (Object.keys(batch).length === 0) {
//       return { status: 'rejected', response: 'Empty object' };
//     }
//     // const { id } = context.client.session.state;
//     try {
//       const result = await domain.schedules.create(id, batch);
//       return { status: 'fulfilled' };
//     } catch (error) {
//       console.error({ ERRRR: error });
//       return {
//         status: 'rejected',
//         response: error.message,
//       };
//     }
//   },
// });
