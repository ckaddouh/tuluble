const db = require("./db_connection");

const query_all_projects_sql = `
SELECT
    project_name, project_id, client, date
FROM
    projects
`

function get_all_projects() {
    return db.queryPromise(query_all_projects_sql,[]);
}

const query_single_project_sql = `
SELECT
    project_name, project_id, client, date
FROM
    projects
`

function get_single_project() {
    return db.queryPromise(query_single_project_sql, [])
}