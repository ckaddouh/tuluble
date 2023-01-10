SELECT
    project_name, project_id, client, date
FROM
    projects
WHERE
    project_id = ?

-- WILL DELETE SOON