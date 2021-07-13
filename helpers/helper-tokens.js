const jwt = require("jsonwebtoken");
const config = require("config");

exports.createAndSaveBearerToken = async (user, client) => {
  // Create and sign the bearer token
  const token = jwt.sign(
    { id: user.id, username: user.username, email: user.email },
    config.get("bearerTokenSecret")
  );

  // Insert token into bearer_tokens table
  const bearer_token = await client.query(
    `
        INSERT INTO bearer_tokens (bearer_token, user_id)
        VALUES ($1, $2)
        RETURNING bearer_token
        `,
    [token, user.id]
  );

  return bearer_token.rows[0].bearer_token;
};
