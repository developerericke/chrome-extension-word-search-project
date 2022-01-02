require('dotenv').config();
const cookieParser = require('cookie-parser');
const express = require('express');
const session = require('express-session');
const path = require('path');
const cors = require('cors');
const routes = require('./routes/routes');
const app = express();
var MySQLStore = require('express-mysql-session')(session);

//setting up ejs
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');


app.use(cors({
    credentials: true,
    origin: '*' //process.env.cors_origin
}))
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));

var sessionStore = new MySQLStore(
    {
        host: process.env.DB_HOST,
        port: 3306,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database:process.env.DB_NAME
    }
);
app.use(session({
    name: 'session',
    secret: process.env.SESSION_SECRET,
    resave: false,
    store: sessionStore,
    saveUninitialized: false,
    cookie: {
        maxAge: 3600 * 1000 * 24 * 30, // 30 days 
    }
}));


//running static files 
app.use(express.static(path.join(__dirname, 'public')));
app.use(routes);
// app.use('*',(req,res,next)=>{
//      res.redirect('/login')  
    
//     //return res.status(404).render('error', {error:" We can't find the Page you are looking for :(",error_details:`Please go back to safety by clicking  <a href="/">here</a>`});

// })

app.get('*',(req,res)=>{
    res.redirect('/dashboard')
})

app.use((err, req, res, next) => {

    
       return res.status(500).render('error', {error:" Something went wrong :(",error_details:"Please try again later.Our engineers are working on it. <br>"+ err});
    
});


const port = process.env.PORT || 8080;
app.listen(port, ()=>console.log(`Server starting at port ${port}`));