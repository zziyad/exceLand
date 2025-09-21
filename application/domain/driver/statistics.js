async (eventId) => {
  if (!eventId) {
    throw new Error('Event ID is required');
  }

  try {
    const query = `
      SELECT 
        COUNT(*) as total_drivers,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_drivers,
        COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_drivers,
        COUNT(CASE WHEN status = 'suspended' THEN 1 END) as suspended_drivers,
        COUNT(CASE WHEN photo_base64 IS NOT NULL THEN 1 END) as drivers_with_photos,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN 1 END) as drivers_added_this_week
      FROM "Driver"
      WHERE event_id = $1
    `;

    const result = await db.pg.query(query, [eventId]);

    if (result.rows.length === 0) {
      return {
        total_drivers: 0,
        active_drivers: 0,
        inactive_drivers: 0,
        suspended_drivers: 0,
        drivers_with_photos: 0,
        drivers_added_this_week: 0,
      };
    }

    return result.rows[0];
  } catch (error) {
    throw error;
  }
};
