require('dot-env')
const mysql = require('mysql2/promise');



const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
}).then((conn)=>{
    return conn;
}).catch((err)=>{
    console.log(err);
})


module.exports = connection;