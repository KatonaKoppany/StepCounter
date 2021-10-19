const express = require('express');
const ejs = require('ejs');
const path = require('path');
const session = require('express-session');
const mysql = require('mysql');
const dbconfig = require('./config.js');

const port = process.env.port || 3000;
const app = express();

//connect to mysql database
var connection = mysql.createConnection(dbconfig);

connection.connect((err) => {
    if(err) throw err;
    console.log('Connected to MySql database...');
});

app.get('/', (req, res) => {
    ejs.renderFile('public/index.ejs', (err, data) => {
        if(err) throw err;
        res.send(data);
    });
});

// SERVER LISTENING
app.listen(port, (err) => {
    if(err) throw err;
    console.log(`Server listening on port ${port}...`)
});