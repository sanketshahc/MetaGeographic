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

// #1 Add user to db with whatever data is return from fb
function addUser(userProfile){
    return db.one("insert into users (name,propic,isloggedin,idfb) values ($1, $2, $3, $4) returning id", [userProfile.displayName,userProfile.photos[0].value,true,userProfile.id])
    // named parameters accepting the array index? (they do accept layered objects)
}

// #2 Flip isLoggedin switch when user logs out...

function loggedOut(id){ 
    return db.one("update users set isloggedout = false where id=$1", [id])
}

module.exports = {
    addUser,
    loggedOut
}