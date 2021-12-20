const router = require("express").Router();
//data validation
const { body } = require("express-validator");

const {
  homePage,
  register,
  registerPage,
  login,
  loginPage,
  passwordResetLink,
} = require("../controllers/userController");

const ifNotLoggedin = (req, res, next) => {
  if (!req.session.userID) {
    return res.redirect("/login");
  }
  next();
};

const ifLoggedin = (req, res, next) => {
  if (req.session.userID) {
    
    return res.redirect("/dashboard");
  }
  next();
};

router.get("/dashboard", ifNotLoggedin, homePage);

router.get("/login", ifLoggedin, loginPage);

router.post(
  "/login",
  ifLoggedin,
  [
    body("_email", "Invalid email address")
      .notEmpty()
      .escape()
      .trim()
      .isEmail(),
    body("_password", "The Password must be of minimum 4 characters length")
      .notEmpty()
      .trim()
      .isLength({ min: 4 }),
  ],
  login
);

//getting the registration page
router.get("/signup", ifLoggedin, registerPage);

router.post(
  "/signup",
  ifLoggedin,
  [
    body("_name", "The name must be of minimum 3 characters length")
      .notEmpty()
      .escape()
      .trim()
      .isLength({ min: 3 }),
    body("_email", "Invalid email address")
      .notEmpty()
      .escape()
      .trim()
      .isEmail(),
    body("_password", "The Password must be of minimum 4 characters length")
      .notEmpty()
      .trim()
      .isLength({ min: 4 }),
  ],
  register
);
router.get("/logout", (req, res, next) => {
  req.session.destroy((err) => {
    next(err);
  });
  res.redirect("/login");
});

router.get("/recover/account", passwordResetLink);

module.exports = router;
