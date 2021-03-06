'use strict';

var isChannelReady = false;
var isInitiator = false;
var isStarted = false;
var localStream;
var pc;
var remoteStream;
var turnReady;

var pcConfig = {
  'iceServers': [{
    'urls': 'stun:stun.l.google.com:19302'
  }]
};

// Set up audio and video regardless of what devices are present.
var sdpConstraints = {
  offerToReceiveAudio: true,
  offerToReceiveVideo: true
};

// socket in to server

var socket = io('https://sanketshah.local:443/main')

socket.on('connect',()=>{
    console.log(socket.id+'  starting attempt to create or join room')
    socket.emit('create or join');
})
// console.log(socket.id+'  starting attempt to create or join room');

socket.on('create or join', ()=>{
    navigator.mediaDevices.getUserMedia({
        audio: false,
        video: true
    })
        .then(gotStream)
        .catch(function(e) {
            alert('getUserMedia() error: ' + e.name);
        });
})


    // no room assigned now

    // assuming client can also listen for 'connect,'
    // which would happen when client thinks it's connected? 
    // then the client would emit a ...?
    // io.on('connect', ()=>{

    // })

    // if room doesn't not exist, then msg 'create or join room' 'foo' etc
    // condition may need to be modified.
    // if (room !== '') {
    //     socket.emit('create or join', room);
    //     console.log('Attempted to create or  join room', room);
    //   }                                                                        
    
// // what we need here is an event listener for the push of 'go'
// document.querySelector("form").addEventListener("submit",()=>{
//     socket.emit('create or join');
//     console.log('Attempted to create or  join room');
//     } 
// )
// room full message...prob not necessary now

//  socket.on('full', (room) => {
//     console.log('Room ' + room + ' is full');
//   });

// listen for event "created", which i assume is a server side event,
// and then set a set client who created it as initiator
let curr;
socket.on('created', (room) => {
    console.log('Created room ' + room);
    isInitiator = true;
    curr = room;
}); 

// join event callback
socket.on('join', (room) =>{
    console.log('Another peer made a request to join room ' + room);
    console.log('This peer is the initiator of room ' + room + '!');
    isChannelReady = true;
    curr = room;
});

// joined event callback
socket.on('joined', (room) => {
    console.log('joined: ' + room);
    isChannelReady = true;
    curr = room;
    // console.log('did curr? ', curr)
});

// log event from server, to add server console.logs to the client.
socket.on('log', (array) => {
    console.log.apply(console, array);
});

/*/////////////////////////////////
    Code below is written by Google Inc, as a tutorial for WebRTC.
    Copyright 2016 Google Inc.
    Licensed under the Apache License, Version 2.0 (the "License");

    Comments are my own
*////////////////////////////////

// send message helper function. it emits an event which 
// i'm assuming is listenable from both the client and the server
// that has the event name 'message' and the argument message. (message string content)
// the server in thise case forwards to all other users.
function sendMessage(message) {
    console.log('Client sending message: ', message);
    console.log('curr', curr)
    socket.emit('message', message, curr);
  }
  
  // listend for different message-received types. if the client receives the message 
  // "got user media", 
  // (which i assum means that local mediastream 
  // has been received by browser. is sent when gotStream function is called, 
  // which is as soon as the local media stream is gotten.)
socket.on('message', function(message) {
    console.log('Client received message:', message);
    if (message === 'got user media') {
        maybeStart();
// or if user has received an offer type message (to answer with his media and seshdesc),
// on either of these conditions start a RTC peer connection. 
// Obviously, if the client is not an initiator, 
// a call is not made from within the maybeStart function.
// then, if it is an offer type message, and we are not the initiator, then instantiate a 
// session description with the message received, likely some special 'offer' format msg.
// then send an answer. 
// the offer and answer are both serialized 'session description protocols'
// so IOW the a decription of the remote session, which sent the offer, 
// is provided via instantiating an RTCSeshDesc with the serialized offer message received. 
    } else if (message.type === 'offer') {
    if (!isInitiator && !isStarted) {
        maybeStart();
    }
    pc.setRemoteDescription(new RTCSessionDescription(message));
    doAnswer();
// Note that above, a condition is 'if not isStarted'. this is because isStarted is only flipped true when 
// user has already started the streaming the stream. Which at that point, only the non-initiator has done
// and checks if the message received is of an 'answer' type, which is 
// nearly the same thing, but for "initiating" side, which sent the offer.
    } else if (message.type === 'answer' && isStarted) {
    pc.setRemoteDescription(new RTCSessionDescription(message));
// the ice candidate, which is a set of network conditions, i believe is generated by the RTCpeerconnection. 
// RTCpC as a event handler triggered by a new possible candidate for networkinterface, then the handler function
// here below is triggered by a 'candidate' type message, which an on ice event for the receiving peer. here the remote peer has already 'initiated'.
    } else if (message.type === 'candidate' && isStarted) {
    var candidate = new RTCIceCandidate({
        sdpMLineIndex: message.label,
        candidate: message.candidate
    });
    pc.addIceCandidate(candidate);
// handling the hangup.
    } else if (message === 'bye' && isStarted) {
        handleRemoteHangup();
    }
});
  
  ////////////////////////////////////////////////////
  
  // select and tee-up DOM elements to manipulate
var localVideo = document.querySelector('#localVideo');
var remoteVideo = document.querySelector('#remoteVideo');

// get local video/audio then handles it with the got stream function below
// navigator.mediaDevices.getUserMedia({
//     audio: false,
//     video: true
// })
// .then(gotStream)
// .catch(function(e) {
//     alert('getUserMedia() error: ' + e.name);
// });
  
  // take the mediastream obj from getusermedia and set it to 
  // localStream var, also set the localVideo dom source to this stream object
  // then, with the helper funcion defined above, emit a 'got user media' message, 
  // which is listened to at the top
  // if the user is an initiator, start up a peer connection!
function gotStream(stream) {
    console.log('Adding local stream.');
    localStream = stream;
    localVideo.srcObject = stream;
    sendMessage('got user media');
    if (isInitiator) {
        maybeStart();
    }
}
  
  // constraints on raw media coming in from the webcam. right now, just set to true for video
  // not actually sure what the purpose of this var is because getUserMedia, 
  // already has literal contraints as argument. 
  // seems like just used in logging.
var constraints = {
    video: true
};
console.log('Getting user media with constraints', constraints);

  // requesting turn server if server is not localhost. 
// if (location.hostname !== 'localhost') {
//     requestTurn(
//         'https://computeengineondemand.appspot.com/turn?username=41784574&key=4080218913'
//     );
// }
  
  // when function is called, log some variables and assuming 
  // some basic checks, like, is everyone here?, create a peer
  // connection. this just creats a connection object 
  // with different event properties defined below
  
function maybeStart() {
    console.log('>>>>>>> maybeStart() ', isStarted, localStream, isChannelReady);
    if (!isStarted && typeof localStream !== 'undefined' && isChannelReady) {
        // add room != '' to conditions
        console.log('>>>>>> creating peer connection');
        createPeerConnection();
    // ((addstream (depracated) needs to be upgraded to addtrack. 
    // as well as onaddstream event,used elsewhere here, shuold be ontrack event.))
    // but addstream adds the local media stream as the stream to stream over the rtcpc. This triggers an
    // onaddstream event for the remotepeer
    // then if the user is an initiator, do a call function. (offer creation). if user is not 
    // initiator they still have created a connection with mediastream.
        pc.addStream(localStream);
        isStarted = true;
        console.log('isInitiator', isInitiator);
        if (isInitiator) {
            doCall();
        }
    }
}
  
// event listener on window object,not sure what that is, but logs a good bye message. 
window.onbeforeunload = function() {
    sendMessage('bye');
};
    
  // rtcpc object should ave servers info as an arugment...not sure what's happening. 
  // after instating the rtcpc, then define a bunch of listener to handler relationships.
  // and catch errors (try/catch). Note that the rtcpc obj variable is a GLOBAL var, 
  // as is the remote and local steram obj, instantiated at the top
  
function createPeerConnection() {
    try {
      pc = new RTCPeerConnection(null);
      pc.onicecandidate = handleIceCandidate;
      pc.onaddstream = handleRemoteStreamAdded;
      pc.onremovestream = handleRemoteStreamRemoved;
      console.log('Created RTCPeerConnnection');
    } catch (e) {
      console.log('Failed to create PeerConnection, exception: ' + e.message);
      alert('Cannot create RTCPeerConnection object.');
      return;
    }
  }
  
  // when a new network interface 'candidate' is availeble to the rtcpc, it triggers this handler, 
  // which checks the  'candidate' info, then check for the info, then sendMessage (see above). 
  // Note that the onicecandiate event is distinct from, and actually triggers, the 'candidate' type message. 
  // and the handler functino sends this 'candidate' to server which then forwards to other users.
function handleIceCandidate(event) {
    console.log('icecandidate event: ', event);
    if (event.candidate) {
    sendMessage({
        type: 'candidate',
        label: event.candidate.sdpMLineIndex,
        id: event.candidate.sdpMid,
        candidate: event.candidate.candidate
    });
    } else {
    console.log('End of candidates.');
    }
}
  
// error handling
function handleCreateOfferError(event) {
    console.log('createOffer() error: ', event);
}

// offer up the data to remote peer !
function doCall() {
    console.log('Sending offer to peer');
    pc.createOffer(setLocalAndSendMessage, handleCreateOfferError);
}
  
  // create answer method outputs a stringified 'session description protocol' which then 
  // is set as the local description and send this same sdp as a message, presumable of the
  // type, 'answer', which is listened for at the top. this message is relayed by server to other user
  // catch errors
function doAnswer() {
    console.log('Sending answer to peer.');
    pc.createAnswer().then(
        setLocalAndSendMessage,
        onCreateSessionDescriptionError
    );
}
  
  // helper function for above
function setLocalAndSendMessage(sessionDescription) {
    pc.setLocalDescription(sessionDescription);
    console.log('setLocalAndSendMessage sending message', sessionDescription);
    sendMessage(sessionDescription);
}
  // error handling
function onCreateSessionDescriptionError(error) {
    trace('Failed to create session description: ' + error.toString());
}
  
  // turn server setup formula
// function requestTurn(turnURL) {
//     var turnExists = false;
//     for (var i in pcConfig.iceServers) {
//         if (pcConfig.iceServers[i].urls.substr(0, 5) === 'turn:') {
//             turnExists = true;
//             turnReady = true;
//             break;
//         }
//     }
//     if (!turnExists) {
//         console.log('Getting TURN server from ', turnURL);
//         // No TURN server. Get one from computeengineondemand.appspot.com:
//         var xhr = new XMLHttpRequest();
//         xhr.onreadystatechange = function() {
//             if (xhr.readyState === 4 && xhr.status === 200) {
//             var turnServer = JSON.parse(xhr.responseText);
//             console.log('Got TURN server: ', turnServer);
//             pcConfig.iceServers.push({
//                 'urls': 'turn:' + turnServer.username + '@' + turnServer.turn,
//                 'credential': turnServer.password
//             });
//             turnReady = true;
//             }
//         };
//         xhr.open('GET', turnURL, true);
//         xhr.send();
//     }
// }
  
  // on stream added event, which happens when remote user pushes his stream up. then set that stream to the
  // remote stream dom
function handleRemoteStreamAdded(event) {
    console.log('Remote stream added.');
    remoteStream = event.stream;
    remoteVideo.srcObject = remoteStream;
}
  
  // Tying up loose ends.
  
function handleRemoteStreamRemoved(event) {
    console.log('Remote stream removed. Event: ', event);
}
  
function hangup() {
    console.log('Hanging up.');
    stop();
    sendMessage('bye');
}
  
function handleRemoteHangup() {
    console.log('Session terminated.');
    stop();
    isInitiator = false;
}
  
function stop() {
    isStarted = false;
    pc.close();
    pc = null;
}    
  