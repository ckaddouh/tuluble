const db = require("./db_connection");

const read_projects_search_all_query = `
SELECT
  project_name, projects.project_id, client, date
FROM
  projects
WHERE
  projects.project_name LIKE ?
  AND projects.active = 1
`

const read_projects_search_query = `
SELECT
  project_name, projects.project_id, client, date
FROM
  projects, project_assign
WHERE
  projects.project_name LIKE ?
  AND project_assign.scientist_id = ?
  AND project_assign.project_id = projects.project_id
  AND projects.active = 1
`

const updateProjectQuery = `
  UPDATE 
    projects
  SET 
    project_name = ?, client = ?, date = ?, client_name = ?, client_email = ?
  WHERE 
    project_id = ?
`

const insertIntoProjectsQuery = `
  INSERT INTO 
    projects (project_name, client, date, client_name, client_email, active)
  VALUES (?, ?, ?, ?, ?, 1)
`

const getProjectIDQuery = `
  SELECT project_id
  FROM projects
  WHERE 
    project_name = ? AND client = ? AND date = ?
`

const assignScientistToProjectQuery = `
  INSERT INTO 
    project_assign (project_id, scientist_id)
    VALUES (?, ?)
`

const read_projects_all_sql_query = `
    SELECT
        project_name, project_id, client, date, client_name, client_email
    FROM
        projects
    WHERE 
      active = 1
`

const getProjectsAssignedToScientistQuery = `
  SELECT
    DISTINCT project_name, projects.project_id, client, date
  FROM
    projects, project_assign
  WHERE 
    active = 1
    AND project_assign.scientist_id = ?
    AND project_assign.project_id = projects.project_id
`

const archiveProjectQuery = `
  UPDATE projects
  SET active = 0
  WHERE project_id = ?
`

const getScientistIDQuery = `
    SELECT 
        scientist_id 
    FROM 
        scientist 
    WHERE 
        email = ?
`

const checkAdminQuery = `
  SELECT 
    admin 
  FROM 
    scientist 
  WHERE email = ?
`


function read_projects_search_all(callback) {
    db.execute(read_projects_search_all_query, callback);
}

function read_projects_search(searchStr, scientist_id, callback) {
    db.execute(read_projects_search_query, [searchStr, scientist_id], callback);
}

function updateProject(editProjectName, editClientName, editDate, editContact, editEmail, callback) {
    db.execute(updateProjectQuery, [editProjectName, editClientName, editDate, editContact, editEmail], callback);
}

function insertIntoProjects(newProjectName, newClientName, newDate, newContact, newEmail, callback) {
    db.execute(insertIntoProjectsQuery, [newProjectName, newClientName, newDate, newContact, newEmail], callback);
}

function getProjectID(newProjectName, newClientName, newDate, callback) {
    db.execute(getProjectIDQuery, [newProjectName, newClientName, newDate], callback);
}

function assignScientistToProject(project_id, scientist_id, callback) {
    db.execute(assignScientistToProjectQuery, [project_id, scientist_id], callback);
}

function read_projects_all_sql(callback) {
    db.execute(read_projects_all_sql_query, callback);
}

function getProjectsAssignedToScientist(scientist_id, callback) {
    db.execute(getProjectsAssignedToScientistQuery, [scientist_id], callback);
}

function archiveProject(project_id, callback) {
    db.execute(archiveProjectQuery, [project_id], callback);
}

function getScientistID(email, callback) {
    db.execute(getScientistIDQuery, [email], callback);
}

function requireAdmin(email, callback) {
  db.execute(checkAdminQuery, [email], callback);
}

module.exports = {
    read_projects_search_all, 
    read_projects_search, 
    updateProject, 
    insertIntoProjects, 
    getProjectID, 
    assignScientistToProject, 
    read_projects_all_sql,
    getProjectsAssignedToScientist,
    archiveProject,
    getScientistID,
    requireAdmin
};