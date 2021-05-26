"use strict";
require('dotenv').config();

const routes = require('./routes.js');
const auth = require('./auth.js');
const express = require('express');
const myDB = require('./connection');
const session = require('express-session');
const passport = require('passport');

// Setting up the express app to use pug and the public styles
const app = express();
app.set('view engine', 'pug');
app.use('/public', express.static(process.cwd() + '/public'));

// Other required middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// https://www.npmjs.com/package/express-session
app.use(session({
	secret: process.env.SESSION_SECRET,
	resave: true,
	saveUninitialized: true,
	cookie: { secure: false }
}))
// https://www.npmjs.com/package/passport
app.use(passport.initialize());
app.use(passport.session());


// Connecting to DB once server is started, keeping persistent connection for full lifecycle of app
myDB(async (client) => {
	const myDatabase = await client.db('userDatabase').collection('users');
	routes(app, myDatabase);
	auth(app, myDatabase)

});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
	console.log("Listening on port " + PORT)
})