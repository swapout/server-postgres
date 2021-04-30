const { pool } = require('../config/db')
const { fetchProjectTech } = require('../helpers/helper-queries')

exports.listTechnologies = async (req, res) => {
  try {
    let technologies = await pool.query(
      `
        SELECT label, value, id FROM technologies
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