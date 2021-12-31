const router = require("express").Router();
//data validation
const { body } = require("express-validator");

const {
  homePage,
  register,
  registerPage,
  login,
  loginPage,
  passwordRecover,
  search_api,
  search_api_get,
  recoverAccountPage,
  resetForgotPassword,
  updatePassword_from_reset,
  updatePassword_from_dashboard,
  activateAccount,
  chrome_extension_user_state
} = require("../controllers/userController");


const loginRequired = (req,res,next) =>{
  
  if (!req.session.userID) {
    return res.redirect("/login");
  }
  
  next();
}

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

router.get("/dashboard", loginRequired, homePage);

router.get("/login",  loginPage);
router.get('/password/recover',recoverAccountPage)

router.post(
  "/login",
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
router.get("/signup",registerPage);

router.post(
  "/signup",
 
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

router.post("/recover", passwordRecover);
router.get('/activate-account',activateAccount)

router.post('/recover/update-password',updatePassword_from_reset)
router.post('/dashboard/update-password',updatePassword_from_dashboard)

router.post('/api/v1/search',search_api)

router.get('/api/v1/user/state',chrome_extension_user_state)

router.get('/api/v1/logout',(req,res,next)=>{
  req.session.destroy((err) => {
    next(err);
  });
  res.status(200).json({user:'Null'});
})

router.get('/words/view/:word',loginRequired,search_api_get)

router.get('/reset-password',resetForgotPassword)



module.exports = router;
