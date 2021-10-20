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
    var name = req.body.name,
        email = req.body.email,
        pass1 = req.body.password1,
        pass2 = req-body.password2;

    if(pass1 != pass2){
        res.send('The passwords are not the same!')
    }
    else{
        connection.query(`SELECT * FROM users WHERE email=?`, [email], (err, results) => {
            if(err) throw err;
            if(results.length > 0){
                res.send('This e-mail address is already registered!');
            }
            else{
                connection.query(`INSERT INTO users VALUES(null,'${name}','${email}',SHA1'${pass1}',CURRENT_TIMESTAMP,null,'user',1)`, (err) => {
                    if(err) throw err;
                    res.redirect('/');
                });
            }
        });
    }
});
//user registering END




// SERVER LISTENING
app.listen(port, (err) => {
    if(err) throw err;
    console.log(`Server listening on port ${port}...`)
});