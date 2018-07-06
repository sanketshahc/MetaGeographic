// nodemon command not found! wtf?\
// how would i handle different cases of authentication/database
// app.get('/', function(req, res) {
//     res.sendFile(path.join(__dirname + '/index.html'));
//   });

///////////////////

const dotenv = require('dotenv');
dotenv.config();
const fs = require('fs');
const path = require('path');
const certOptions = {
    key: fs.readFileSync('server.key'),
    cert: fs.readFileSync('server.crt')
}

const express = require('express')
const app = express()
const https = require('https').createServer(certOptions, app, console.log('up'))
const socketIO = require('socket.io')(https);
https.listen(443);

const parse = require('body-parser');
const expressHBS = require('express-handlebars');
const static = require('express').static;
const users = require('./db');
const setupAuth = require('./auth');
const ensureAuthenticated = require('./auth').ensureAuthenticated;

app.use(static('public'));
app.use(parse.urlencoded({ extended: false }));
app.engine('.hbs', expressHBS({defaultLayout: 'layout', extname: '.hbs'}));
app.set('view engine', '.hbs');

setupAuth(app);


//### eventually export routes from a routes.js file

app.get('/signup', (req,res,next)=>{
    res.render('signup');
})

app.use(ensureAuthenticated, (req,res,next)=>{
        next() 
    })

app.get('/', (req,res,next)=>{
    // console.log('USER:'+req.user)
    let idfb = req.user;
    // res.send('user home')
    users.checkUser(idfb)
        .then((user)=>{
            res.render('home',{
                name: user.name,
                propic: user.propic
            });
         })
         .catch(console.log)
})

app.post('/main', (req,res,next)=>{
    let idfb = req.user;
    console.log('status',req.body.status)
    let status = req.body.status;
    users.changeStatus(idfb, status)
        .then(res.redirect('/main'))
        .catch(console.log)
})  
    

app.get('/main', (req,res,next)=>{
    users.allLoggedin()
        .then(element=>{res.send(element)})
    // res.send('main page')
    // send mainpage and a list of all logged in users.
})

app.get('/*',(req,res,next)=>{
    res.redirect('/')
})



// app.listen(8000,()=>{
//     console.log('server up')
// })

//###

