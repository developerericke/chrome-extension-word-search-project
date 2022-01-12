require('dotenv').config();
//validation of data details
const {validationResult} = require('express-validator');
//for encrypting db password
const bcrypt = require('bcryptjs');
const slugify = require('slugify');
const request = require('request');

//connection with the db
const db = require('../utils/dbConnection');


const url_token = require('base64url');
const nodemailer = require('nodemailer');
const moment = require('moment');


let email_transport = nodemailer.createTransport({
    host: process.env.EMAIL_HOST, 
    port: process.env.EMAIL_PORT, //587,25
    //secure: true, // upgrade later with STARTTLS
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
  });

function email_sender_is_active(){

    email_transport.verify(function (error, success) {
        if (error) {
          return false;
        } else {
          return true;
        }
      });
}



//get routes

//get logged in user

async function loggedUser(req){
    if(req.session.userID){
    try{
        [rows,fields] = await db.query("SELECT * FROM `T_Users` WHERE `ID`=?",[req.session.userID]);
        
        if (rows.length > 0) {
                return rows[0];
        }   else {
            return null;
        }
    }catch(err){
     
        return null;
    }
       
       

 
       
        
    }else{
        return null
    }
   
}

exports.landingPage = async (req, res, next) => {

        res.render('index')

};
exports.privacyPage = async (req, res, next) => {

res.render('privacy')

};

exports.termsPage = async (req, res, next) => {

res.render('terms')

};

// Register Page
exports.registerPage = async (req, res, next) => {
   

    let logged_in_user =await loggedUser(req)
    if(logged_in_user == null){
        res.render('register')
    }else{   
        res.redirect('/dashboard')
    }

};

//recover-account
exports.recoverAccountPage = (req, res, next) => {
    res.render("forgot-password");
}

// Login Page rendering  
exports.loginPage = async (req, res, next) => {
    let logged_in_user =await loggedUser(req)

  
    if(logged_in_user == null){
        res.render('login')
    }else{   
        res.redirect('/dashboard')
    }
    
};



//dashboard
exports.homePage = async (req, res, next) => {
     
  try{
    let logged_in_user =await loggedUser(req)


    if(logged_in_user == null){
      return res.redirect('/login')
    }else{    
        const [searches] = await db.query("SELECT * FROM `T_Searches` WHERE `search_user`=?", [req.session.userID]); 

        let words_found  = []

        searches.forEach(search => {
          
          let full_meaning = JSON.parse(search.meaning)
          let word__slug = slugify(search.word)
          let word_meanings  = []


           full_meaning.forEach(Meaning => {
               Meaning.meanings.forEach(meaning => {
                       meaning.definitions.forEach((definition)=>{
                            word_meanings.push(definition.definition)
                       })

      
                
               })
               //go through all results from dictionary
                 

          })

          words_found.push({
                word:search.word,
                word_slug:word__slug,
                meanings : word_meanings,
                date:moment(search.date_searched).format('YYYY-MM-DD')
          })

 
        })


       return res.render('dashboard', {
            user:logged_in_user,
            searches: words_found
        });
    }
  }catch(err){
      console.log(err)
    return res.status(500).render('error', {error:" Something went wrong :(",error_details:"Please try again later.Our engineers are working on it."});

  }  


}







// User Registration
exports.register = async (req, res, next) => {
 try{   
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
        const [row] = await db.query(
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
                error: '<b>Failed</b> Your registration has failed.Please try again later'//,msg:false
            });
        }
        // res.render("register", {
        //     message: 'You have successfully registered.'
        // });
        let date_requested = new Date().toLocaleTimeString();
        const generated_token = url_token(String(body._email)+date_requested);
        //send email to user
        email_transport.sendMail({
            from: `'Word Meaning Saver' <${process.env.SENDER_EMAIL}>`,
            to: body._email,
            subject: "Word Meaning Saver - Account Action",
            //text: "Developer test ",
            html: `<div style='text-decoration:underline;font-weight:bold;text-align:center;font-size:large'>Account Registration</div> <br><br> 
            <p>Hi ${body._name},<br> 
            Your account was registered succesfully.<br><br>
             To complete the registration ,please the link below to activate your account:</p>
            <br><a ' href='${process.env.DOMAIN_NAME}/activate-account?token=${generated_token}'>Click here to activate your account</a> <br><br>
            
            `

         }).then((info)=>{
                
                 if(info.accepted.length > 0){
                      //add token to database
                      

                     const token_expiry = moment().add(1, 'days').format('YYYY-MM-DD HH:mm:ss')  

                 
                        
                        db.execute( "INSERT INTO `T_action_tokens` (`User_email`,`Token_type`,`Token`,`Token_expiry`) VALUES(?,?,?,?)",[body._email,"activate",generated_token,token_expiry])
                       .then((dbresadd)=>{
                         
       
                           if (dbresadd[0].affectedRows !== 1) {
    
                             return res.render('register',{error:"Something isn't right with our servers. Please try again later."});
                           }else{ 
                                res.render("register", {
                                    message: 'You have successfully registered.'
                                });
                          

                           }
                        }).catch((err)=>{
                          
                     
                            return res.render('register',{error:"Something isn't right with our servers. Please try again later."});
                        })  

                 }else{
                    return res.render('register',{error:"Something isn't right with our servers. Please try again later."});
                 }
           }).catch((err)=>{
              
               return res.render('register',{error:"Something isn't right with our servers. Please try again later."});
           })
         
    }else{
        
        res.render("register",{
            error: 'Passwords must Match.'//,msg:false
        })
    }
    } catch (e) {
        console.log(e)
        next(e);
    }

 }catch(err){
     console.log(err)
    return res.status(500).render('error', {error:" Something went wrong :(",error_details:"Please try again later.Our engineers are working on it."});

  }    
};

exports.activateAccount = async (req, res, next) => {
    try{  
      //get token from url
         const { query } = req;
  
         if([query.token] == undefined || [query.token] == null || [query.token] == ""){
             return res.render('login',{error:"The token you provided is invalid .Please check your email for the activation link."});
         }else{
             //get token from database
             const [row] = await db.query("SELECT * FROM `T_action_tokens` WHERE `Token`=?",[query.token]);
             if (row.length !== 1) {
                 return res.render('login',{error:"The token you provide is invalid . Please check your email for the activation link."});
             }
             //check if token is expired
             let token_expiry = moment(row[0].Token_expiry).format('YYYY-MM-DD HH:mm:ss');
             let now = moment().format('YYYY-MM-DD HH:mm:ss');
             if (now > token_expiry){
                 return res.render('login',{error:"The token you provide is invalid . Please check your email for the activation link."});
             }
  
             //update user status to active
              const [row2] = await db.execute("UPDATE `T_Users` SET `Is_Active`=? WHERE `User_email`=?",["1",row[0].User_email]);
              if (row2.affectedRows !== 1) {
                  return res.render('login',{error:"Something isn't right with our servers. Please try again later."});
              }
            
             //token is valid, render reset password page
             return res.render('login',{message:"Your account has been activated succesfully."});
         }
      }catch(err){
          return res.status(500).render('error', {error:" Something went wrong :(",error_details:"Please try again later.Our engineers are working on it."});
      
        } 
  
  }



// Login User
exports.login = async (req, res, next) => {
  try{  
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

        const [row] = await db.query('SELECT * FROM `T_Users` WHERE `User_email`=?', [body._email]);

        if (row.length != 1) {
            return res.render('login', {
                error: 'Invalid email address/password combination.'
            });
        }

        //check if user is active
        if(row[0].Is_Active == 0){
            return res.render('login', { error: 'Your account is not activated. Please activate your account by clicking the link sent to your email.' });
        }

        const checkPass = await bcrypt.compare(body._password, row[0].User_password);

        if (checkPass === true) {
            req.session.userID = row[0].ID;
            return res.redirect('/dashboard');
            
        }else{
           return res.render('login', {
                error: '- Invalid email address/password combination.'
            });
        }

      
    
 

}catch(err){
    return res.status(500).render('error', {error:" Something went wrong :(",error_details:"Please try again later.Our engineers are working on it."});

  }   

}


//Send Password reset token
exports.passwordRecover = async (req, res, next) => {
  try{    
    const { body } = req;
    const [row] = await db.query("SELECT * FROM `T_Users` WHERE `User_email`=?",[ body.email ]);
   
 
    if (row.length !== 1) {
        res.render('forgot-password',{error:"Invalid email address."});
        
    }else{
         //Send token to email for that user and add to database
         //get user email and date requested to generate base64url from
         let userEmail = row[0].User_email;
         let date_requested = new Date().toLocaleTimeString();
         generated_token = url_token(userEmail+date_requested);
         
         //try and send to email,if succeeds, add to database
         if (email_sender_is_active() == false){

           
             res.render('forgot-password',{error:"Something isn't right with our servers. Please try again later."});
         }else{
            
      
             email_transport.sendMail({
                from: `'Word Meaning Saver' <${process.env.SENDER_EMAIL}>`,
                to: userEmail,
                subject: "Word Meaning Saver - Account Action",
                //text: "Developer test ",
                html: `<div style='text-decoration:underline;font-weight:bold;text-align:center;font-size:large'>Password Reset </div> <br><br> 
                <p>Hi there, we have recieved a request to reset your password.<br><br>
                 If you did not make this request, please ignore this email.
                 Otherwise, click the link below to reset your password:</p>
                <br><a ' href='${process.env.DOMAIN_NAME}/reset-password?token=${generated_token}'>Click here to Reset Password</a> <br><br>
                
                <p>This link will expire in 24 hours.</p>`

             }).then((info)=>{
                     if(info.accepted.length > 0){
                          //add token to database
                          

                         const token_expiry = moment().add(1, 'days').format('YYYY-MM-DD HH:mm:ss')  

                     
                            
                            db.execute( "INSERT INTO `T_action_tokens` (`User_email`,`Token_type`,`Token`,`Token_expiry`) VALUES(?,?,?,?)",[userEmail,"reset",generated_token,token_expiry])
                           .then((dbresadd)=>{
           
                               if (dbresadd[0].affectedRows !== 1) {
    
                                res.render('forgot-password',{error:"Something isn't right with our servers. Please try again later."});
                               }else{ 
                                res.render('forgot-password',{message:true});
                              

                               }
                            }).catch((err)=>{
                         
                                res.render('forgot-password',{error:"Something isn't right with our servers. Please try again later."});
                            })  

                     }else{
                            res.render('forgot-password',{error:"Something isn't right with our servers. Please try again later."});
                     }
               }).catch((err)=>{
                   console.log(err)
                   res.render('forgot-password',{error:"Something isn't right with our servers. Please try again later."});
               })
        
    
    }
    }
  }catch(err){
    return res.status(500).render('error', {error:" Something went wrong :(",error_details:"Please try again later.Our engineers are working on it."});

  } 
 
}

//validate passwrod reset
exports.resetForgotPassword = async (req, res, next) => {

   try{ 
     //get token from url
        const { query } = req;

        if([query.token] == undefined || [query.token] == null || [query.token] == ""){
            return res.render('forgot-password',{error:"The token you provide is invalid or has expired. Please use the form below to request a new token."});
        }else{
            //get token from database
            const [row] = await db.query("SELECT * FROM `T_action_tokens` WHERE `Token`=?",[query.token]);
            if (row.length !== 1) {
                return res.render('forgot-password',{error:"The token you provide is invalid or has expired. Please use the form below to request a new token."});
            }
            //check if token is expired
            let token_expiry = moment(row[0].Token_expiry).format('YYYY-MM-DD HH:mm:ss');
            let now = moment().format('YYYY-MM-DD HH:mm:ss');
            if (now > token_expiry){
                return res.render('forgot-password',{error:"The token you provide is invalid or has expired. Please use the form below to request a new token."});
            }
            //token is valid, render reset password page
            return res.render('reset-password',{message:"token is valid",email:row[0].User_email});
        }
    }catch(err){
        return res.status(500).render('error', {error:" Something went wrong :(",error_details:"Please try again later.Our engineers are working on it."});
    
      } 

}



//password updade 
exports.updatePassword_from_reset = async (req, res, next) => {

  try{  
     const { body } = req;
     if([body.password] == undefined || [body.password] == null || [body.password] == "" || [body.email] == undefined || [body.email] == null || [body.email] == ""){
              return res.render('forgot-password',{error:"Invalid password reset token.Please request a new token using the form below"});

    }else{
                //hash password
                
                const hashed_password = await bcrypt.hash(body.password, 12);
                
                const [row] = await db.execute("UPDATE `T_Users` SET `User_password`=? WHERE `User_email`=?",[hashed_password,body.email]);
                    
               

                if (row.affectedRows !== 1) {
                  
                        return res.render('reset-password',{error:"Something went wrong. Please try again later."});

                }
                //remove token from database
                const [row2] = await db.execute("DELETE FROM `T_action_tokens` WHERE `User_email`=?",[body.email]);
               
                if (row2.affectedRows !== 1) {
                     //return res.render('reset-password',{error:"Something went wrong. Please try again later."});
                     return res.redirect('/login?source=reset');    
                }
            
                //redirect to login page
 
                 return res.redirect('/login?source=reset');

            
 
   } 
}catch(err){
    return res.status(500).render('error', {error:" Something went wrong :(",error_details:"Please try again later.Our engineers are working on it."});

  } 

}

//password update
exports.updatePassword_from_dashboard = async (req, res, next) => {
  try{ 
    const { body } = req;
    if([body.password] == undefined || [body.password] == null || [body.password] == "" ||  [body.current_password] == undefined || [body.current_password] == null || [body.current_password] == "" ){
       return res.status(400).json({error:"<b>Failed !<b/> Current and New password is required"})
    
    }else{ 
                        //hash password               
                       const hashed_password = await bcrypt.hash(body.password, 12);
                       const logged_user = await loggedUser(req)
                       if(logged_user ==  null){
                        return res.status(403).json({error:"<b>Failed !<b/> Request Forbidden"})
                          
                       }else{
    
                        let password_match= await bcrypt.compare(body.current_password, logged_user.User_password);
                        if (!password_match){
                            return res.status(400).json({error:"<b>Failed !</b> The current password you provided appears to be incorrect."}); 
                        }
                        const [row] = await db.execute("UPDATE `T_Users` SET `User_password`=? WHERE `User_email`=? ",[hashed_password,logged_user.User_email]);
             
                        if (row.affectedRows !== 1) {
                                return res.status(400).json({error:"<b>Failed !</b> Internal Server Error.Please retry later"});                        
                        }

                        return res.status(200).json({message:"<b>Success !</b> Your password has been updated successfully."});
            }

   }
}catch(err){
    res.status(500).json({error:"Something went wrong on our end:(",error_details:"Please try again later.Our engineers are working on it."});
}
  
}

//find and save word meaning
exports.search_api = async (req, res, next) => {
   try{
    const {body} = req
    let user_id  = 0


    
    if(req.session.userID){
        user_id = req.session.userID
    }
    
    if (body.keywords == "" || body.keywords == null || body.keywords == undefined){
        res.status(400).json({"message": "Please enter a search query."});
    }else{
        //we have search keyword
   
        let user_keyword = String(body.keywords).split(' ');
  
  

        let words_to_remove = ['meaning','what','is','of','the','define']
  
        let determiners_list = ['the','a','an', 'this', 'that', 'these', 'those', 'my', 'your', 'his', 'her', 'its', 'our', 'their', 'ourselves', 'yourself', 'himself', 'herself', 'itself', 'themselves', 'i', 'me', 'we', 'us', 'you', 'he', 'she', 'they'
           ]
          
        if (user_keyword.length > 1) {  
            let valid_search_words = []    
            user_keyword.forEach((word,index)=>{

               if (words_to_remove.indexOf(word.toLowerCase()) == -1){
                   
                   valid_search_words.push(word)
               }
               
                
            }) 

            user_keyword = valid_search_words.map(element=>element).join("-")
     
        
       }else if(user_keyword.length == 1){
               if (determiners_list.includes(user_keyword[0].toLowerCase())){
                user_keyword = String(user_keyword[0]).replaceAll(' ','')
               }
             
       }else{
           user_keyword = ""
       }

       user_keyword  =  String(user_keyword).replaceAll('  ',' ').replaceAll(' ','-')
       if(user_keyword[0] == '-'){ 
              user_keyword = user_keyword.substring(1,user_keyword.length)
       }
         if(user_keyword[user_keyword.length-1] == '-'){
                user_keyword = user_keyword.substring(0,user_keyword.length-1)
            }
       


       const user_actual_keyword =  String(user_keyword).replaceAll('-',' ').split(' ')
       .map(w => String(w[0]).toUpperCase() + String(w).substr(1).toLowerCase())
       .join(' ')
  

       
        //goat--cheese

        //we have removed all unnecesary words that can be used to search
        
       

        request('https://api.dictionaryapi.dev/api/v2/entries/en/'+user_keyword, function (error, response, body) {

                 if(response.statusCode == 200){
                    

                    //add to database and send response to user
               
                    db.execute(`insert into T_Searches (word,meaning,search_user) values (?,${JSON.stringify(body)},?)`,[`${user_actual_keyword}`,user_id])
                    .then((dbres)=>{
                     
                        if (dbres[0].affectedRows == 1) {
                            return res.status(200).json({"message": "Search API","keywords":user_keyword}); 
                        }else{
                            
                            return res.status(500).json({"message": "Search API","keywords":user_keyword});  
                        }

                    }).catch((err)=>{
                  
                        return res.status(500).json({"message": "Search API","keywords":user_keyword});  
                    })
                   
                    
                 }else{
      
                    return res.status(400).json({"message": "Search API","keywords":user_keyword});  
                 }
               
                  
        });


    }

}catch(err){
    return res.status(500).render('error', {error:" Something went wrong :(",error_details:"Please try again later.Our engineers are working on it."});

  }   


}


//get json of meanings saved in database
exports.search_api_get = async (req, res, next) => {

  try{  
    let user_id = req.session.userID
    let user_keyword = req.params.word
    

    if (user_keyword == "" || user_keyword == null || user_keyword == undefined){

        res.status(400).json({"message": "We cannot find the word you are looking for. It's possible the word was not captured by our chrome extension tool"});
     
    }else{
        let exact_word = String(user_keyword).replaceAll('-',' ')
        const [ rows ] = await db.query(`select * from T_Searches where word = ? and search_user = ?`,[exact_word,user_id])
        if (rows.length > 0){
     
            res.status(200).json({"user search word(s)":rows[0].word,"api_meaning":JSON.parse(rows[0].meaning)})
        }else{
            res.status(400).json({"message": "We cannot find the word you are looking for. It's possible the word was not captured by our chrome extension tool"});
        }
    }  
    
}catch(err){
    return res.status(500).render('error', {error:" Something went wrong :(",error_details:"Please try again later.Our engineers are working on it."});

  }   
    
    
}

exports.chrome_extension_user_state = async function(req,res,next){
  try{  
    logged_in_user = await loggedUser(req)
    if(logged_in_user != null){
        return res.status(200).json({user:logged_in_user.User_name})
    }else{
        return res.status(401).json({"message":"You are not logged in"})
    }
 }catch(err){
    return res.status(500).json({user:null})
 }

}

//format search keywords
//error display in client chrome extension

//create privacy policy link

//try background js to handle saving
//add shortcut to saving in chrome
