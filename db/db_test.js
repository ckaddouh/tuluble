const db = require("./db_connection");

const read_inventory_all_sql = `
    SELECT
        formula_id, test_name
    FROM
        formulas
`

const read_projects_all_sql = `
    SELECT
        project_name, project_id, client, date
    FROM
        projects
`

db.execute(read_inventory_all_sql, (error, result) => {
    if (error)
      throw error;
    console.log(result);
});

db.execute(read_projects_all_sql, (error, result) => {
    if (error)
      throw error;
    console.log(result);
});
// // Add query request
// db.execute('Select 1 + 1 AS solution',
//     (error, results) => {
//         if (error)
//             throw error;
//         console.log(results);
//     }
// );

db.end();
