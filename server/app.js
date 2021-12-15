require('dot-env')
const express = require('express');
const expressSessions = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const routes = require('./controller/routes');

const server = express();

server.use(bodyParser.urlencoded({ extended: true }));
server.use(bodyParser.json());
server.set('view engine', 'ejs');
server.use(express.static(path.join(__dirname, 'public')));
server.set('views',path.join(__dirname, 'views'));


const PORT = process.env.PORT || 3000;

server.use(express.json());

server.use(routes)






// server.use('',(err,req,res,next)=>{
//     console.log(err);
//     res.send("Internal Server Error");
// })

server.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});




