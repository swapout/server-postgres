// Creates social profiles URLs based on usernames
exports.verifyAndCreateSocial = (user) => {
  user.githubURL = user.githubURL.trim();
  user.gitlabURL = user.gitlabURL.trim();
  user.bitbucketURL = user.bitbucketURL.trim();
  user.linkedinURL = user.linkedinURL.trim();
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
