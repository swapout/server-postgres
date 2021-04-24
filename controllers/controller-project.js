const { pool } = require('../config/db')
const moment = require('moment')
const format = require('pg-format')

const { insertProjectTech, fetchProjectTech, deleteProjectTech } = require('../helpers/helper-queries')

exports.createProject = async (req, res) => {
  const client = await pool.connect()
  await client.query('BEGIN')
  // Get user ID
  const { id } = req.body.decoded
  // Get project details from front-end
  const { project } = req.body

  try {
    // Save project into DB
    let savedProject = await client.query(
      `
        INSERT INTO projects (name, description, projectURL, owner)
        VALUES ($1, $2, $3, $4)
        RETURNING *;
      `,
      [project.name, project.description, project.projectURL, id]
    )

    // Add technologies to project
    savedProject.rows[0].technologies = await insertProjectTech(project.technologies, savedProject.rows[0].id, client)

    await client.query('COMMIT')
    // Success response including the project
    return res.status(201).json({
      status: 201,
      message: 'Project created',
      project: normalizeProject(savedProject.rows)
    })
  } catch (error) {
    // Error handling
    await client.query('ROLLBACK')
    console.log(error.message)
    return res.status(500).json({
      status: 500,
      message: 'Server error'
    })
  } finally {
    client.release()
  }
}

exports.getProjectById = async (req, res) => {
  // Get project ID
  const projectId = req.params.id

  try {
    // Get project by projectId
    let foundProject = await pool.query(
      `
        SELECT *
        FROM projects
        WHERE id = $1;
      `,
      [projectId]
    )

    // If no project found
    if (foundProject.rows.length === 0) {
      return res.status(404).json({
        status: 404,
        message: 'Project not found'
      })
    }

    // Get technologies belonging to the project
    foundProject.rows[0].technologies = await fetchProjectTech(projectId)

    return res.status(200).json({
      status: 200,
      message: 'Successfully retrieved project',
      project: normalizeProject(foundProject.rows)
    })
  } catch (error) {
    console.log(error.message)
    return res.status(500).json({
      status: 500,
      message: 'Server error'
    })
  }
}

exports.getProjectsByUser = async (req, res) => {
  // Get user ID from token
  const userId = req.body.decoded.id

  try {
    // Get all projects belonging to a user with technologies
    let foundProjects = await pool.query(
      `
        SELECT 
          p.id,
          p.owner,
          p.name, 
          p.description,
          p.projecturl,
          p.jobsavailable,
          p.created_at,
          p.updated_at,
          jsonb_agg(
            jsonb_build_object(
              'label', pt.label, 
              'value', pt.value, 
              'id', pt.technology_id
            )
          ) AS technologies
        FROM projects AS p
        JOIN project_tech AS pt ON pt.project_id = p.id
        WHERE p.owner = $1
        GROUP BY p.name, p.id;
      `,
      [userId]
    )

    // If no projects found
    if(foundProjects.rows.length === 0) {
      return res.status(400).json({
        status: 200,
        message: 'No projects found for this user',
        projects: []
      })
    }

    return res.status(200).json({
      status: 200,
      message: 'Get projects by user ID were successful',
      projects: normalizeProject(foundProjects.rows, true)
    })
  } catch (error) {
    console.log(error.message)
    return res.status(500).json({
      status: 500,
      message: 'Server error'
    })
  }
}

exports.getAllProjects = async (req, res) => {
  const page = req.query.page || 1
  const itemsPerPage = req.query.itemsPerPage || 9999
  const offset = (page - 1) * itemsPerPage
  const sort = req.query.sort
  let sortObj = {}
  let technologies = req.query.technologies
  let match = req.query.match || 'any'
  let positions = req.query.positions
  let searchQuery = req.query.search ? `%${req.query.search}%` : `%%`

  try {
    if(technologies) {
      technologies = technologies.split(',')
      if(match === 'any') {
        technologies = await pool.query(
          `
            SELECT
            jsonb_agg(
              id
            ) AS technologies
            FROM technologies
            WHERE label = ANY ($1);
           `,
          [technologies]
        )
        technologies = technologies.rows[0].technologies
      } else if (match === 'all') {
        technologies = await pool.query(
          `
            SELECT ARRAY(SELECT
              pt2.project_id
            FROM project_tech pt2 
            JOIN (SELECT array_agg(label)::text[] AS tech_array, project_id
            FROM project_tech pt
            GROUP BY project_id) AS ta on ta.tech_array @> ($1)::text[]
            WHERE pt2.project_id = ta.project_id
            GROUP BY pt2.project_id) AS technologies;
          `,
          [technologies]
        )
        if(technologies.rows[0].technologies.length === 0) {
          return res.status(200).json({
            status: 200,
            message: 'Get projects were successful',
            projects: []
          })
        }
        technologies = technologies.rows[0].technologies
      }

    } else {
      technologies = await pool.query(
        `
          SELECT
          jsonb_agg(
            id
          ) AS technologies
          FROM technologies
        `
      )
      technologies = technologies.rows[0].technologies
    }

    switch (sort) {
      case 'nameasc':
        sortObj = {
          sort: 'p.name',
          direction: 'ASC'
        }
        break
      case 'namedesc':
        sortObj = {
          sort: 'p.name',
          direction: 'DESC'
        }
        break
      case 'dateasc':
        sortObj = {
          sort: 'created_at',
          direction: 'ASC'
        }
        break
      case 'datedesc':
        sortObj = {
          sort: 'created_at',
          direction: 'DESC'
        }
        break
      default:
        sortObj = {
          sort: 'created_at',
          direction: 'DESC'
        }
    }

    switch (positions) {
      case 'true':
        positions = [true]
        break
      case 'false':
        positions = [false]
        break
      default:
        positions = [true, false]
    }

    let sql
    if (match !== 'all') {
       sql = format(
        `
        SELECT 
          p.id,
          p.owner,
          p.name, 
          p.description,
          p.projecturl,
          p.jobsavailable,
          p.created_at,
          p.updated_at,
          jsonb_agg(
            jsonb_build_object(
                'label', pt.label, 
                'value', pt.value, 
                'id', pt.technology_id
            )
          ) AS technologies
        FROM projects AS p
        JOIN project_tech AS pt ON pt.project_id = p.id
        WHERE p.id in (
          select distinct project_id 
          from project_tech pt
          where pt.technology_id in (%6$L))
          and p.jobsavailable in (%5$L)
          and p.name ilike %7$L
        GROUP BY p.name, p.id
        order by %1$s %2$s
        offset %3$L
        limit %4$L;
        `,
        sortObj.sort, sortObj.direction, offset, itemsPerPage, positions, technologies, searchQuery
      )
    } else {
      sql = format(
        `
        SELECT 
          p.id,
          p.owner,
          p.name, 
          p.description,
          p.projecturl,
          p.jobsavailable,
          p.created_at,
          p.updated_at,
          jsonb_agg(
            jsonb_build_object(
                'label', pt.label, 
                'value', pt.value, 
                'id', pt.technology_id
            )
          ) AS technologies
        FROM projects AS p
        JOIN project_tech AS pt ON pt.project_id = p.id
        WHERE p.id in (
          select distinct project_id 
          from project_tech pt
          where pt.project_id in (%6$L))
          and p.jobsavailable in (%5$L)
          and p.name ilike %7$L
        GROUP BY p.name, p.id
        order by %1$s %2$s
        offset %3$L
        limit %4$L;
        `,
        sortObj.sort, sortObj.direction, offset, itemsPerPage, positions, technologies, searchQuery
      )
    }

    // console.log(sql)
    const foundProjects = await pool.query(sql)

    return res.status(200).json({
      status: 200,
      message: 'Get projects were successful',
      projects: normalizeProject(foundProjects.rows, true)
    })
  } catch (error) {
    console.log(error.message)
    return res.status(500).json({
      status: 500,
      message: 'Server error'
    })
  }
}

exports.updateProjectById = async (req, res) => {
  // Create DB connection pool and start transaction
  const client = await pool.connect()
  await client.query('BEGIN')
  // ID of the project that comes from the query string
  const projectId = req.params.id
  // The user ID decoded from the token
  const id = req.body.decoded.id
  // Preparing the project fields to update
  const project = {
    name: req.body.project.name,
    description: req.body.project.description,
    technologies: req.body.project.technologies,
    projectURL: req.body.project.projectURL
  }
  // Set current time for updated_at
  const currentLocalTime = moment();

  try {
    // Update project details
    let updatedProject = await client.query(
      `
        UPDATE projects
        SET name = $1,
            description = $2,
            projectURL = $3,
            updated_at = $4
        WHERE owner = $5 AND id = $6
        RETURNING id, owner, name, description, projectURL, jobsAvailable, created_at, updated_at
      `,
      [project.name, project.description, project.projectURL, currentLocalTime, id, projectId]
    )

    // If no project is matching the user ID and project ID
    if (updatedProject.rows.length === 0) {
      return res.status(403).json({
        status: 403,
        message: 'You are not authorized to edit this project'
      })
    }
    // Update project technologies relations
    await deleteProjectTech(projectId, client)
    updatedProject.rows[0].technologies = await insertProjectTech(project.technologies, projectId, client)
    await client.query('COMMIT')
    return res.status(200).json({
      status: 200,
      message: 'Successfully updated project',
      project: normalizeProject(updatedProject.rows)
    })
  }  catch (error) {
    // Error handling
    await client.query('ROLLBACK')
    console.log(error.message)
    return res.status(500).json({
      status: 500,
      message: 'Server error'
    })
  } finally {
    client.release()
  }
}

exports.deleteProjectById = async (req, res) => {
  // Get project ID from the query string
  const projectId = req.params.id
  // Get the user ID from the token
  const userId = req.body.decoded.id

  try {
    // Delete project where user is owner of the project
    const deletedProject = await pool.query(
      `
        DELETE FROM projects
        WHERE id = $1 AND owner = $2
        RETURNING *;
      `,
      [projectId, userId]
    )

    if(deletedProject.rows.length === 0) {
      return res.status(400).json({
        status: 400,
        message: 'Something went wrong',
      })
    }

    return res.status(200).json({
      status: 200,
      message: 'Successfully deleted project',
    })
  } catch (error) {
    // Error handling
    console.log(error.message)
    return res.status(500).json({
      status: 500,
      message: 'Server error'
    })
  }
}

/////////////
// HELPERS //
/////////////

const normalizeProject = (projectsArray, isArray = false) => {
  if(projectsArray.length === 1 && !isArray) {
    const project = projectsArray[0]
    return {
      id: project.id,
      name: project.name,
      description: project.description,
      projectURL: project.projecturl,
      jobsAvailable: project.jobsavailable,
      owner: project.owner,
      technologies: project.technologies,
      createdAt: project.created_at,
      updatedAt: project.updated_at
    }
  }

   return projectsArray.map((project) => {
    return {
      id: project.id,
      name: project.name,
      description: project.description,
      projectURL: project.projecturl,
      jobsAvailable: project.jobsavailable,
      owner: project.owner,
      technologies: project.technologies,
      createdAt: project.created_at,
      updatedAt: project.updated_at
    }
  })

}