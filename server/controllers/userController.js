require('dotenv').config();
//validation of data details
const {validationResult} = require('express-validator');
//for encrypting db password
const bcrypt = require('bcryptjs');
const request = require('request');
//connection with the db
const db = require('../utils/dbConnection');


const url_token = require('base64url');
const nodemailer = require('nodemailer');
const moment = require('moment');


let email_transport = nodemailer.createTransport({
    host: process.env.EMAIL_HOST, 
    port: process.env.EMAIL_PORT, //587,25
    secure: true, // upgrade later with STARTTLS
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
  });

function email_sender_is_active(){

    email_transport.verify(function (error, success) {
        if (error) {

          console.log(error)  


          return false;
        } else {
          return true;
        }
      });
}

// Home Page
exports.homePage = async (req, res, next) => {


    const [row] = await db.execute("SELECT * FROM `T_Users` WHERE `id`=?", [req.session.userID]);
    const [searches] = await db.execute("SELECT * FROM `T_Searches` WHERE `search_user`=?", [req.session.userID]); 
    if (row.length !== 1) {
        return res.redirect('/logout');
    }


    res.render('dashboard', {
        user: row[0],
        searches: searches
    });
}

// Register Page
exports.registerPage = (req, res, next) => {
 //   res.render("authenticate",{auth_type:'signup'});
 res.render('register')
};

// User Registration
exports.register = async (req, res, next) => {
    const errors = validationResult(req);
    const { body } = req;
   


    if (!errors.isEmpty()) {
        let validation_errs = ''
        errors.array().forEach((err)=>{
      
            validation_errs +=  `-  ${err.msg}  <br> `;
        })
        return res.render('register', {
            error: validation_errs 
        });
    }
    try {
        const [row] = await db.execute(
            "SELECT * FROM `T_Users` WHERE `User_email`=?",
            [body._email],
        );

        if (row.length >= 1) {
            return res.render('register', {
                error: '- This email already in use.'
            });
        }
        
        if(body._password == body._confirm_password){
        const hashPass = await bcrypt.hash(body._password, 12);

        const [rows] = await db.execute(
            "INSERT INTO `T_Users`(`User_name`,`User_email`,`User_password`) VALUES(?,?,?)",
            [body._name, body._email, hashPass]
        );
       
        if (rows.affectedRows !== 1) {
            return res.render('register', {
                error: ' - Your registration has failed.'//,msg:false
            });
        }
        
        res.render("register", {
            message: 'You have successfully registered.'
        });
    }else{
        //should be an error ju imefail pia
        res.render("register",{
            error: '- Passwords do not match.'//,msg:false
        })
    }
    } catch (e) {
        console.log(e)
        next(e);
    }
};

// Login Page rendering  
exports.loginPage = (req, res, next) => {
    res.render("login");
};



// Login User
exports.login = async (req, res, next) => {
    const errors = validationResult(req);
    const { body } = req;

    if (!errors.isEmpty()) {
        let validation_errors = ''
        errors.array().forEach((err)=>{
            validation_errors +=  `-  ${err.msg}  <br> `;
        })
        return res.render('login', {
            error: validation_errors
        });
    }
    try {
        const [row] = await db.execute('SELECT * FROM `T_Users` WHERE `User_email`=?', [body._email]);

        if (row.length != 1) {
            return res.render('login', {
                error: '- Invalid email address/password combination.'
            });
        }

        const checkPass = await bcrypt.compare(body._password, row[0].User_password);

        if (checkPass === true) {
            req.session.userID = row[0].ID;
            return res.redirect('/dashboard');
            
        }

        res.render('login', {
            error: '- Invalid email address/password combination.'
        });
    }
    catch (e) {
        next(e);
    }

}


//reset password
exports.passwordResetLink = async (req, res, next) => {
      
    const { query } = req;
   

    sql = "SELECT * FROM `T_Users` WHERE `User_email`=?";

    const [row] = await db.execute(sql,[query.email]);
   
    
    if (row.length !== 1) {
        res.status(400).json({"message": "Invalid email address."});
    }else{
         //Send token to email for that user and add to database
         //get user email and date requested to generate base64url from
         let userEmail = row[0].User_email;
         let date_requested = new Date().toLocaleTimeString();
         generated_token = url_token(userEmail+date_requested);
         
         //try and send to email,if succeeds, add to database
         if (email_sender_is_active() == false){

             console.log("mailserver off")
               res.status(500).json({"message": "Internal server error."});
         }else{
      
             email_transport.sendMail({
                from: "developer.ericke@gmail.com",

                to: "wilsonkaroki6205@gmail.com",
                to: "nderituericke@gmail.com",
                subject: "Account Action",
                //text: "Developer test ",
                html: "<h3 style='text-decoration:underline;font-weight:bold;text-align:center'>Password Reset</h3> <p>Click on the link below to reset your password.</p><br><a ' href='http://localhost:5000/reset-password?token="+generated_token+"'>Reset Password</a> <br> <p>This link will expire in 24 hours.</p>"

             }),(err,info)=>{

                 if (err) return  res.status(500).json({"message": "Internal server error."});
                 if(info.accepted.length > 0){
                          //add token to database
                          sql_insert = "INSERT INTO `T_action_tokens` (`User_email`,`Token_type`,`Token`,`Token_expiry`) VALUES(?,?,?,?)";

                         const token_expiry = moment().add(1, 'days').format('YYYY-MM-DD HH:mm:ss')  

                         console.log(token_expiry)
                            
                            db.execute(sql_insert,[userEmail,"reset",generated_token,token_expiry])
                           .then((dbres)=>{
                               console.log(dbres[0].affectedRows)
                               if (dbres[0].affectedRows !== 1) {
                                console.log(dbres[0].affectedRows)
                     
                            
                            db.execute(sql_insert,[userEmail,"reset",generated_token,token_expiry])
                           .then((dbres)=>{
                               if (dbres.affectedRows !== 1) {
                                res.status(500).json({"message": "Internal server error."});
                               }else{ 
                                res.status(200).json({"message": "Password reset link sent to your email."});
                               }
                                 
                             }).catch((err)=>{

                                 console.log(err)
                          
                                 res.status(500).json({"message": "Internal server error."});
                             })                         

                 }else{
                    res.status(500).json({"message": "Internal server error."});
                 }

             })

         }

        
    }
    }
    }
 
}


exports.search_api = async (req, res, next) => {

    const {body} = req
    
    if (body.keywords == "" || body.keywords == null || body.keywords == undefined){
        res.status(400).json({"message": "Please enter a search query."});
    }else{
        //we have search keyword
        let user_keyword = body.keywords;

        let words_to_remove = ["a","an","the","is","are","was","were",'meaning','what']

        words_to_remove.forEach((word)=>{
            if (user_keyword.includes(word)){
                user_keyword = user_keyword.replace(word,"")
                user_keyword = user_keyword.replace("  "," ")
            }
        })  
        //goat--cheese

        //we have removed all unnecesary words that can be used to search
        user_keyword = String(user_keyword).replaceAll(' ','-')

        request('https://api.dictionaryapi.dev/api/v2/entries/en/'+user_keyword, function (error, response, body) {
                console.error('error:', error); // Print the error if one occurred
                console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
                console.log('body:', body); // Print the HTML for the Google homepage.

                //save the search keywords to the database
                //allow login
                  return res.status(200).json({"message": "Search API"});
});


    }


}