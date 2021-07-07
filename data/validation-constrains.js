exports.userConstrains = {
  email: {
    pattern: /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/,
  },
  username: {
    minLength: 3,
    maxLength: 20,
  },
  password: {
    pattern: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/,
    minLength: 8,
    maxLength: 128,
  },
  technologies: {
    minLength: 1,
  },
  languages: {
    minLength: 1,
  },
  bio: {
    maxLength: 65535,
  },
};
