const express = require('express');
const ejs = require('ejs');
const path = require('path');
const session = require('express-session');
const mysql = require('mysql');
const dbconfig = require('./config.js');
const { user } = require('./config.js');

const port = process.env.port || 8080;
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
app.use(session({
    resave: true,
    saveUninitialized: true,
    secret: 'secret'
}));
//midlewares END

app.get('/', (req, res) => {
    ejs.renderFile('public/index.ejs', {param:'login'}, (err, data) => {
        if(err) throw err;
        res.send(data);
    });
});

app.get('/home', (req,res) => {
    if(req.session.loggedIn){
        ejs.renderFile('public/home.ejs', (err, data) => {
            if(err) throw err;
            res.send(data);
        });
    }
    else{
        res.send('Please login to get this page');
    }
});

//user registering START
app.get('/reg', (req, res) => {
    ejs.renderFile('public/index.ejs', {param:'reg', hiba:''}, (err, data) => {
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
    
    connection.query(`SELECT * FROM users WHERE email='${email}' AND password=SHA1('${pass}')`, (err, results) => {
        if(err) {
            console.log(err);
            console.log('XD');
        }
        if(results.length == 0){
            res.send('Incorrect e-mail or password');
        }
        else{
            //belépés
            req.session.userID = results[0].ID;
            req.session.userName = results[0].username;
            req.session.loggedIn = true;
            
            //last mező
            connection.query(`UPDATE users SET last=CURRENT_TIMESTAMP WHERE ID =${results[0].ID}` ,(err)=>{
                if (err) throw err;
            });
            res.redirect('/home');
        }
    });
});

app.get('/logout', (req, res) =>{
    req.session.loggedIn = false;
    res.redirect('/');
});
//user login/logout END



// SERVER LISTENING
app.listen(port, (err) => {
    if(err) throw err;
    console.log(`Server listening on port ${port}...`)
});