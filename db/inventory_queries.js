const db = require("./db_connection");

const read_inventory_all_sql = `
  SELECT
      trade_name, inci_name, lot_num, amt, expiration
  FROM
      ingredient
`

function get_inventory() {
    return db.queryPromise(read_inventory_all_sql,[]);
}
