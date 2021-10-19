# StepCounter
Lépésszámláló webalkalmazás
----------------------------

adatbázis: 214_SZFT_stepcounter
táblák: users(ID, username, email, password, reg, last, rights, status)
        stepdata(ID, userID, date, stepcount)

user functions:
    user registration
    user login / logout
    user password change
    user profildata change
    user stepcount manage
    user statistic (table, graph)

admin functions:
    user management
    statistics (table, graph)
    dashboard???

moduls:
nodeJS
express
express-session
ejs
mysql
path
nodemon
moment
