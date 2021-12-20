require('dotenv').config();
const cookieParser = require('cookie-parser');
const express = require('express');
const session = require('express-session');
const path = require('path');
const routes = require('./routes/routes');
const app = express();
var MySQLStore = require('express-mysql-session')(session);

//setting up ejs
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

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
    secret: 'my_secret is mine and mine alone',
    resave: false,
    store: sessionStore,
    saveUninitialized: false,
    cookie: {
        maxAge: 3600 * 1000, // 1hr
    }
}));

app.get('/',(req,res)=>{
    res.send(`<div>Hello There</div>`);
})
//running static files 
app.use(express.static(path.join(__dirname, 'public')));
app.use(routes);

app.use((err, req, res, next) => {
    console.log(err);
    return res.send('Internal Server Error');
});

const port = process.env.PORT || 8000;
app.listen(port, ()=>console.log(`Server starting at port ${port}`));