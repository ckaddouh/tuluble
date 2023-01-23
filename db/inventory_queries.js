const db = require("./db_connection");

const read_inventory_all_sql = `
    SELECT
        ingredient_id, trade_name, classifier_id, lot_num, shelf, inci_name, amt, expiration, date_received, tsca_approved, supplier, unit
    FROM
        ingredient
`

function get_inventory() {
    return db.queryPromise(read_inventory_all_sql,[]);
}
