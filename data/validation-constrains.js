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
