/////////////
// HELPERS //
/////////////
// Make responses consistent across all responses
// and allow switching from a single object to an array of objects

exports.normalizeUser = (user) => {
  return {
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
  };
};

exports.normalizeProject = (projectsArray, isArray = false) => {
  if (projectsArray.length === 1 && !isArray) {
    const project = projectsArray[0];
    return {
      id: project.id,
      name: project.name,
      description: project.description,
      projectURL: project.projecturl,
      hasPositions: project.haspositions,
      owner: project.owner,
      technologies: project.technologies,
      collaborators: project.collaborators,
      createdAt: project.created_at,
      updatedAt: project.updated_at,
    };
  }

  return projectsArray.map((project) => {
    return {
      id: project.id,
      name: project.name,
      description: project.description,
      projectURL: project.projecturl,
      hasPositions: project.haspositions,
      owner: project.owner,
      technologies: project.technologies,
      collaborators: project.collaborators,
      createdAt: project.created_at,
      updatedAt: project.updated_at,
    };
  });
};

exports.normalizePosition = (positionsArray, isArray = false) => {
  if (positionsArray.length === 1 && !isArray) {
    const position = positionsArray[0];
    return {
      id: position.id,
      title: position.title,
      description: position.description,
      role: position.role,
      level: position.level,
      vacancies: position.vacancies,
      applicants: position.applicants,
      projectId: position.project_id,
      userId: position.user_id,
      technologies: position.technologies,
      createdAt: position.created_at,
      updatedAt: position.updated_at,
    };
  }

  return positionsArray.map((position) => {
    return {
      id: position.id,
      title: position.title,
      description: position.description,
      role: position.role,
      level: position.level,
      vacancies: position.vacancies,
      applicants: position.applicants,
      projectId: position.project_id,
      userId: position.user_id,
      technologies: position.technologies,
      createdAt: position.created_at,
      updatedAt: position.updated_at,
    };
  });
};

exports.normalizeCollaborators = (collaborators, isArray = false) => {
  if (collaborators.length === 1 && !isArray) {
    const collaborator = collaborators[0];
    return {
      id: collaborator.id,
      avatar: collaborator.avatar,
      username: collaborator.username,
      email: collaborator.email,
      githubURL: collaborator.githuburl,
      gitlabURL: collaborator.gitlaburl,
      bitbucketURL: collaborator.bitbucketurl,
      linkedinURL: collaborator.linkedinurl,
      bio: collaborator.bio,
      createdAt: collaborator.created_at,
      updatedAt: collaborator.updated_at,
      languages: collaborator.languages,
      technologies: collaborator.technologies,
    };
  }
  return collaborators.map((collaborator) => {
    return {
      id: collaborator.id,
      avatar: collaborator.avatar,
      username: collaborator.username,
      email: collaborator.email,
      githubURL: collaborator.githuburl,
      gitlabURL: collaborator.gitlaburl,
      bitbucketURL: collaborator.bitbucketurl,
      linkedinURL: collaborator.linkedinurl,
      bio: collaborator.bio,
      createdAt: collaborator.created_at,
      updatedAt: collaborator.updated_at,
      languages: collaborator.languages,
      technologies: collaborator.technologies,
    };
  });
};

exports.normalizeApplicantsFeed = (applicantsFeed, isArray = false) => {
  if (applicantsFeed.length === 1 && !isArray) {
    const applicant = applicantsFeed[0];
    return {
      user: {
        id: applicant.user_id,
        avatar: applicant.avatar,
        username: applicant.username,
        githubURL: applicant.githuburl,
        gitlabURL: applicant.gitlaburl,
        bitbucketURL: applicant.bitbucketurl,
        linkedinURL: applicant.linkedinurl,
        bio: applicant.bio,
      },
      position: {
        id: applicant.position_id,
        title: applicant.title,
        description: applicant.description,
      },
    };
  }
  return applicantsFeed.map((applicant) => {
    return {
      user: {
        id: applicant.user_id,
        avatar: applicant.avatar,
        username: applicant.username,
        githubURL: applicant.githuburl,
        gitlabURL: applicant.gitlaburl,
        bitbucketURL: applicant.bitbucketurl,
        linkedinURL: applicant.linkedinurl,
        bio: applicant.bio,
      },
      position: {
        id: applicant.position_id,
        title: applicant.title,
        description: applicant.description,
      },
    };
  });
};
