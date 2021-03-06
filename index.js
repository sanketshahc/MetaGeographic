///////////////////
require('log-timestamp');
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
const static = express.static;

const https = require('https').createServer(certOptions, app, console.log('up'))
const socketIO = require('socket.io')(https);
const parse = require('body-parser');
const expressHBS = require('express-handlebars');
const users = require('./db');
const setupAuth = require('./auth');
const ensureAuthenticated = require('./auth').ensureAuthenticated;
const sharedSession = require('./auth').sharedSession;

app.use(static('public'));
app.use(parse.urlencoded({ extended: false }));
app.engine('.hbs', expressHBS({defaultLayout: 'layout', extname: '.hbs'}));
app.set('view engine', '.hbs');

setupAuth(app);
https.listen(443);

//### eventually export routes from a routes.js file

app.get('/signup', (req,res,next)=>{
    res.render('signup', 
        {
            layout: "layout-signup"
        }
);
    })

var reqFbid;

app.use(
    ensureAuthenticated, 
    (req,res,next)=>{ 
        console.log('express middleware\nreqUserSesh:', req.sessionID, '\n reqFbid:', req.user);
        // reqUserSesh = req.sessionID;
        reqFbid = req.user;
        next()
    }
);

socketIO.use(sharedSession);

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
    // users.allLoggedin()
    //     .then(element=>{res.send(element)})
    res.render(
        'video', {
            layout: "layout-video"
        }
    )
    })

app.get('/*',(req,res,next)=>{
    res.redirect('/')
    })

//###

// get all sockets with the io.sockets.sockets
// and specific socket by io.sockets.sockets['targetSocketID']

// getting all rooms returns the socket's synonymous room, so not useful
//     console.log('arrAllRooms\n', socketIO.sockets.adapter.rooms)

//arrAllRooms 
//{ '8_djclj2r1aQx8xLAAAC':
//     Room {sockets: 
//             {'8_djclj2r1aQx8xLAAAC': true,
//              'xxxxxx': true
//             }, 
//           length: 1 
//          } 
//}
//###
const nsp = socketIO.of('/main')
var arrWrtcRoomNames = [];

nsp.use((socket,next)=>{
    socket.handshake.user=reqFbid;
    console.dir('### Did it work?',socket.handshake.user)
    // console.log('Did it work?', socket.handshake.user); 
    next()
})
// callback should be generic to follow 'connection', 'next', and 'disconnect' events
nsp.on("connection", (socket)=> {
    // console.log('check the handshake stuff \n#1 cookies\n',socket.handshake.cookies, '\n#2 socket conn/client id\n',"'"+socket.client.id+"'", '\n#3 sessionID:\n',"'"+socket.handshake.sessionID+"'");
    console.log('#1 a new socket connected')
    console.log('#2 socket conn/client id\n',"'"+socket.client.id+"'");
    // console.log('#3 rooms with socket:', socket.rooms )
    // console.log('#4 all rooms:', socketIO.sockets.adapter.rooms)
    // console.log('#5 all socket-id\'s',Object.keys(socketIO.sockets.sockets));
    console.log('#6 Did it really work?', socket.handshake.user)

    function log() {
        console.dir(Object.values(arguments));
        var array = ['Message from server:'];
        array.push.apply(array, arguments);
        socket.emit('log', array);
      }

    socket.on('message', (message, curr) => {
        log('Client said: ', message);
        log('curr ', curr)
        // must evaluate room everytime, rather than pass name from function to function.
        // if must pass name, then nest this function inside the join/create listener.
        let currentRoomName = curr
        socket.to(currentRoomName).emit('message', message);
    });
    
    socket.on('create or join', ()=>{
        socket.emit('create or join');
        log('Received request to create or join room ');

        // socket.id necessary to send to client? prob no
        const joinRoomToFill = (name) => {
            log('Client ID ' + socket.id + ' joined room to fill ' + name);
            nsp.in(name).emit('join', name);
            socket.join(name);
            socket.emit('joined', name, socket.id);
            // socketIO.sockets.in(room).emit('ready');
        }
    
        const joinRoomToWait = (name) => {
            socket.join(name);
            log('Client ID ' + socket.id + ' joined room to wait ' + name);
            socket.emit('created', name, socket.id);
        }
        const createRoomToWait = () => {
            let newName = nameRoom();
            socket.join(newName);
            log('Client ID ' + socket.id + ' created room to wait ' + newName);
            arrWrtcRoomNames.push(newName);
            socket.emit('created', newName, socket.id);
            return newName
        }
         // a helper function to generate room names
        const nameRoom = () => {
            let suffix = (arrWrtcRoomNames.length + 1).toString();
            let prefix = 'room';
            return roomName = prefix + suffix; 
        };
        const findRoom = () => {
            log('roomArry',arrWrtcRoomNames);
            var openRoom = 
                arrWrtcRoomNames.find(
                    (name)=>{
                        console.log('nsp.adapter.rooms[name]:', nsp.adapter.rooms[name])
                        var clientsInRoom = nsp.adapter.rooms[name];
                        var numClients = clientsInRoom ? Object.keys(clientsInRoom.sockets).length : 0;
                        log(' number of clients= '+ numClients)
                        if (numClients === 1) {
                            log(' room ' + name + ' has ' + numClients)
                            joinRoomToFill(name);
                            return name
                        } else if (numClients === 0){
                            log(' room ' + name + ' has ' + numClients)
                            joinRoomToWait(name);
                            return name
                        }
                    }
            )
            if (!openRoom) {
                let newRoom = createRoomToWait();
                openRoom = newRoom;
                log('no available rooms, creating room ' + openRoom)
                }
            room = openRoom;
            log('the room assignment is: ' + room)
            log('#4 all rooms:', nsp.adapter.rooms)
            log('new arrWrtcRoomNames =', arrWrtcRoomNames)
        }
        findRoom();
    })
    
});


// on disconnect, the socket left in the room should advance to next available...
nsp.on('disconnect', ()=>{})
