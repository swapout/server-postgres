const { pool } = require("../../config/db");
const { UserService } = require("../../services/UserService");

describe("Should create user with valid values", () => {
  let user;
  let randomNumber;
  beforeEach(() => {
    randomNumber = Math.floor(Math.random() * 100000 + 1);
    user = {
      username: `testuser${randomNumber}`,
      email: `testuser${randomNumber}@test.com`,
      password: "12345678a",
      confirmPassword: "12345678a",
      githubURL: `testuser${randomNumber}`,
      gitlabURL: `testuser${randomNumber}`,
      bitbucketURL: `testuser${randomNumber}`,
      linkedinURL: `testuser${randomNumber}`,
      technologies: [1, 2, 3],
      languages: [1, 2, 3],
      bio: "This is my test biooooooooo",
    };
  });

  test("should return a real user with no errors", async () => {
    const tempUser = { ...user };
    const response = await UserService.createUser(user, pool);
    expect(response.savedUser).toBeInstanceOf(Object);
    expect(typeof response.token).toBe("string");
    expect(response.savedUser).toMatchObject({
      id: response.savedUser.id,
      avatar: response.savedUser.avatar,
      username: tempUser.username,
      githubURL: `https://github.com/${tempUser.githubURL}`,
      gitlabURL: `https://gitlab.com/${tempUser.gitlabURL}`,
      bitbucketURL: `https://bitbucket.org/${tempUser.bitbucketURL}/`,
      linkedinURL: `https://www.linkedin.com/in/${tempUser.linkedinURL}/`,
      bio: tempUser.bio,
      createdAt: response.savedUser.createdAt,
      updatedAt: response.savedUser.updatedAt,
      languages: [
        {
          id: tempUser.languages[0],
          label: response.savedUser.languages[0].label,
        },
        {
          id: tempUser.languages[1],
          label: response.savedUser.languages[1].label,
        },
        {
          id: tempUser.languages[2],
          label: response.savedUser.languages[2].label,
        },
      ],
      technologies: [
        {
          id: tempUser.technologies[0],
          label: response.savedUser.technologies[0].label,
        },
        {
          id: tempUser.technologies[1],
          label: response.savedUser.technologies[1].label,
        },
        {
          id: tempUser.technologies[2],
          label: response.savedUser.technologies[2].label,
        },
      ],
    });
  });
});
