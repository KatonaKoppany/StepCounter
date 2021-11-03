const express = require('express');
const ejs = require('ejs');
const path = require('path');
const session = require('express-session');
const mysql = require('mysql');
const sha1 = require('sha1');
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
            req.session.userMail = results[0].email;
            req.session.userReg = results[0].reg;
            req.session.userLast = getTimeStamp();          
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

//User passmod START
app.get('/passmod', (req, res) => {
    if(req.session.loggedIn){
        ejs.renderFile('public/passmod.ejs', {hiba:''}, (err, data) => {
            if(err) throw err;
            res.send(data);
        });
    }
    else{
        res.send('Please login to get this page');
    }
});

app.post('passmod', (req, res) => {
    var oldpass = req.body.oldpass,
        newpass1 = req.body.newpass1,
        newpass2 = req.body.newpass2;

    if(newpass1 != newpass2){
        var hiba = 'The new passwords ar not the same!';
        ejs.renderFile('public/passmod.ejs', {hiba}, (err, data) => {
            if(err) throw err;
            res.send(data);
        });
    }
    else{
        oldpass = sha1(oldpass);
        connection.query(`SELECT * FROM user WHERE ID=${req.session.userID}`, (err, results) => {
            if(err) throw err;
            if(oldpass != results[0].password){
                var hiba = 'The old password is invalid!';
                ejs.renderFile('public/passmod.ejs', {hiba}, (err, data) => {
                    if(err) throw err;
                    res.send(data);
                });
            }
            else{
                connection.query(`UPDATE users SET password=SHA1('${newpass1}') WHERE ID=${req.session.userID}`, (err,) => {
                    if(err) throw err;
                    var hiba = 'The password changed!';
                    ejs.renderFile('public/passmod.ejs', {hiba}, (err, data) => {
                        if(err) throw err;
                        res.send(data);
                    });
                });
            }
        });
    }
});
//User passmod END
//USER PROFIL EDITING START
app.get('/profilmod', (req, res) => {
    if(req.session.loggedIn){
        var profilData = {
            name: req.session.userName,
            email: req.session.userMail,
            reg: req.session.userReg,
            last: req.session.userLast
        }

        ejs.renderFile('public/profilmod.ejs', {hiba:'', profilData}, (err, data) => {
            if(err) throw err;
            res.send(data);
        });
    }
    else{

    }
});

app.post('/profilmod', (req, res) => {
    var username = req.body.username,
        email = req.body.email

    connection.query(`SELECT FROM users WHERE email='${email} AND ID<>${req.session.userID}`, (err, results) => {
        if(err) throw err;
        if(results.length > 0){
            ejs.renderFile('public/profilmod.ejs', {hiba:'This E-mail addres all ready use!', profilData}, (err, data) => {
                if(err) throw err;
                res.send(data);
            });
        }
        else{
            connection.query(`UPDATE users SET name='${username}', email='${email}' WHERE ID=${req.session.userID}`, (err) => {
                if(err) throw err;
                req.session.userName = username;
                req.session.userMail = email;
                
                ejs.renderFile('public/profilmod.ejs', {hiba:'Profil successfully changed!', profilData}, (err, data) => {
                    if(err) throw err;
                    res.send(data);
                });
            });
        }
    });
});
//USER PROFIL EDITING END


// SERVER LISTENING
app.listen(port, (err) => {
    if(err) throw err;
    console.log(`Server listening on port ${port}...`)
});

function getTimeStamp() {
    var now = new Date();
    return ( now.getFullYear() + "-" +
        ((now.getMonth() < 10) ? ("0" + now.getMonth()) : (now.getMonth())) + '-' +
        ((now.getDate() < 10) ? ("0" + now.getDate()) : (now.getDate())) + ' ' +
    
    now.getHours() + ':' +
    ((now.getMinutes() < 10)
        ? ("0" + now.getMinutes())
        : (now.getMinutes())) + ':' +
    ((now.getSeconds() < 10)
        ? ("0" + now.getSeconds())
        : (now.getSeconds())));
}