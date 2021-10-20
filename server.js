const express = require('express');
const ejs = require('ejs');
const path = require('path');
const session = require('express-session');
const mysql = require('mysql');
const dbconfig = require('./config.js');
const { user } = require('./config.js');

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
    ejs.renderFile('public/index.ejs', {param:'reg'}, (err, data) => {
        if(err) throw err;
        res.send(data);
    });
});

app.post('/reg', (req, res) => {
    var name = req.body.username,
        email = req.body.email,
        pass1 = req.body.password1,
        pass2 = req.body.password2;

    if(pass1 != pass2){
        var hiba = 'The passwords are not the same!';
        ejs.renderFile('public/index.ejs', {param:'reg', hiba:hiba}, (err, data) => {
            if(err) throw err;
            res.send(data);
        });
    }
    else{
        connection.query(`SELECT * FROM users WHERE email=?`, [email], (err, results) => {
            if(err) throw err;
            if(results.length > 0){
                var hiba = 'This e-mail address is already registered!';
                ejs.renderFile('public/index.ejs', {param:'reg', hiba:hiba}, (err, data) => {
                    if(err) throw err;
                    res.send(data);
                });
            }
            else{
                connection.query(`INSERT INTO users VALUES(null,'${name}','${email}',SHA1('${pass1}'),CURRENT_TIMESTAMP,null,'user',1)`, (err) => {
                    if(err) throw err;
                    res.redirect('/');
                });
            }
        });
    }
});
//user registering END

//user login/logout START
app.post('/login', (req, res) =>{
    var email = req.body.email,
        pass = req.body.password;

    connection.query(`SELECT * FROM users WHERE email='${email} AND password=SHA1('${pass}')`, (err, results) => {
        if(err) throw err;
        if(results.length == 0){
            res.send('Incorrect e-mail or password');
        }
        else{
            //belépés
        }
    });
});

app.post('/logout', (req, res) =>{

});
//user login/logout END



// SERVER LISTENING
app.listen(port, (err) => {
    if(err) throw err;
    console.log(`Server listening on port ${port}...`)
});