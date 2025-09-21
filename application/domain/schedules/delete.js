async (flightId) => {
  console.log({ flightId });

  if (!flightId) return { deleted: 0 };

  const sql = `
    DELETE FROM "FlightSchedule"
    WHERE flight_id = $1
    RETURNING flight_id
  `;

  const { rowCount } = await db.pg.query(sql, [Number(flightId)]);
  return { deleted: rowCount };
};
