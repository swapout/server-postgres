const bcrypt = require("bcryptjs");
const gravatar = require("gravatar");
const { UserQuery } = require("../queries/query-user");
const { createAndSaveBearerToken } = require("../helpers/helper-tokens");
const { verifyAndCreateSocial } = require("../helpers/helper-social");
const {
  insertUserTech,
  insertUserLang,
  fetchUserTech,
  fetchUserLang,
  deleteUserLang,
  deleteUserTech,
} = require("../helpers/helper-queries");

class UserService {
  async createUser(user, client) {
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

    const response = await UserQuery.prototype.insertUser(user, client);

    client = response.client;
    let savedUser = response.savedUser;

    // Create and save bearer_token to DB
    const token = await createAndSaveBearerToken(savedUser, client);

    // Insert technologies and languages to DB and receive the formatted arrays back
    savedUser.technologies = await insertUserTech(
      user.technologies,
      savedUser.id,
      client
    );

    savedUser.languages = await insertUserLang(
      user.languages,
      savedUser.id,
      client
    );

    return {
      savedUser,
      token,
      client,
    };
  }
}

exports.UserService = UserService;
