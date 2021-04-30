const { pool } = require('../config/db')
const { fetchProjectTech } = require('../helpers/helper-queries')

exports.listTechnologies = async (req, res) => {
  try {
    let technologies = await pool.query(
      `
        SELECT label, id 
        FROM technologies
        WHERE status = 'accepted'
      `
    )

    return res.status(200).json({
      status: 200,
      message: 'Successfully listed technologies',
      technologies: technologies.rows
    })
  } catch (error) {
    console.log(error)
    return res.status(500).json({
      status: 500,
      message: error.message
    })
  }
}

exports.getTechnologiesByProjectId = async (req, res) => {
  // Get project ID from params
  const projectId = req.params.id

  try {
    // Call helper function to get the technologies for a single project by ID
    const tech = await fetchProjectTech(projectId)

    return res.status(200).json({
      status: 200,
      message: 'Successfully listed technologies for this project',
      technologies: tech
    })
  } catch (error) {
    console.log(error)
    return res.status(500).json({
      status: 500,
      message: error.message
    })
  }
}

exports.requestTechnology = async (req, res) => {
  const techLabel = req.body.technology
  try {
    const savedTech = await pool.query(
      `
        INSERT INTO technologies (label)
        VALUES ($1)
        RETURNING *;
      `,
      [techLabel]
    )

    if(savedTech.rows.length === 0) {
      return res.status(500).json({
        status: 500,
        message: 'Something went wrong'
      })
    }

    return res.status(201).json({
      status: 201,
      message: 'Requested technology is awaiting for moderation'
    })
  } catch (error) {
    console.log(error)
    return res.status(500).json({
      status: 500,
      message: error.message
    })
  }
}