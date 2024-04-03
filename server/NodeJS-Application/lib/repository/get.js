async (ctx, entity, sql = null) => {
  console.log({ db });
  const Entity = class { };
  const desc = { value: entity };
  Object.defineProperty(Entity, 'name', desc);
  // const sqlQuery = sql === null ? sql = `SELECT ${entity} WHERE id = $1` : sql
  return async (param) => {
    const { rows } = await db.pg.query(sql, param);
    return Object.assign(new Entity(), rows[0]);
  };
};

