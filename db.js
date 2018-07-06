// #0 set up pgp
const pgp = require('pg-promise')();
const interfaceID = {
    host: 'localhost',
    port: 5432,
    database: 'MetaGeographic',
    user: 'sanketshah',
    password: ''
}
const db = pgp(interfaceID);


function allLoggedin(){
    return db.any("select * from users where isloggedin = true")
}

// #1 Add user to db with whatever data is return from fb
function addUser(userProfile){
    return db.one("insert into users (name,propic,isloggedin,idfb) values ($1, $2, $3, $4) returning id", [userProfile.displayName,userProfile.photos[0].value,true,userProfile.id])
    // named parameters accepting the array index? (they do accept layered objects)
}

// #2 Flip isLoggedin switch when user logs out...

function loggedOut(id){ 
    return db.one("update users set isloggedout = false where id=$1", [id])
}

function checkUser(id){
    return db.oneOrNone("select * from users where idfb = $1", [id])
}

function changeStatus(id, status){
    return db.result("update users set status = '$1#' where idfb=$2",[status,id] )
}

module.exports = {
    addUser,
    loggedOut,
    checkUser,
    changeStatus,
    allLoggedin
}
