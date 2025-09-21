async (eventId, format = 'excel') => {
  console.log({ eventId, format });

  // Get all flight schedules for the event
  const sql = `
    SELECT
      flight_id,
      event_id,
      first_name,
      last_name,
      flight_number,
      arrival_time,
      property_name,
      vehicle_standby_arrival_time,
      departure_time,
      vehicle_standby_departure_time,
      status,
      created_at
    FROM "FlightSchedule"
    WHERE event_id = $1
    ORDER BY arrival_time ASC
  `;

  const { rows } = await db.pg.query(sql, [Number(eventId)]);

  if (format === 'csv') {
    // Generate CSV format
    const headers = [
      'Flight ID',
      'First Name',
      'Last Name',
      'Flight Number',
      'Arrival Time',
      'Property Name',
      'Vehicle Standby Arrival',
      'Departure Time',
      'Vehicle Standby Departure',
      'Status',
      'Created At',
    ];

    const csvRows = rows.map((row) => [
      row.flight_id,
      row.first_name,
      row.last_name,
      row.flight_number,
      row.arrival_time,
      row.property_name,
      row.vehicle_standby_arrival_time,
      row.departure_time,
      row.vehicle_standby_departure_time,
      row.status,
      row.created_at,
    ]);

    const csvContent = [headers, ...csvRows]
      .map((row) =>
        row
          .map((field) => `"${String(field || '').replace(/"/g, '""')}"`)
          .join(','),
      )
      .join('\n');

    return {
      format: 'csv',
      content: csvContent,
      filename: `flight-schedules-${eventId}-${
        new Date().toISOString().split('T')[0]
      }.csv`,
    };
  } else {
    // Return data for Excel processing (client-side)
    return {
      format: 'excel',
      data: rows,
      filename: `flight-schedules-${eventId}-${
        new Date().toISOString().split('T')[0]
      }.xlsx`,
    };
  }
};
