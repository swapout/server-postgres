const { normalizeUser } = require("../../helpers/normalize");

describe("Normalize user tests", () => {
  const user = {
    id: 1,
    avatar: "http://www.avatar.com",
    username: "testuser",
    githuburl: "https://www.github.com",
    gitlaburl: "https://www.gitlab.com",
    bitbucketurl: "https://www.bitbucket.com",
    linkedinurl: "https://www.linkeding.com",
    bio: "This is a test bio",
    created_at: new Date(),
    updated_at: new Date(),
    languages: [1, 2, 3, 4],
    technologies: [5, 6, 7, 8],
  };
  test("should return camelCased keys", () => {
    const normalizedUser = normalizeUser(user);
    expect(normalizedUser).toBeInstanceOf(Object);
    expect(normalizedUser).toMatchObject({
      id: user.id,
      avatar: user.avatar,
      username: user.username,
      githubURL: user.githuburl,
      gitlabURL: user.gitlaburl,
      bitbucketURL: user.bitbucketurl,
      linkedinURL: user.linkedinurl,
      bio: user.bio,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      languages: user.languages,
      technologies: user.technologies,
    });
  });
});
