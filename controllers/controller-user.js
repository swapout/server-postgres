const { pool } = require("../config/db");
const config = require("config");
const gravatar = require("gravatar");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const moment = require("moment");
const passwordResetTemplate = require("../templates/template-passwordReset");
const mailgun = require("mailgun-js")({
  apiKey: config.get("mailgun.apiKey"),
  domain: config.get("mailgun.domain"),
});
const { normalizeUser } = require("../helpers/normalize");
const {
  insertUserTech,
  insertUserLang,
  fetchUserTech,
  fetchUserLang,
  deleteUserLang,
  deleteUserTech,
} = require("../helpers/helper-queries");
const { createAndSaveBearerToken } = require("../helpers/helper-tokens");
const { serialize, parse } = require("cookie");

exports.createUser = async (req, res) => {
  const client = await pool.connect();
  await client.query("BEGIN");

  try {
    let user = req.body.user;
    // Lower case email address
    user.email = user.email.toLowerCase();

    // Hash password
    user.password = await bcrypt.hash(user.password, 11);

    // Get avatar from Gravatar
    const avatar = await gravatar.url(user.email, {
      s: "200",
      r: "pg",
      d: "mm",
    });

    // Construct Gravatar URL
    user.avatar = `https:${avatar}`;

    // Verify and create social profiles
    user = verifyAndCreateSocial(user);

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

    // Simplify savedUser
    const savedUser = response.rows[0];

    // Create and save bearer_token to DB
    const bearer_token = await createAndSaveBearerToken(savedUser, res, client);

    // Insert technologies and languages to DB and receive the formatted arrays back
    savedUser.technologies = await insertUserTech(
      user.technologies,
      savedUser.id,
      client
    );
    if (!savedUser.technologies) {
      return res.status(404).json({
        status: 404,
        message: "There was a problem processing technologies",
      });
    }

    savedUser.languages = await insertUserLang(
      user.languages,
      savedUser.id,
      client
    );
    if (!savedUser.languages) {
      return res.status(404).json({
        status: 404,
        message: "There was a problem processing languages",
      });
    }

    await client.query("COMMIT");
    // Success response including the user and token
    return res
      .cookie("authorization", bearer_token, {
        signed: true,
        sameSite: true,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
      })
      .status(201)
      .json({
        status: 201,
        message: "User created",
        // token: bearer_token,
        user: normalizeUser(savedUser),
      });
  } catch (error) {
    // console.log('Error.code: ', error.code)
    // console.log('Error.errno: ', error.errno)
    // console.log('Error.sqlMessage: ', error.sqlMessage)
    // console.log('Error.sqlState: ', error.sqlState)
    // console.log('Error.index: ', error.index)
    // console.log('Error.sql: ', error.sql)
    // console.log(Object.keys(error))

    // Error handling
    await client.query("ROLLBACK");
    console.log(error.message);
    return res.status(500).json({
      status: 500,
      message: "Server error",
    });
  } finally {
    client.release();
  }
};

exports.loginUser = async (req, res) => {
  try {
    // Save user input to user obj
    const user = {
      email: req.body.user.email,
      password: req.body.user.password,
    };

    // Find user by ID
    let foundUser = await pool.query(
      `
        SELECT * FROM users WHERE email = $1 LIMIT 1;
      `,
      [user.email]
    );

    // Check if there was a user with this email
    if (!foundUser) {
      return res.status(401).json({
        status: 401,
        message: "Invalid credentials",
      });
    }

    // Simplify found user
    foundUser = foundUser.rows[0];

    // Compare passwords
    const isPasswordsMatch = await bcrypt.compare(
      user.password,
      foundUser.password
    );

    // If password don't match
    if (!isPasswordsMatch) {
      return res.status(401).json({
        status: 401,
        message: "Invalid credentials",
      });
    }

    //Delete password information from foundUser
    delete foundUser.password;

    // Find user's languages and add them to foundUser
    foundUser.languages = await fetchUserLang(foundUser.id);

    // Find user's technologies and add them to foundUser
    foundUser.technologies = await fetchUserTech(foundUser.id);

    // Create and save bearer token to the DB
    const bearer_token = await createAndSaveBearerToken(foundUser, res, pool);

    // Success response including the user and token
    return res
      .cookie("authorization", bearer_token, {
        signed: true,
        sameSite: true,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
      })
      .status(200)
      .json({
        status: 200,
        message: "Login success",
        token: bearer_token,
        user: normalizeUser(foundUser),
      });
  } catch (error) {
    // Error handling
    console.log(error.message);
    return res.status(500).json({
      status: 500,
      message: "Server error",
    });
  }
};

exports.getUserProfile = async (req, res) => {
  try {
    // Gets user ID
    const id = req.body.decoded.id;

    // Get user by userId
    let foundUser = await pool.query(
      `
        SELECT id, avatar, username, email, githubURL, gitlabURL, bitbucketURL, linkedinURL, bio, created_at, updated_at 
        FROM users 
        WHERE users.id = $1
        LIMIT 1;
      `,
      [id]
    );

    // If no user found with ID
    if (foundUser.rows.length === 0) {
      return res.status(403).json({
        status: 403,
        message: "Not authorized",
      });
    }

    // Simplify user
    foundUser = foundUser.rows[0];

    // Find user's languages and add them to foundUser
    foundUser.languages = await fetchUserLang(foundUser.id);

    // Find user's technologies and add them to foundUser
    foundUser.technologies = await fetchUserTech(foundUser.id);

    return res.status(200).json({
      status: 200,
      message: `Profile of ${foundUser.username}`,
      user: normalizeUser(foundUser),
    });
  } catch (error) {
    // Error handling
    console.log(error.message);
    return res.status(500).json({
      status: 500,
      message: "Server error",
    });
  }
};

exports.deleteUser = async (req, res) => {
  // Create connection and start a transaction
  const client = await pool.connect();
  await client.query("BEGIN");

  try {
    // Gets user ID
    const id = req.body.decoded.id;
    // Delete a user with the user ID from the decoded token
    const deletedUser = await client.query(
      `
        DELETE FROM users 
        WHERE id = $1
        RETURNING *;
      `,
      [id]
    );

    // If no user found
    if (deletedUser.rows.length === 0) {
      return res.status(400).json({
        status: 400,
        message: "Something went wrong",
      });
    }

    return res.status(200).json({
      status: 200,
      message: "User is deleted",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
};

exports.updateUser = async (req, res) => {
  // Create connection and start a transaction
  const client = await pool.connect();
  await client.query("BEGIN");

  try {
    // Gets user ID
    const id = req.body.decoded.id;
    console.log("Token - updateUser: ", req.body.token);
    // Create the user object from user input
    let user = {
      bio: req.body.user.bio,
      githubURL: req.body.user.githubURL,
      gitlabURL: req.body.user.gitlabURL,
      bitbucketURL: req.body.user.bitbucketURL,
      linkedinURL: req.body.user.linkedinURL,
      technologies: req.body.user.technologies,
      languages: req.body.user.languages,
    };

    // Verify and create social profiles
    user = verifyAndCreateSocial(user);

    // Set current time for updated_at
    const currentLocalTime = moment();

    // Update user details
    let updatedUser = await client.query(
      `
        UPDATE users
        SET bio = $1,
            githubURL = $2,
            gitlabURL = $3,
            bitbucketURL = $4,
            linkedinURL = $5,
            updated_at = $6
        WHERE id = $7
        RETURNING id, avatar, username, email, bio, githubURL, gitlabURL, bitbucketURL, linkedinURL, created_at, updated_at;
      `,
      [
        user.bio,
        user.githubURL,
        user.gitlabURL,
        user.bitbucketURL,
        user.linkedinURL,
        currentLocalTime,
        id,
      ]
    );

    // Simplify updatedUser
    updatedUser = updatedUser.rows[0];

    // Replace old languages with new ones and assign it to savedUser
    await deleteUserLang(id, client);
    updatedUser.languages = await insertUserLang(user.languages, id, client);
    if (!updatedUser.languages) {
      return res.status(404).json({
        status: 404,
        message: "There was a problem processing languages",
      });
    }

    // Replace old technologies with new ones and assign it to savedUser
    await deleteUserTech(id, client);
    updatedUser.technologies = await insertUserTech(
      user.technologies,
      id,
      client
    );
    if (!updatedUser.technologies) {
      return res.status(404).json({
        status: 404,
        message: "There was a problem processing technologies",
      });
    }
    // If everything went well, commit the changes to the DB
    await client.query("COMMIT");

    return res.status(200).json({
      status: 200,
      message: "User is updated",
      user: normalizeUser(updatedUser),
    });
  } catch (error) {
    // If something went wrong, rollback all the changes in the DB
    await client.query("ROLLBACK");
    console.log(error);
    return res.status(500).json({
      status: 500,
      message: error.message,
    });
  } finally {
    // Terminate connection
    client.release();
  }
};

exports.updatePassword = async (req, res) => {
  // Get all fields to update the password
  const userId = req.body.decoded.id;
  const currentPassword = req.body.user.currentPassword;
  const newPassword = req.body.user.newPassword;
  const newPasswordConfirm = req.body.user.newPasswordConfirm;

  try {
    // Check if user with this ID exists
    let foundUser = await pool.query(
      `
        SELECT *
        FROM users
        WHERE id = $1;
      `,
      [userId]
    );

    // If no user found with ID
    if (foundUser.rows.length === 0) {
      return res.status(200).json({
        status: 200,
        message: "No user found",
      });
    }

    // Simplify user
    foundUser = foundUser.rows[0];

    // Check password against the hashed password from the DB
    const isPasswordMatch = await bcrypt.compare(
      currentPassword,
      foundUser.password
    );

    // If passwords don't match
    if (!isPasswordMatch) {
      return res.status(403).json({
        status: 403,
        message: "Incorrect password",
      });
    }

    // If password and password confirm don't match
    if (newPassword !== newPasswordConfirm) {
      return res.status(403).json({
        status: 403,
        message: "New password and new password confirmation don't match",
      });
    }

    // If new password is too short
    if (newPassword.length < 8) {
      return res.status(403).json({
        status: 403,
        message: "New password is too short",
      });
    }

    //If new password is too long
    if (newPassword.length > 128) {
      return res.status(403).json({
        status: 403,
        message: "New password is too long",
      });
    }

    // Hash and salt new password
    const hashedPassword = await bcrypt.hash(newPassword, 11);

    // Update user with new password
    await pool.query(
      `
        UPDATE users
        SET password = $1
        WHERE id = $2
      `,
      [hashedPassword, userId]
    );

    return res.status(200).json({
      status: 200,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
};

exports.updateUsername = async (req, res) => {
  // Get all fields to update username
  const userId = req.body.decoded.id;
  const newUsername = req.body.user.newUsername;
  const password = req.body.user.password;

  try {
    // Check if user exists
    let foundUser = await pool.query(
      `
        SELECT *
        FROM users
        WHERE id = $1;
      `,
      [userId]
    );

    // If no user found with ID
    if (foundUser.rows.length === 0) {
      return res.status(200).json({
        status: 200,
        message: "No user found",
      });
    }

    // Check if username is not already in use
    const isUsernameAvailable = await pool.query(
      `
        SELECT id
        FROM users
        WHERE username = $1
      `,
      [newUsername]
    );

    // If username is already in use
    if (isUsernameAvailable.rows.length > 0) {
      return res.status(403).json({
        status: 403,
        message: "Username is already in use",
      });
    }

    // Simplify user
    foundUser = foundUser.rows[0];

    // Check password against the DB is they match
    const isPasswordMatch = await bcrypt.compare(password, foundUser.password);

    // If passwords don't match
    if (!isPasswordMatch) {
      return res.status(403).json({
        status: 403,
        message: "Incorrect password",
      });
    }

    // Update user and return fields needed for new token creation
    const updatedUser = await pool.query(
      `
        UPDATE users
        SET username = $1
        WHERE id = $2
        RETURNING id, username, email
      `,
      [newUsername, userId]
    );

    // Create new bearer token
    const token = await createAndSaveBearerToken(
      updatedUser.rows[0],
      res,
      pool
    );

    // If token couldn't be created
    if (!token) {
      return res.status(500).json({
        status: 500,
        message: "Token couldn't be created",
      });
    }

    // Delete all bearer_tokens except the newly created one,
    // since the old tokens have outdated information
    await pool.query(
      `
      delete from bearer_tokens
      where user_id = $1 and bearer_token != $2
      `,
      [userId, token]
    );

    return res.status(200).json({
      status: 200,
      message: "Username updated successfully",
      user: {
        username: updatedUser.rows[0].username,
      },
      token,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
};

exports.updateEmail = async (req, res) => {
  // Get necessary fields to update email
  const userId = req.body.decoded.id;
  const newEmail = req.body.user.newEmail.toLowerCase();
  const password = req.body.user.password;

  // Check if email is a valid email format
  const emailRegex = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/;
  const isValidEmail = emailRegex.test(newEmail);

  // If email is not a valid email
  if (!isValidEmail) {
    return res.status(403).json({
      status: 403,
      message: "Email is invalid",
    });
  }

  try {
    // Check if user exists
    let foundUser = await pool.query(
      `
        SELECT *
        FROM users
        WHERE id = $1;
      `,
      [userId]
    );

    // If no user found
    if (foundUser.rows.length === 0) {
      return res.status(200).json({
        status: 200,
        message: "No user found",
      });
    }

    // Check if email is not already in use
    const isEmailAvailable = await pool.query(
      `
        SELECT id
        FROM users
        WHERE email = $1
      `,
      [newEmail]
    );

    // If email is in use
    if (isEmailAvailable.rows.length > 0) {
      return res.status(403).json({
        status: 403,
        message: "Email is already in use",
      });
    }

    // Simplify user
    foundUser = foundUser.rows[0];

    // Check password against DB user password
    const isPasswordMatch = await bcrypt.compare(password, foundUser.password);

    // If passwords don't match
    if (!isPasswordMatch) {
      return res.status(403).json({
        status: 403,
        message: "Incorrect password",
      });
    }

    // Update user with new data and get necessary fields to generate a new token
    const updatedUser = await pool.query(
      `
        UPDATE users
        SET email = $1
        WHERE id = $2
        RETURNING id, email, username
      `,
      [newEmail, userId]
    );

    // Generate a new token
    const token = await createAndSaveBearerToken(
      updatedUser.rows[0],
      res,
      pool
    );

    // If something went wrong during token creation
    if (!token) {
      return res.status(500).json({
        status: 500,
        message: "Token couldn't be created",
      });
    }

    // Delete all bearer_tokens except the newly created one,
    // since the old tokens have outdated information
    await pool.query(
      `
      delete from bearer_tokens
      where user_id = $1 and bearer_token != $2
      `,
      [userId, token]
    );

    return res.status(200).json({
      status: 200,
      message: "Email updated successfully",
      user: {
        email: updatedUser.rows[0].email,
      },
      token,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
};

exports.logout = async (req, res) => {
  // Get user ID and token
  const { id } = req.body.decoded;
  const { token } = req.body;

  try {
    // Delete a bearer token matching the token and the user ID
    await pool.query(
      `
        DELETE FROM bearer_tokens
        WHERE user_id = $1 AND bearer_token = $2;
      `,
      [id, token]
    );

    return res
      .clearCookie("authorization", {
        signed: true,
        sameSite: true,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
      })
      .status(200)
      .json({
        status: 200,
        message: "logout successful",
      });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
};

exports.logoutAll = async (req, res) => {
  // Get user ID and token
  const { id } = req.body.decoded;

  try {
    // Delete a bearer token matching the token and the user ID
    await pool.query(
      `
        DELETE FROM bearer_tokens
        WHERE user_id = $1;
      `,
      [id]
    );

    return res
      .clearCookie("authorization", {
        signed: true,
        sameSite: true,
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
      })
      .status(200)
      .json({
        status: 200,
        message: "logout from all devices was successful",
      });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
};

exports.forgotPassword = async (req, res) => {
  // Get email from request body
  const email = req.body.email;
  try {
    // Check if there is a user registered with this email
    let foundUser = await pool.query(
      `
        SELECT *
        FROM users
        WHERE email = $1
      `,
      [email]
    );

    // If user found with email
    if (foundUser.rows.length > 0) {
      // Simplify user
      foundUser = foundUser.rows[0];
      // Generate random hex string for reset token
      const passwordResetToken = crypto.randomBytes(42).toString("hex");

      // Delete old tokens by the user from reset tokens
      await pool.query(
        `
          DELETE FROM reset_password_tokens
          WHERE user_id = $1;
        `,
        [foundUser.id]
      );

      // Save generated reset token into DB
      const savedToken = await pool.query(
        `
          INSERT INTO reset_password_tokens (user_id, token)
          VALUES($1, $2)
          RETURNING token;
        `,
        [foundUser.id, passwordResetToken]
      );

      // If token has been created
      if (savedToken.rows.length > 0) {
        // Prepare params for password reset templates
        const params = {
          preheader: "Password reset request",
          homeURL: config.get("client.url"),
          logoURL: "#",
          resetURL: `${config.get("client.url")}${passwordResetToken}`,
        };

        // Prepare data for mailgun request
        const data = {
          from: `${config.get("project.name")} <${config.get(
            "project.email"
          )}>`,
          to: email,
          subject: "Password reset request",
          html: passwordResetTemplate.body(params),
        };

        // Send email to user
        await mailgun.messages().send(data, (error, body) => {
          if (error) {
            console.log(error);
            return res.status(500).json({
              status: 500,
              message: error.message,
            });
          }
        });
      }
    }

    return res.status(200).json({
      status: 200,
      message:
        "If the user is registered, then we've sent a mail with a reset link",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
};

exports.passwordReset = async (req, res) => {
  // Get all the information needed to reset the password
  const passwordResetToken = req.params.token;
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;
  const now = moment();

  try {
    // If new password is too short
    if (password.length < 8) {
      return res.status(403).json({
        status: 403,
        message: "Password is too short",
      });
    }

    //If new password is too long
    if (password.length > 128) {
      return res.status(403).json({
        status: 403,
        message: "Password is too long",
      });
    }

    // If password and password confirm don't match
    if (password !== confirmPassword) {
      return res.status(403).json({
        status: 403,
        message: "Password and password confirmation don't match",
      });
    }

    // Look for token token that has been issued within the last hour
    const foundToken = await pool.query(
      `
        SELECT user_id
        FROM reset_password_tokens
        WHERE token = $1 AND created_at + interval '1 hour' > $2;
      `,
      [passwordResetToken, now]
    );

    // If no token found
    if (foundToken.rows.length === 0) {
      return res.status(401).json({
        status: 401,
        message:
          "Your password reset token has expired or invalid, please request a new token",
      });
    }

    // Simplify foundToken by extracting only the user ID
    const userId = foundToken.rows[0].user_id;

    // Hash and salt new password
    const hashedPassword = await bcrypt.hash(password, 11);

    // Update user with new password
    await pool.query(
      `
        UPDATE users
        SET password = $1
        WHERE id = $2;
      `,
      [hashedPassword, userId]
    );

    // Delete all tokens belonging to the user
    await pool.query(
      `
        DELETE FROM reset_password_tokens
        WHERE user_id = $1;
      `,
      [userId]
    );

    return res.status(200).json({
      status: 200,
      message: "Password has been reset",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: 500,
      message: error.message,
    });
  }
};

/////////////
// HELPERS //
/////////////

// Creates social profiles URLs based on usernames
const verifyAndCreateSocial = (user) => {
  if (user.githubURL !== "") {
    user.githubURL = `https://github.com/${user.githubURL}`;
  }
  if (user.gitlabURL !== "") {
    user.gitlabURL = `https://gitlab.com/${user.gitlabURL}`;
  }
  if (user.bitbucketURL !== "") {
    user.bitbucketURL = `https://bitbucket.org/${user.bitbucketURL}/`;
  }
  if (user.linkedinURL !== "") {
    user.linkedinURL = `https://www.linkedin.com/in/${user.linkedinURL}/`;
  }
  return user;
};
