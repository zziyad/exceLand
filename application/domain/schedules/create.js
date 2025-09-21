async (eventId, batch) => {
  console.log({ eventId, batch });
  // Validate inputs (light validation; upstream should already validate)
  if (!Array.isArray(batch) || !eventId) return 'INVALID_INPUT';

  // Ensure event exists to satisfy FK
  const { rowCount: eventExists } = await db.pg.query(
    'SELECT 1 FROM "Event" WHERE id = $1',
    [Number(eventId)],
  );
  if (!eventExists) return 'EVENT_NOT_FOUND';

  // Build parameterized multi-row insert
  const cols = [
    'event_id',
    'first_name',
    'last_name',
    'flight_number',
    'arrival_time',
    'property_id',
    'property_name',
    'vehicle_standby_arrival_time',
    'departure_time',
    'vehicle_standby_departure_time',
    'status',
    'created_at',
  ];

  const values = [];
  const params = [];
  let p = 1;

  const normalizeStatus = (s) => {
    const v = String(s || '')
      .toLowerCase()
      .trim();
    if (v === 'arrived') return 'arrived';
    if (v === 'delay' || v === 'delayed') return 'delay';
    if (v === 'no show' || v === 'no_show' || v === 'no-show') return 'no_show';
    if (v === 're scheduled' || v === 're_scheduled' || v === 'rescheduled')
      return 'rescheduled';
    if (v === 'pending') return 'pending';
    // treat undefined/empty/'default' and any unknown as 'pending'
    return 'pending';
  };
  for (const row of batch) {
    // Coerce types and defaults
    const v = [
      Number(eventId),
      String(row.first_name || ''),
      String(row.last_name || ''),
      String(row.flight_number || ''),
      new Date(row.arrival_time),
      row.property_id ? Number(row.property_id) : null,
      String((row.property_name || '').trim()),
      row.vehicle_standby_arrival_time
        ? new Date(row.vehicle_standby_arrival_time)
        : new Date(row.arrival_time),
      new Date(row.departure_time),
      row.vehicle_standby_departure_time
        ? new Date(row.vehicle_standby_departure_time)
        : new Date(row.departure_time),
      normalizeStatus(row.status),
      row.created_at ? new Date(row.created_at) : new Date(),
    ];
    params.push(...v);
    values.push(`(${cols.map(() => '$' + p++).join(',')})`);
  }

  const sql = `
    INSERT INTO "FlightSchedule" (
      ${cols.join(',')}
    ) VALUES ${values.join(',')}
    ON CONFLICT (event_id, flight_number, arrival_time, last_name)
    DO UPDATE SET
      property_id = COALESCE(EXCLUDED.property_id, "FlightSchedule".property_id),
      property_name = EXCLUDED.property_name,
      vehicle_standby_arrival_time = EXCLUDED.vehicle_standby_arrival_time,
      departure_time = EXCLUDED.departure_time,
      vehicle_standby_departure_time = EXCLUDED.vehicle_standby_departure_time,
      status = EXCLUDED.status,
      updated_at = now()
    RETURNING flight_id
  `;

  // Optional transaction for atomicity per batch
  await db.pg.query('BEGIN');
  try {
    const result = await db.pg.query(sql, params);
    await db.pg.query('COMMIT');
    return { inserted: result.rows.length };
  } catch (err) {
    await db.pg.query('ROLLBACK');
    throw err;
  }
};
