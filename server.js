const express = require('express');
const ejs = require('ejs');
const path = require('path');
const session = require('express-session');
const mysql = require('mysql');
const dbconfig = require('./config.js');

const port = process.env.port || 3000;
const app = express();

//connect to mysql database START
var connection = mysql.createConnection(dbconfig);

connection.connect((err) => {
    if(err) throw err;
    console.log('Connected to MySql database...');
});
//connect to mysql database END

//midlewares START
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, '/public')));
app.use(express.urlencoded({extended:true}));
app.use(express.json());
//midlewares END

app.get('/', (req, res) => {
    ejs.renderFile('public/index.ejs', {param:'login'}, (err, data) => {
        if(err) throw err;
        res.send(data);
    });
});
//user registering START
app.get('/reg', (req, res) => {
    ejs.renderFile('public/index.ejs', {patam:'reg'}, (err, data) => {
        if(err) throw err;
        res.send(data);
    });
});
//user registering END




// SERVER LISTENING
app.listen(port, (err) => {
    if(err) throw err;
    console.log(`Server listening on port ${port}...`)
});