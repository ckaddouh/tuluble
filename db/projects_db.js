const db = require("./db_connection");

const read_projects_all_sql = `
SELECT
    project_name, project_id, client, date
FROM
    projects
`

