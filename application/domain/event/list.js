async () => {
  const sql = `
    SELECT id, name, description, expected_guests, timezone,
           start_at, end_at, organizer_name, status,
           max_vapp, max_fleet, country_code, city, created_at, updated_at
    FROM "Event"
    ORDER BY created_at DESC
  `;
  const { rows: events } = await db.pg.query(sql);
  return events;
};
