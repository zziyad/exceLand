({
  access: 'event.read',
  method: async () => {
    try {
      const res = await domain.event.statistics();
      console.log({ event_statistics: res });
      return { status: 'fulfilled', response: res };
    } catch (err) {
      console.error('event/statistics error:', err);
      return {
        status: 'rejected',
        response: 'Failed to fetch event statistics',
      };
    }
  },
});
