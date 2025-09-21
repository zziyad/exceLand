async (id, patch) => {
  const fields = [];
  const params = [];
  let p = 1;
  const set = (col, val) => {
    fields.push(`${col}=$${p++}`);
    params.push(val);
  };

  if (patch.name !== undefined) set('name', String(patch.name));
  if (patch.description !== undefined)
    set('description', String(patch.description));
  if (patch.expected_guests !== undefined)
    set('expected_guests', Number(patch.expected_guests));
  if (patch.venue_name !== undefined)
    set('venue_name', String(patch.venue_name));
  if (patch.timezone !== undefined) set('timezone', String(patch.timezone));
  if (patch.start_at !== undefined) set('start_at', new Date(patch.start_at));
  if (patch.end_at !== undefined) set('end_at', new Date(patch.end_at));
  if (patch.organizer_name !== undefined)
    set('organizer_name', String(patch.organizer_name));
  if (patch.status !== undefined) set('status', String(patch.status));
  if (patch.max_vapp !== undefined) set('max_vapp', Number(patch.max_vapp));
  if (patch.max_fleet !== undefined) set('max_fleet', Number(patch.max_fleet));
  if (patch.country_code !== undefined) set('country_code', patch.country_code);
  if (patch.city !== undefined) set('city', patch.city);
  if (patch.settings !== undefined) set('settings', patch.settings);

  if (fields.length === 0) return { updated: 0 };
  params.push(Number(id));

  const sql = `UPDATE "Event" SET ${fields.join(
    ', ',
  )}, updated_at = now() WHERE id = $${p} RETURNING id`;
  const { rowCount } = await db.pg.query(sql, params);
  return { updated: rowCount };
};
