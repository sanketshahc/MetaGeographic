// nodemon command not found! wtf?\
// how would i handle different cases of authentication/database


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

app.get('/signup', (req,res,next)=>{
    res.render('signup');
})

app.get('/', ensureAuthenticated, (req,res,next)=>{
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

app.listen(8000,()=>{
    console.log('server up')
})

//###

