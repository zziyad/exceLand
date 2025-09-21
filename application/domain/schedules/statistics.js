async (eventId) => {
  console.log({ eventId });

  const sql = `
    SELECT
      COUNT(*) as total_passengers,
      COUNT(DISTINCT flight_number) as unique_flights,
      COUNT(DISTINCT property_name) as unique_properties,
      COUNT(DISTINCT DATE(arrival_time)) as travel_days,
      COUNT(CASE WHEN status = 'arrived' THEN 1 END) as arrived_count,
      COUNT(CASE WHEN status = 'delay' THEN 1 END) as delay_count,
      COUNT(CASE WHEN status = 'no_show' THEN 1 END) as no_show_count,
      COUNT(CASE WHEN status = 'rescheduled' THEN 1 END) as rescheduled_count,
      COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count
    FROM "FlightSchedule"
    WHERE event_id = $1
  `;

  const { rows } = await db.pg.query(sql, [Number(eventId)]);
  const stats = rows[0] || {};

  return {
    totalPassengers: parseInt(stats.total_passengers) || 0,
    uniqueFlights: parseInt(stats.unique_flights) || 0,
    uniqueProperties: parseInt(stats.unique_properties) || 0,
    travelDays: parseInt(stats.travel_days) || 0,
    statusCounts: {
      arrived: parseInt(stats.arrived_count) || 0,
      delay: parseInt(stats.delay_count) || 0,
      noShow: parseInt(stats.no_show_count) || 0,
      rescheduled: parseInt(stats.rescheduled_count) || 0,
      pending: parseInt(stats.pending_count) || 0,
    },
  };
};
