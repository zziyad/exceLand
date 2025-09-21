async (id) => {
  if (!id) {
    throw new Error('Driver ID is required');
  }

  try {
    const query = `DELETE FROM "Driver" WHERE id = $1 RETURNING id, full_name`;
    const result = await db.pg.query(query, [id]);

    if (result.rows.length === 0) {
      throw new Error('Driver not found');
    }

    return { success: true, deletedDriver: result.rows[0] };
  } catch (error) {
    throw error;
  }
};
