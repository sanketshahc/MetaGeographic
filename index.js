///////////////////

const dotenv = require('dotenv');
dotenv.config();
const fs = require('fs');
// const path = require('path');
const certOptions = {
    key: fs.readFileSync('server.key'),
    cert: fs.readFileSync('server.crt')
}

const express = require('express')
const app = express()
const https = require('https').createServer(certOptions, app, console.log('up'))
const socketIO = require('socket.io')(https);

const parse = require('body-parser');
const expressHBS = require('express-handlebars');
const static = express.static;
const users = require('./db');
const setupAuth = require('./auth');
const ensureAuthenticated = require('./auth').ensureAuthenticated;
const sharedSession = require('./auth').sharedSession;
const logtime = require('log-timestamp');

app.use(static('public'));
app.use(parse.urlencoded({ extended: false }));
app.engine('.hbs', expressHBS({defaultLayout: 'layout', extname: '.hbs'}));
app.set('view engine', '.hbs');

setupAuth(app);

socketIO.on("connection", (socket)=> {
    // console.log('check it',socket);
    // console.log('check the handshake stuff \n#1 cookies\n',socket.handshake.cookies, '\n#2 socket conn/client id\n',"'"+socket.client.id+"'", '\n#3 sessionID:\n',"'"+socket.handshake.sessionID+"'");
    console.log('#2 socket conn/client id\n',"'"+socket.client.id+"'");
    console.log('#4 all sockets',Object.keys(socketIO.sockets.sockets));
    // Accept a login event with user's data
    // socket.on("login", (userdata) => {
    //     socket.handshake.session.userdata = userdata;
    //     socket.handshake.session.save();
    // });
    // socket.on("logout", (userdata)=> {
    //     if (socket.handshake.session.userdata) {
    //         delete socket.handshake.session.userdata;
    //         socket.handshake.session.save();
    //     }
    // });        
});


https.listen(443);

//### eventually export routes from a routes.js file

app.get('/signup', (req,res,next)=>{
    res.render('signup');
    })

let reqFbid;

app.use(
    ensureAuthenticated, 
    (req,res,next)=>{
        console.log('reqUserSesh:', req.sessionID, 'reqFbid:', req.user);
        reqUserSesh = req.sessionID;
        reqFbid = req.user;
        next()
    }
);

socketIO.use(sharedSession);
socketIO.use((socket,next)=>{
    socket.handshake.user=reqFbid;
    console.log('Did it work?', socket.handshake.user);
    next()
})

    // emit event with user data? then listen with socketio
app.get('/', (req,res,next)=>{
    let idfb = req.user;
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
    })

app.get('/*',(req,res,next)=>{
    res.redirect('/')
    })

//###