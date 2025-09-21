async (eventId, opts = {}) => {
  console.log({ eventId, opts });
  const rawLimit = Number(opts.limit ?? 20);
  const limit = Math.max(1, Math.min(rawLimit, 20));
  const offset = Number(opts.offset ?? 0);
  const search = (opts.search || '').toString().trim();
  const rawStatus = (opts.status || '').toString().trim();
  const sortBy = 'created_at';
  const sortDir = 'DESC';

  const params = [Number(eventId)];
  const whereParts = ['event_id = $1'];
  if (search) {
    params.push(`%${search}%`);
    whereParts.push(`(
      first_name ILIKE $${params.length} OR
      last_name ILIKE $${params.length} OR
      flight_number ILIKE $${params.length} OR
      property_name ILIKE $${params.length}
    )`);
  }
  // Optional status filter
  if (rawStatus && rawStatus.toLowerCase() !== 'all') {
    const toDbStatus = (s) => {
      const v = String(s || '')
        .toLowerCase()
        .trim();
      if (v === 'arrived') return 'arrived';
      if (v === 'delay' || v === 'delayed') return 'delay';
      if (v === 'no show' || v === 'no_show' || v === 'no-show')
        return 'no_show';
      if (v === 're scheduled' || v === 're_scheduled' || v === 'rescheduled')
        return 'rescheduled';
      if (v === 'default' || v === 'pending') return 'pending';
      return v;
    };
    const list = rawStatus.split(',').map(toDbStatus).filter(Boolean);
    if (list.length > 0) {
      params.push(list);
      whereParts.push(`status = ANY($${params.length}::text[])`);
    }
  }
  params.push(limit);
  const limitIdx = params.length;
  params.push(offset);
  const offsetIdx = params.length;

  const sql = `
    SELECT
      flight_id,
      event_id,
      first_name,
      last_name,
      flight_number,
      arrival_time,
      property_id,
      property_name,
      vehicle_standby_arrival_time,
      departure_time,
      vehicle_standby_departure_time,
      status,
      created_at
    FROM "FlightSchedule"
    WHERE ${whereParts.join(' AND ')}
    ORDER BY ${sortBy} ${sortDir}
    LIMIT $${limitIdx} OFFSET $${offsetIdx}
  `;
  const { rows } = await db.pg.query(sql, params);
  return rows;
};
