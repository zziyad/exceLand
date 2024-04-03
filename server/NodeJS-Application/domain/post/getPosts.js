async (values) => {
  try {
    const query = `
      SELECT * FROM get_posts($1, $2, $3, $4, $5, $6, $7, $8)`;

    const result = await db.pg.query(query, values);

    return result.rows;
  } catch (error) {
    throw new Error('Error executing PostgreSQL function:', error);
  }
};
