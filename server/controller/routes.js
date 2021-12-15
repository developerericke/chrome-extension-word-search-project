const router = require('express').Router();


//render homepage
router.get('/', (req, res) => {


})
//render login/signup page
router.get('/signup', (req, res) => {
     
  
    res.render('authenticate', {auth_type:'signup',errors:[]});

})

//render forgot password page
router.get('/forgot-password', (req, res) => {})

//render user dashboard
router.get('/dashboard', (req, res) => {})

// render privacy policy link
router.get('/privacy', (req, res) => {})


//render terms of service link
router.get('/terms', (req, res) => {})




module.exports = router;