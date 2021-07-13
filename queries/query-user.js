const { normalizeUser } = require("../helpers/normalize");
const { pool } = require("../config/db");

class UserQuery {
  async insertUser(user, client) {
    // Inserts user into user table
    const response = await client.query(
      `
        INSERT INTO users (avatar, username, email, password, githubURL, gitlabURL, bitbucketURL, linkedinURL, bio)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
        RETURNING id, avatar, username, email, githubURL, gitlabURL, bitbucketURL, linkedinURL, bio, created_at, updated_at;
        `,
      [
        user.avatar,
        user.username,
        user.email,
        user.password,
        user.githubURL,
        user.gitlabURL,
        user.bitbucketURL,
        user.linkedinURL,
        user.bio,
      ]
    );

    return {
      savedUser: normalizeUser(response.rows[0]),
      client,
    };
  }
}

exports.UserQuery = UserQuery;
