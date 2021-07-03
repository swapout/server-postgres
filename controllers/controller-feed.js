const { pool } = require("../config/db");
const format = require("pg-format");
const {
  normalizeProject,
  normalizePosition,
  normalizeApplicantsFeed,
} = require("../helpers/normalize");

exports.getUserFeed = async (req, res) => {
  try {
    // Get user ID from the token
    const userId = req.body.decoded.id;

    ///////// FEED 1 ///////////
    // Get the last 10 projects created on the site
    const latestProjects = await pool.query(
      `
        select *
        from projects
        order by created_at DESC
        limit 10;
      `
    );

    ///////// FEED 2 ///////////
    // Get user's technologies to filter the positions for the technologies that the user has
    const userTech = await pool.query(
      `
        select jsonb_agg(utr.technology_id) as id
        from users_technologies_relations utr 
        where user_id = $1;
      `,
      [userId]
    );

    // Get the most recent positions based on the user's technology stack
    const matchedPositions = await pool.query(
      `
        SELECT 
            p.id, 
            p.user_id, 
            p.title, 
            p.description,
            p.qualifications,
            p.duties,
            jsonb_build_object(
                'label', l.label,
                'id', l.id
            ) AS level,
            jsonb_build_object(
                'label', r.label,
                'id', r.id
            ) AS role,
            p.vacancies, 
            p.project_id, 
            jsonb_agg(
                pt2.label
            ) AS technologies, 
            p.created_at, 
            p.updated_at 
        FROM position_tech pt2
        JOIN(
            SELECT * 
            FROM positions 
            WHERE user_id != $1
        ) AS p ON p.id = pt2.position_id
        JOIN (
              SELECT ARRAY_AGG(technology_id) AS tech_id_array, position_id
              FROM position_tech pt
              GROUP BY position_id
            ) AS ta ON ta.tech_id_array && $2::integer[]
        JOIN roles AS r ON r.id = p.role
        JOIN levels AS l ON l.id = p.level
        WHERE pt2.position_id = ta.position_id
        GROUP BY p.id, p.user_id, p.title, p.description, p.qualifications, p.duties, l.label, l.id, r.id, r.label, p.vacancies, p.project_id, p.created_at, p.updated_at
        ORDER BY p.created_at DESC
        LIMIT 10;
        `,
      [userId, userTech.rows[0].id]
    );

    ///////// FEED 3 ///////////
    // Get all project IDs of the user that has positions
    const projectsOfUser = await pool.query(
      `
        select jsonb_agg(pr.id) as project_ids 
        from projects pr
        where owner = $1 and haspositions = true;
      `,
      [userId]
    );

    // Get all position IDs of the user's projects with positions
    const positionSQL = format(
      `
        select array_agg(pos.id) as position_ids
        from positions pos
        where project_id in (%1$L);
      `,
      projectsOfUser.rows[0].project_ids
    );
    // Call query
    const positionsOfUser = await pool.query(positionSQL);

    // Get all applications, positions, users based on the last query IDs
    const applicationsSQL = format(
      `
        select par.user_id, u.avatar, u.username, u.githuburl, u.gitlaburl, u.bitbucketurl, u.linkedinurl, u.bio, par.position_id, p.title, p.description
        from positions_applications_relations par 
        join users u on par.user_id = u.id
        join positions p on par.position_id = p.id
        where position_id in (%1$L) and "status" = 'pending';
      `,
      positionsOfUser.rows[0].position_ids
    );

    // Call the query
    const pendingApplications = await pool.query(applicationsSQL);

    return res.status(200).json({
      status: 200,
      message: "Successfully received feed",
      projects: normalizeProject(latestProjects.rows, true),
      position: normalizePosition(matchedPositions.rows, true),
      applications: normalizeApplicantsFeed(pendingApplications.rows, true),
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
};
