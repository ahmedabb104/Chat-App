"use strict";
require('dotenv').config();

// Dependencies
const routes = require('./routes.js');
const auth = require('./auth.js');
const express = require('express');
const myDB = require('./connection');
const session = require('express-session');
const passport = require('passport');
const passportSocketIo = require('passport.socketio');
const cookieParser = require('cookie-parser');

// Setting up the express app to use pug and the public styles
const app = express();
app.set('view engine', 'pug');
app.use('/public', express.static(process.cwd() + '/public'));

// Mounting the http server on the express app, https://www.npmjs.com/package/socket.io
const http = require('http').createServer(app);
const io = require('socket.io')(http);

// Initializing a new memory store for the session, https://github.com/jdesboeufs/connect-mongo/tree/v3.x
const MongoStore = require('connect-mongo')(session)
const URI = process.env.MONGO_URI;
const store = new MongoStore({ url: URI });

// Other required middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Handles login sessions, https://www.npmjs.com/package/express-session
app.use(session({
	secret: process.env.SESSION_SECRET,
	key: 'express.sid',
	store: store,
	resave: true,
	saveUninitialized: true,
	cookie: { secure: false }
}))
// https://www.npmjs.com/package/passport
app.use(passport.initialize());
app.use(passport.session());

// Parsing and decoding the cookie that contains the passport session then deserializing it to obtain the user object. https://www.npmjs.com/package/passport.socketio
const onAuthorizeSuccess = (data, accept) => {
	console.log('successful connection to socket.io');
	accept(null, true);
  }
  const onAuthorizeFail = (data, message, error, accept) => {
	if (error) throw new Error(message);
	console.log('failed connection to socket.io:', message);
	accept(null, false)
  }
  io.use(
	passportSocketIo.authorize({
	  cookieParser: cookieParser,
	  key: 'express.sid',
	  secret: process.env.SESSION_SECRET,
	  store: store,
	  success: onAuthorizeSuccess,
	  fail: onAuthorizeFail
	})
  );

// Connecting to DB once server is started, keeping persistent connection for full lifecycle of app
myDB(async (client) => {
	const myDatabase = await client.db('userDatabase').collection('users');

	routes(app, myDatabase);
	auth(app, myDatabase);

	// Listening for connections to the server chat. A socket is an individual client.
	let onlineUsers = 0;
	io.on('connection', socket => {
		console.log(socket.request.user.username + " has entered the chat");
		++onlineUsers;

		// Emitting an event to all connected sockets, giving them name of user connecting/disconnecting, and the number of online users
		io.emit('user', {
			username: socket.request.user.username,
			onlineUsers,
			connected: true
		});
		
		// Listening to all sockets for chat message event
		socket.on('chat message', (message) => {
			// Emitting an event to the sockets with the username and message sent
			io.emit('chat message', {
				username: socket.request.user.username,
				message
			});
		});

		// Listening to all sockets for disconnection
		socket.on('disconnect', () => {
			console.log(socket.request.user.username + "has left the chat");
			--onlineUsers;
			io.emit('user', {
				username: socket.request.user.username,
				onlineUsers,
				connected: false
			});
		});

	});

	// Middleware to handle missing pages
	app.use((req, res, next) => {
		res.status(404).type('text').send('Not Found');
	  });

}).catch(e => {
	app.route('/').get((req, res) => {
		res.render(process.cwd() + '/views/index.pug');
	});
})

// Listener
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
	console.log("Listening on port " + PORT)
})