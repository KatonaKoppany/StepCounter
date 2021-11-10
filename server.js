const express = require('express');
const ejs = require('ejs');
const path = require('path');
const session = require('express-session');
const mysql = require('mysql');
const moment = require('moment');
const dbconfig = require('./config.js');
const exp = require('constants');
const { threadId } = require('worker_threads');
const sha1 = require('sha1');
const port = process.env.port || 3000;
const app = express();

app.set('view engine', 'ejs');

// connect to mysql database
var connection = mysql.createConnection(dbconfig);

connection.connect((err)=>{
    if (err) throw err;
    console.log('Connected to MySQL database...');
})

// middlewares
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, '/public')));
app.use(express.urlencoded({extended:true}));
app.use(express.json());
app.use(session({
    resave : true,
    saveUninitialized : true,
    secret : 'secret'
}));

// routing system
app.get('/', (req, res)=>{
    ejs.renderFile('public/index.ejs', {param:'login',hiba:''}, (err, data)=>{
        if (err) throw err;
        res.send(data);
    })
});

app.get('/home', (req, res)=>{
    if (req.session.loggedIn)
    {
        ejs.renderFile('public/home.ejs',{uname:req.session.userName}, (err, data)=>{
            if (err) throw err;
            res.send(data);
        });
    }
    else
    {
        res.send('Please login to get this page!');
    }
});

// user registering
app.get('/reg', (req, res)=>{
    ejs.renderFile('public/index.ejs', {param:'reg',hiba:''},(err, data)=>{
        if (err) throw err;
        res.send(data);
    })
});

app.post('/reg', (req, res)=>{
    var name = req.body.name,
        email = req.body.email,
        pass1 = req.body.passwd1,
        pass2 = req.body.passwd2;

    if (pass1 != pass2)
    {
        var hiba = 'The passwords are not the same!';
        ejs.renderFile('public/index.ejs', {param:'reg', hiba}, (err, data)=>{
            if (err) throw err;
            res.send(data);
        });
    }
    else
    {
        connection.query(`SELECT * FROM users WHERE email='${email}'`, (err, results)=>{
            if (err) throw err;
            if (results.length > 0)
            {
                var hiba = 'This e-mail address is alredy registered!';
                ejs.renderFile('public/index.ejs', {param:'reg', hiba}, (err, data)=>{
                    if (err) throw err;
                    res.send(data);
                });
            }
            else
            {
                connection.query(`INSERT INTO users VALUES(null, '${name}', '${email}', SHA1('${pass1}'), CURRENT_TIMESTAMP, null, 'user', 1)`, (err)=>{
                    if (err) throw err;
                    res.redirect('/');
                });
            }
        });
    }
});

// user login/logout
app.post('/login', (req, res)=>{
    var email = req.body.email,
        pass = req.body.passwd;

    connection.query(`SELECT * FROM users WHERE email='${email}' AND password=SHA1('${pass}')`, (err, results)=>{
        if (err) throw err;
        if (results.length == 0)
        {
            res.send('Incorrect e-mail or password!');
        }
        else
        {
            if (results[0].status == 0)
            {
                res.send('This user is banned!');
            }
            else
            {
                // beléphet
                // session változók létrehozása
                req.session.userID = results[0].ID;
                req.session.userName = results[0].username;
                req.session.userMail = results[0].email;
                req.session.userReg = results[0].reg;
                req.session.userLast = getTimeStamp();
                req.session.loggedIn = true;
                // last mező frissítése
                connection.query(`UPDATE users SET last=CURRENT_TIMESTAMP WHERE ID =${results[0].ID}` ,(err)=>{
                    if (err) throw err;
                });
                res.redirect('/home');
            }
        }
    });
});

app.get('/logout', (req, res)=>{
    req.session.loggedIn = false;
    res.redirect('/');   
});

// user passmod
app.get('/passmod', (req, res)=>{
    if (req.session.loggedIn)
    {
        ejs.renderFile('public/passmod.ejs', {hiba:''}, (err, data)=>{
            if (err) throw err;
            res.send(data);
        });
    }
    else
    {
        res.send('Please login to get this page!');
    }
});

app.post('/passmod', (req, res)=>{
    var oldpass = req.body.oldpass,
        newpass1 = req.body.newpass1,
        newpass2 = req.body.newpass2;

    if (newpass1 != newpass2)
    {
        var hiba = "The new passwords are not the same!";
        ejs.renderFile('public/passmod.ejs', {hiba}, (err, data)=>{
            if (err) throw err;
            res.send(data);
        });
    }
    else
    {
        oldpass = sha1(oldpass);
        connection.query(`SELECT password FROM users WHERE ID=${req.session.userID}`, (err, results)=>{
            if (err) throw err;
            if (oldpass != results[0].password)
            {
                var hiba = "The old password is invalid!";
                ejs.renderFile('public/passmod.ejs', {hiba}, (err, data)=>{
                    if (err) throw err;
                    res.send(data);
                });
            }
            else
            {
                connection.query(`UPDATE users SET password=SHA1('${newpass1}') WHERE ID=${req.session.userID}`, (err)=>{
                    if (err) throw err;
                    var hiba = "The password changed!";
                    ejs.renderFile('public/passmod.ejs', {hiba}, (err, data)=>{
                        if (err) throw err;
                        res.send(data);
                    });
                });
            }
        });
    }
});

// user profil edit
app.get('/profilmod', (req,res)=>{
    if (req.session.loggedIn)
    {
        var profilData = {
            name: req.session.userName,
            email: req.session.userMail,
            reg:req.session.userReg,
            last: req.session.userLast
        }

        ejs.renderFile('public/profilmod.ejs', {hiba:'', profilData}, (err, data)=>{
            if (err) throw err;
            res.send(data);
        });
    }
    else
    {
        res.send('Please login to get this page!');
    }
});

app.post('/profilmod', (req,res)=>{
    var username = req.body.username,
        email = req.body.email;
    
    connection.query(`SELECT * FROM users WHERE email='${email}' AND ID<>${req.session.userID}`, (err, results)=>{
        if (err) throw err;
        if (results.length > 0)
        {
            var profilData = {
                name: req.session.userName,
                email: req.session.userMail,
                reg:req.session.userReg,
                last: req.session.userLast
            }
    
            ejs.renderFile('public/profilmod.ejs', {hiba:'This e-mail address is already registered!', profilData}, (err, data)=>{
                if (err) throw err;
                res.send(data);
            }); 
        }
        else
        {
            connection.query(`UPDATE users SET username='${username}', email='${email}' WHERE ID=${req.session.userID}`, (err)=>{
                if (err) throw err;
                
                req.session.userName = username;
                req.session.userMail = email;

                var profilData = {
                    name: req.session.userName,
                    email: req.session.userMail,
                    reg:req.session.userReg,
                    last: req.session.userLast
                }
        
                ejs.renderFile('public/profilmod.ejs', {hiba:'Profil successfully changed!', profilData}, (err, data)=>{
                    if (err) throw err;
                    res.send(data);
                }); 
            });
        }
    });  
});

// users stepdata management
app.get('/newdata', (req, res)=>{
    if (req.session.loggedIn)
    {
        var aktDate = getAktDate();

        ejs.renderFile('public/newdata.ejs',{eMsg:'', aktDate}, (err, data)=>{
            if (err) throw err;
            res.send(data);
        });
    }
    else
    {
        res.send('This page is only for registered users!');
    }    
});

app.post('/newdata', (req, res)=>{
    if (req.session.loggedIn)
    {
        var data = {
            datum : req.body.datum,
            stepcount : req.body.stepcount
        }
        connection.query(`SELECT * FROM stepdatas WHERE date='${data.datum}' AND userID=${req.session.userID}`, (err, results)=>{
            if (err) throw err;
            if (results.length == 0)
            {
               // insert
               connection.query(`INSERT INTO stepdatas VALUES(null, ${req.session.userID},'${data.datum}',${data.stepcount})`, (err)=>{
                   if (err) throw err;
                   res.redirect('/tableview'); 
               });
            }
            else
            {
                // update
                connection.query(`UPDATE stepdatas SET stepcount = stepcount + ${data.stepcount} WHERE date='${data.datum}' AND userID=${req.session.userID}`, (err)=>{
                    if (err) throw err;
                    res.redirect('/tableview'); 
                });
            }
        });
    }
    else
    {
        res.send('This page is only for registered users!');
    }
});

app.get('/tableview', (req, res)=>{
    if (req.session.loggedIn)
    {
        connection.query(`SELECT * FROM stepdatas WHERE userID=${req.session.userID} ORDER BY date DESC`, (err, results)=>{
            if (err) throw err;
            ejs.renderFile('public/tableview.ejs', {results}, (err, data)=>{
                if (err) throw err;
                res.send(data);
            });
        });
    }
    else
    {
        res.send('This page is only for registered users!');
    } 
});

app.get('/deletestep/:id', (req, res)=>{
    var id = req.params.id;
    connection.query(`DELETE FROM stepdatas WHERE ID=${id}`, (err)=>{
        if (err) throw err;
        res.redirect('/tableview');
    });
});

app.get('/chartview', (req, res)=>{
    if (req.session.loggedIn)
    {
        connection.query(`SELECT date AS x, stepcount as y FROM stepdatas WHERE userID=${req.session.userID} ORDER BY date ASC`, (err, results)=>{
            if (err) throw err;
  
         var str = '';
         results.forEach(element => {
                str += `{ label : "${moment(element.x).format('YYYY-MM-DD')}", y : ${element.y} },`;          
         });
         str = str.substring(0, str.length-1);

         console.log(str);
            ejs.renderFile('public/chartview.ejs', {str}, (err, data)=>{
                if (err) throw err;
                res.send(data);
            });
        });
    }
    else
    {
        res.send('This page is only for registered users!');
    }     
});

// admin user management

// admin statistics

// server listening
app.listen(port, (err)=>{
    if (err) throw err;
    console.log(`Server listening on port ${port}...`);
});


function getTimeStamp() {
    var now = new Date();
    return ( now.getFullYear() + "-" +
            ( (now.getMonth() < 10) ? ("0" + now.getMonth()+1) : (now.getMonth()+1)) + '-' +
              ((now.getDate() < 10) ? ("0" + now.getDate()) : (now.getDate())) + ' ' +
                
              now.getHours() + ':' +
             ((now.getMinutes() < 10)
                 ? ("0" + now.getMinutes())
                 : (now.getMinutes())) + ':' +
             ((now.getSeconds() < 10)
                 ? ("0" + now.getSeconds())
                 : (now.getSeconds())));
}

function getAktDate() {
    var now = new Date();
    return ( now.getFullYear() 
            + "-" +
            ((now.getMonth() < 10) ? ("0" + now.getMonth()+1) : (now.getMonth()+1)) 
            + '-' +
            ((now.getDate() < 10) ? ("0" + now.getDate()) : (now.getDate())
        )
    );
}