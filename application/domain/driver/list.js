async (eventId, opts = {}) => {
  const { status, limit = 100, offset = 0 } = opts;

  let query = `
    SELECT id, event_id, full_name, national_id, nationality, phone_number, 
           CASE WHEN photo_base64 IS NOT NULL THEN 'has_photo' ELSE NULL END as photo_status,
           status, created_at, updated_at
    FROM "Driver"
    WHERE event_id = $1
  `;

  const values = [eventId];
  let paramCount = 1;

  // Add status filter if provided
  if (status) {
    paramCount++;
    query += ` AND status = $${paramCount}`;
    values.push(status);
  }

  // Add ordering and pagination
  query += ` ORDER BY created_at DESC LIMIT $${paramCount + 1} OFFSET $${
    paramCount + 2
  }`;
  values.push(limit, offset);

  try {
    const result = await db.pg.query(query, values);
    return result.rows;
  } catch (error) {
    throw error;
  }
};
