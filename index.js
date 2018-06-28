// nodemon command not found! wtf?\
// what is the id string returned from fb? is that just a session id or something to store on db
//   if we're writing that to the db, then id on table prob shouldn't be serialized.
// or just have 2 fields...
// getting warning on host for db.js
// db not working


const dotenv = require('dotenv');
dotenv.config();
const app = require('express')();
const users = require('./db');
const expressHBS = require('express-handlebars');
const static = require('express').static;
const parse = require('body-parser');
const setupAuth = require('./auth');
const ensureAuthenticated = require('./auth').ensureAuthenticated;
// convenience method to use later as a double check on paths

app.use(static('public'));
app.use(parse.urlencoded({ extended: false }));
// why not use .json method?
// why not just use the express.json object?
app.engine('.hbs', expressHBS({defaultLayout: 'layout', extname: '.hbs'}));
app.set('view engine', '.hbs');

setupAuth(app);

//### eventually export routes from a routes.js file

app.listen(8000,()=>{
    console.log('server up')
})

//###

