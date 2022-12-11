SELECT 
    project.project_id as project_id, 
    project.project_name,
    project.client,
    DATE_FORMAT(date, '%Y-%m-%d') as date
FROM 
    project
-- 	project LEFT JOIN (
-- 		SELECT COUNT(*) as project_likes, project_id 
--         FROM likes
-- 		GROUP BY likes.project_id
-- 	) as project_like_counts ON project.project_id = project_like_counts.project_id,
--    team, project_type
-- WHERE
-- 	project.project_team_id = team.team_id
--     and project.project_type_id = project_type.project_type_id
--     and project.project_id = ?
LIMIT 1