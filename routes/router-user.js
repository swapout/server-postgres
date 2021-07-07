const express = require("express");
const router = express.Router();

const {
  createUser,
  loginUser,
  getUserProfile,
  deleteUser,
  updateUser,
  updateUsername,
  updateEmail,
  updatePassword,
  logout,
  logoutAll,
  forgotPassword,
  passwordReset,
} = require("../controllers/controller-user");
const {
  registerUserValidation,
  loginUserValidation,
  updateUserDetailsValidation,
  updateUserEmailValidation,
  updateUserUsernameValidation,
  updateUserPasswordValidation,
} = require("../middlewares/validations/validation-user");
const { auth } = require("../middlewares/middleware-auth");

router.route("/register").post(registerUserValidation, createUser);
router.route("/login").post(loginUserValidation, loginUser);
router.route("/").get(auth, getUserProfile);
router.route("/").delete(auth, deleteUser);
router.route("/").patch(updateUserDetailsValidation, auth, updateUser);
router.route("/logout").get(auth, logout);
router.route("/logout/all").get(auth, logoutAll);
router
  .route("/password")
  .patch(updateUserPasswordValidation, auth, updatePassword);
router
  .route("/username")
  .patch(updateUserUsernameValidation, auth, updateUsername);
router.route("/email").patch(updateUserEmailValidation, auth, updateEmail);
router.route("/forgot-password").post(forgotPassword);
router.route("/password-reset/:token").post(passwordReset);

module.exports = router;
