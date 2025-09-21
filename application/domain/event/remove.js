async (id) => {
  const { rowCount } = await db.pg.query('DELETE FROM "Event" WHERE id = $1', [
    Number(id),
  ]);
  return { deleted: rowCount };
};
