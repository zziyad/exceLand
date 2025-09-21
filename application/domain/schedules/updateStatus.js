async (flightId, status) => {
  console.log({ flightId, status });
  if (!flightId || !status) return { updated: 0 };
  const sql = `
    UPDATE "FlightSchedule"
    SET status = $2, updated_at = now()
    WHERE flight_id = $1
    RETURNING flight_id
  `;
  const { rowCount } = await db.pg.query(sql, [
    Number(flightId),
    String(status),
  ]);
  return { updated: rowCount };
};
