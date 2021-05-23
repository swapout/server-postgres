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
    if(!savedProject.rows[0].technologies) {
      return res.status(404).json({
        status: 404,
        message: 'There was a problem processing technologies'
      })
    }
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
      return res.status(200).json({
        status: 200,
        message: 'Project not found',
        project: []
      })
    }

    // Get technologies belonging to the project
    foundProject.rows[0].technologies = await fetchProjectTech(projectId)

    const collaborators = await pool.query(
      `
          select u.id, u.email, u.username, u.avatar, u.bio, u.githuburl, u.gitlaburl, u.bitbucketurl, u.linkedinurl, jsonb_agg( distinct ut.label) as technologies, jsonb_agg( distinct ul.label) as languages
          from collaborators c
          join users u on u.id = c.user_id 
          join user_tech ut on ut.user_id = c.user_id
          join user_lang ul on ul.user_id  = c.user_id 
          where c.project_id = $1
          group by u.id;
      `,
      [projectId]
    )
    const project = normalizeProject(foundProject.rows)
    project.collaborators = normalizeCollaborators(collaborators.rows, true)

    return res.status(200).json({
      status: 200,
      message: 'Successfully retrieved project',
      project

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
          p.hasPositions,
          p.created_at,
          p.updated_at,
          jsonb_agg(
            jsonb_build_object(
              'label', pt.label,
              'id', pt.technology_id
            )
          ) AS technologies,
          jsonb_strip_nulls(
            jsonb_agg( 
              distinct jsonb_build_object( 
                'username', u.username,
                'id', u.id,
                'avatar', u.avatar
              )
            )
          ) as collaborators
        FROM projects AS p
        JOIN project_tech AS pt ON pt.project_id = p.id
        full join collaborators c on c.project_id = p.id
        full join users u on c.user_id = u.id
        WHERE p.owner = $1
        GROUP BY p.name, p.id;
      `,
      [userId]
    )

    foundProjects.rows = stripEmptyObjectsFromArray(foundProjects.rows)

    // If no projects found
    if(foundProjects.rows.length === 0) {
      return res.status(200).json({
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
  // User ID from the token
  const owner = req.body.decoded.id
  // Page number, will be useful for pagination in the future
  const page = req.query.page || 1
  // Max items to show per page
  const itemsPerPage = req.query.itemsPerPage || 9999
  // Calculate how many items to skip when using with pagination
  const offset = (page - 1) * itemsPerPage
  // Sort type
  const sort = req.query.sort
  // Create an empty sort object for the switch statement
  let sortObj = {}
  // A string of tech IDs separated by commas(no space between IDs after comma)
  let technologies = req.query.technologies
  // Technology match type:
  // 'any' - projects that include any of the technology IDs
  //'all' - projects that include all of the technologies listed
  let match = req.query.match || 'any'
  // Filter por projects with available positions or not or any
  let hasPositions = req.query.hasPositions
  // Text match of project name
  let searchQuery = req.query.search ? `%${req.query.search}%` : `%%`
  // Prepare the query
  let sql

  try {
    // If req.query.technologies exists or has any value
    if(technologies) {
      //Split technology IDs string by comma
      technologies = technologies.split(',')
      // If the last element in the tech array is an empty string, remove it
      if(technologies[technologies.length - 1] === '') {
        technologies.pop()
      }
    // If there are not technologies, get all tech IDs from the technologies table
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
      // Simplify technologies
      technologies = technologies.rows[0].technologies
    }
    // Form match string for SQL depending on req.query.match
    switch (match) {
      case 'any':
        match = '&&'
        break
      case 'all':
        match = '@>'
        break
      default:
        match = '&&'
    }

    // Create sort object based on the user input for the SQL query
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
    // Form hasPositions for SQL query based on user input
    switch (hasPositions) {
      case 'true':
        hasPositions = [true]
        break
      case 'false':
        hasPositions = [false]
        break
      default:
        hasPositions = [true, false]
    }

    // Prepare dynamic SQL query and paste in the dynamic user input values and sanitize the query
    sql = format(
      `
        SELECT p.id, p.owner, p.name, p.description, p.projecturl, p.haspositions, jsonb_agg(
            jsonb_build_object(
              'label', label,
              'id', technology_id
            )
          ) AS technologies, p.created_at, p.updated_at 
        FROM project_tech pt2
        JOIN(
            SELECT * 
            FROM projects 
            WHERE haspositions in (%3$L)
              and name ilike %4$L
              and owner != %5$L
        ) AS p ON p.id = pt2.project_id
        JOIN (
              SELECT ARRAY_AGG(technology_id) AS tech_id_array, project_id
              FROM project_tech pt
              GROUP BY project_id
            ) AS ta ON ta.tech_id_array %2$s ARRAY[%1$L]::integer[]
        WHERE pt2.project_id = ta.project_id
        GROUP BY p.id, p.owner, p.name, p.description, p.projecturl, p.haspositions, p.created_at, p.updated_at
        order by %6$s %7$s
        offset %8$L
        limit %9$L;
      `,
      technologies, match, hasPositions, searchQuery, owner, sortObj.sort, sortObj.direction, offset, itemsPerPage
    )

    // console.log(sql)
    // Send formed query
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
        RETURNING id, owner, name, description, projectURL, hasPositions, created_at, updated_at
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
    if(!updatedProject.rows[0].technologies) {
      return res.status(404).json({
        status: 404,
        message: 'There was a problem processing technologies'
      })
    }

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

    // If no project found
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

exports.removeCollaborator = async (req, res) => {
  // Project owner ID from the bearer token
  const userId = req.body.decoded.id
  // Project ID from req.body
  const projectId = req.body.projectId
  // User ID to be removed from the collaborators table
  const collaboratorId = req.body.collaboratorId
  try {
    // Check if the user making the request is the project owner
    const isProjectOwner = await pool.query(
      `
        select id
        from projects
        where id = $1 and owner = $2;
      `,
      [projectId, userId]
    )

    // If user isn't the project owner
    if(isProjectOwner.rows.length === 0) {
      return res.status(400).json({
        status: 400,
        message: 'You are not the project owner'
      })
    }

    // Delete collaborator from collaborators table
    const deletedCollaborator = await pool.query(
      `
        delete from collaborators
        where user_id = $1 and project_id = $2
        returning id;
      `,
      [collaboratorId, projectId]
    )

    // If didn't find collaborator for the project ID
    if(deletedCollaborator.rows.length === 0) {
      return res. status(400).json({
        status: 400,
        message: 'Collaborator doesn\'t exists',
      })
    }

    return res.status(200).json({
      status: 200,
      message: 'Successfully deleted collaborator'
    })

  } catch (error) {
  //  Error handling
    console.log(error.message)
    return res.status(500).json({
      status: 500,
      message: 'Server error'
    })
  }
}

exports.quitCollaborator = async (req, res) => {
  // Get user from the token
  const userId = req.body.decoded.id
  // Get project ID from the request
  const projectId = req.body.projectId
  try {
    // Delete user from collaborators table
    const deletedCollaborator = await pool.query(
      `
        delete from collaborators
        where project_id = $1 and user_id = $2
        returning id;
      `,
      [projectId, userId]
    )

    // If nothing has been deleted from table
    if(deletedCollaborator.rows.length === 0) {
      return res.status(400).json({
        status: 400,
        message: 'No collaborator found on this project'
      })
    }

    return res.status(200).json({
      status: 200,
      message: 'Collaborator successfully removed from project'
    })

  } catch (error) {
    //  Error handling
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
// Make responses consistent across all responses
// and allow switching from a single object to an array of objects
const normalizeProject = (projectsArray, isArray = false) => {
  if(projectsArray.length === 1 && !isArray) {
    const project = projectsArray[0]
    return {
      id: project.id,
      name: project.name,
      description: project.description,
      projectURL: project.projecturl,
      hasPositions: project.haspositions,
      owner: project.owner,
      technologies: project.technologies,
      collaborators: project.collaborators,
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
      hasPositions: project.haspositions,
      owner: project.owner,
      technologies: project.technologies,
      collaborators: project.collaborators,
      createdAt: project.created_at,
      updatedAt: project.updated_at
    }
  })
}

const normalizeCollaborators = (collaborators, isArray = false) => {
  if (collaborators.length === 1 && !isArray) {
    const collaborator = collaborators[0]
    return {
      id: collaborator.id,
      avatar: collaborator.avatar,
      username: collaborator.username,
      email: collaborator.email,
      githubURL: collaborator.githuburl,
      gitlabURL: collaborator.gitlaburl,
      bitbucketURL: collaborator.bitbucketurl,
      linkedinURL: collaborator.linkedinurl,
      bio: collaborator.bio,
      createdAt: collaborator.created_at,
      updatedAt: collaborator.updated_at,
      languages: collaborator.languages,
      technologies: collaborator.technologies
    }
  }
  return collaborators.map((collaborator) => {
    return {
      id: collaborator.id,
      avatar: collaborator.avatar,
      username: collaborator.username,
      email: collaborator.email,
      githubURL: collaborator.githuburl,
      gitlabURL: collaborator.gitlaburl,
      bitbucketURL: collaborator.bitbucketurl,
      linkedinURL: collaborator.linkedinurl,
      bio: collaborator.bio,
      createdAt: collaborator.created_at,
      updatedAt: collaborator.updated_at,
      languages: collaborator.languages,
      technologies: collaborator.technologies
    }
  })
}

const stripEmptyObjectsFromArray = (array) => {
  return array.map((item) => {
    item.collaborators = item.collaborators.filter(el => Object.keys(el).length)
    return item
  })
}