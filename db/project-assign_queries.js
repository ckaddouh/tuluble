const db = require("./db_connection");


const read_projects_all_sql_query = `
    SELECT
        project_name, project_id, client, date, client_name, client_email
    FROM
        projects
    WHERE 
      active = 1
`

const getScientistForProjectQuery = `
  SELECT
    name, scientist.scientist_id
  FROM
    scientist, project_assign
  WHERE
    project_id = ?
    AND scientist.scientist_id = project_assign.scientist_id
`

const getRemainingScientistsForProjectQuery = `
  SELECT * 
  FROM scientist
  WHERE scientist_id NOT IN (SELECT scientist_id FROM project_assign where project_id = ?)
`

const getAllScientistsQuery = `
  SELECT 
    scientist.name, scientist.scientist_id, scientist.admin, scientist.email
  FROM 
    scientist
`

const assignScientistToProjectQuery = `
  INSERT INTO 
    project_assign (project_id, scientist_id)
    VALUES (?, ?)
`

const removeScientistFromProjectQuery = `
  DELETE FROM 
    project_assign 
  WHERE
    project_id = ?
    AND scientist_id = ?
`

const editUserQuery = `
  UPDATE scientist
  SET 
    name = ?,
    email = ?,
    admin = ?
  WHERE 
    scientist_id = ?
`

const deleteUserQuery = `
  DELETE FROM scientist
  WHERE scientist_id = ?
`

const read_projects_search_project_assign_query = `
SELECT
  project_name, projects.project_id, client, date
FROM
  projects
WHERE
  projects.project_name LIKE ?
  AND projects.active = 1
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

const addScientistQuery = `
  INSERT INTO 
    scientist
  (name, email, admin) VALUES (?, ?, ?)
`


function read_projects_all_sql(callback) {
    db.execute(read_projects_all_sql_query, callback);
}

function getScientistForProject(project_id, callback) {
    db.execute(getScientistForProjectQuery, [project_id], callback);
}

function getRemainingScientistsForProject(project_id, callback) {
    db.execute(getRemainingScientistsForProjectQuery, [project_id], callback);
}

function getAllScientists(callback) {
    db.execute(getAllScientistsQuery, callback);
}

function assignScientistToProject(project_id, scientist_id, callback) {
    db.execute(assignScientistToProjectQuery, [project_id, scientist_id], callback);
}

function removeScientistFromProject(project_id, scientist_id, callback) {
    db.execute(removeScientistFromProjectQuery, [project_id, scientist_id], callback);
}

function editUser(name, email, admin, scientist_id, callback) {
    db.execute(editUserQuery, [name, email, admin, scientist_id], callback);
}

function deleteUser(scientist_id, callback) {
    db.execute(deleteUserQuery, [scientist_id], callback);
}

function read_projects_search_project_assign(project_name, callback) {
    db.execute(read_projects_search_project_assign_query, [project_name], callback);
}

function getScientistID(email, callback) {
    db.execute(getScientistIDQuery, [email], callback);
}

function requireAdmin(email, callback) {
  db.execute(checkAdminQuery, [email], callback);
}

function addScientist(name, email, admin, callback) {
  db.execute(addScientistQuery, [name, email, admin], callback);
}




module.exports = {
    read_projects_all_sql, 
    getScientistForProject,
    getRemainingScientistsForProject,
    getAllScientists,
    assignScientistToProject,
    removeScientistFromProject,
    editUser,
    deleteUser,
    read_projects_search_project_assign,
    getScientistID,
    requireAdmin, 
    addScientist
};