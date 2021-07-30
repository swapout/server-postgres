const jwt = require("jsonwebtoken");
const config = require("config");
const cookieParser = require("cookie-parser");
const { pool } = require("../config/db");

/**
 * Authentication middleware,
 * It accepts a Bearer token in the request header, verifies the token validity
 * and will call next function or return an auth error.
 * @param {Request} req - Request object from express router
 * @param {object} req.query.id - user id
 * @param {object} res - Response object from express router
 * @param {function} next
 * @access Private
 * @author Gabor
 */
exports.auth = async (req, res, next) => {
  try {
    // Gets token from cookies
    const signedCookie = req.signedCookies.authorization;
    // Gets token secret
    const bearerTokenSecret = config.get("bearerTokenSecret");

    // Checks if token exists
    if (!signedCookie) {
      console.log("No token found in cookies");
      return res.status(401).json({
        status: 401,
        message: "Authentication error",
      });
    }
    // Checks if secret exists
    if (!bearerTokenSecret) {
      console.log("Missing bearerTokenSecret");
      return res.status(500).json({
        status: 500,
        message: "Server error",
      });
    } else {
      // If everything ok, verifies the token
      const decoded = jwt.verify(signedCookie, bearerTokenSecret);

      // If not verified
      if (!decoded) {
        console.log("Token is not verified");
        return res.status(401).json({
          status: 401,
          message: "Authentication error",
        });
      }

      const foundToken = await pool.query(
        `
          SELECT *
          FROM bearer_tokens
          WHERE bearer_token = $1;
        `,
        [signedCookie]
      );

      if (foundToken.rows.length === 0) {
        console.log("Not token found in the DB");
        return res.status(401).json({
          status: 401,
          message: "Authentication error",
        });
      }

      // Saves decoded values into req.body.decoded
      req.body.decoded = decoded;
      req.body.token = signedCookie;
      next();
    }
  } catch (error) {
    console.log(error.name);
    // Checks for JWT token validation error
    if (error.name === "JsonWebTokenError") {
      console.log("Web token auth error");
      return res.status(401).json({
        status: 401,
        message: "Authentication error",
      });
    }
    // General error handling
    console.log("Something went wrong during token verification");
    return res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
};
