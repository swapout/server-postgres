/**
 * @description Contains all the user input constrains that are present
 * @type {{technologies: {minLength: number}, password: {minLength: number, pattern: regex, maxLength: number}, languages: {minLength: number}, bio: {maxLength: number}, email: {pattern: regex}, username: {minLength: number, maxLength: number}}}
 */
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

exports.projectConstrains = {
  name: {
    minLength: 3,
    maxLength: 255,
  },
  description: {
    minlength: 10,
    maxLength: 65535,
  },
  mission: {
    minLength: 10,
    maxLength: 65535,
  },
  technologies: {
    minLength: 1,
  },
  projectURL: {
    pattern:
      /(https?:\/\/)?([\w-])+\.{1}([a-zA-Z]{2,63})([/\w-]*)*\/?\??([^#\n\r]*)?#?([^\n\r]*)/,
  },
};
