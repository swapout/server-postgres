const { verifyAndCreateSocial } = require("../../helpers/helper-social");

describe("Should create social links from usernames if value present", () => {
  describe("Should all profile links have values", () => {
    const userProfiles = {
      githubURL: "testuser",
      gitlabURL: "testuser",
      bitbucketURL: "testuser",
      linkedinURL: "testuser",
    };
    const tempUserProfiles = { ...userProfiles };
    const response = verifyAndCreateSocial(tempUserProfiles);
    test("Should have correct profile links present", () => {
      expect(response).toMatchObject({
        githubURL: `https://github.com/${userProfiles.githubURL}`,
        gitlabURL: `https://gitlab.com/${userProfiles.gitlabURL}`,
        bitbucketURL: `https://bitbucket.org/${userProfiles.bitbucketURL}/`,
        linkedinURL: `https://www.linkedin.com/in/${userProfiles.linkedinURL}/`,
      });
    });
    describe("Should all profile links to have a space before and after the value", () => {
      test("Should return profile links without space before and after", () => {
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
      });
    });
  });

  describe("Should all profile links to be empty strings", () => {
    test("Should input be empty strings", () => {
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

  describe("Should all profile links to have a space as value", () => {
    test("Should return empty profile links", () => {
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
    });
  });
});
