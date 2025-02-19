const mysql = require("mysql2/promise");
const dotenv = require("dotenv");
dotenv.config();

const connection = mysql.createConnection({
    host: process.env.HOST,
    database: process.env.DATABASE,
    user: process.env.USER, 
    password: process.env.PASSWORD
})

const getConnection = async () => {
    return await connection
}

module.exports = {
    getConnection
}