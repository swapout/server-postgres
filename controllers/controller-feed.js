const { pool } = require('../config/db')
const { normalizeProject } = require('./controller-project')

exports.getUserFeed = async (req, res) => {
  try {
    // Get user ID from the token
    const userId = req.body.decoded.id

    // Get the last 10 projects created on the site
    const latestProjects = await pool.query(
      `
        select *
        from projects
        order by created_at DESC
        limit 10;
      `
    )

    return res.status(200).json({
      status: 200,
      message: 'Successfully received feed',
      projects: normalizeProject(latestProjects.rows, true)
    })
  } catch (error) {
    console.log(error)
    return res.status(500).json({
      status: 500,
      message: error.message
    })
  }
}