const { verifyAndCreateSocial } = require("../../helpers/helper-social");

describe("User profile has correct values", () => {
  const userProfiles = {
    githubURL: "testuser",
    gitlabURL: "testuser",
    bitbucketURL: "testuser",
    linkedinURL: "testuser",
  };
  const tempUserProfiles = { ...userProfiles };
  const response = verifyAndCreateSocial(tempUserProfiles);
  it("Should have correct profile links present", () => {
    expect(response).toMatchObject({
      githubURL: `https://github.com/${userProfiles.githubURL}`,
      gitlabURL: `https://gitlab.com/${userProfiles.gitlabURL}`,
      bitbucketURL: `https://bitbucket.org/${userProfiles.bitbucketURL}/`,
      linkedinURL: `https://www.linkedin.com/in/${userProfiles.linkedinURL}/`,
    });
  });

  // TODO: Move this to validator checks once its complete
  it.todo(
    "Should return profile links without spaces" /*, () => {
    const userProfiles = {
      githubURL: " testuser ",
      gitlabURL: " testuser ",
      bitbucketURL: " testuser ",
      linkedinURL: " testuser ",
    };
    const tempUserProfiles = { ...userProfiles };
    const response = verifyAndCreateSocial(tempUserProfiles);
    expect(response).toMatchObject({
      githubURL: `https://github.com/${userProfiles.githubURL.trim()}`,
      gitlabURL: `https://gitlab.com/${userProfiles.gitlabURL.trim()}`,
      bitbucketURL: `https://bitbucket.org/${userProfiles.bitbucketURL.trim()}/`,
      linkedinURL: `https://www.linkedin.com/in/${userProfiles.linkedinURL.trim()}/`,
    });
  }*/
  );
});

describe("User Profiles are empty strings", () => {
  it("Should return empty profile links", () => {
    const userProfiles = {
      githubURL: "",
      gitlabURL: "",
      bitbucketURL: "",
      linkedinURL: "",
    };
    const tempUserProfiles = { ...userProfiles };
    const response = verifyAndCreateSocial(tempUserProfiles);
    expect(response).toMatchObject({
      githubURL: "",
      gitlabURL: "",
      bitbucketURL: "",
      linkedinURL: "",
    });
  });
});

describe("User profiles are strings with a space", () => {
  // TODO: Move this to validator checks once its complete
  it.todo(
    "Should return empty profile links" /*, () => {
    const userProfiles = {
      githubURL: " ",
      gitlabURL: " ",
      bitbucketURL: " ",
      linkedinURL: " ",
    };
    const tempUserProfiles = { ...userProfiles };
    const response = verifyAndCreateSocial(tempUserProfiles);
    expect(response).toMatchObject({
      githubURL: "",
      gitlabURL: "",
      bitbucketURL: "",
      linkedinURL: "",
    });
  }*/
  );
});
