const passport = require('passport');
const bcrypt = require('bcrypt');

module.exports = (app, myDatabase) => {

	// Rendering home page
	app.route('/').get((req, res) => {
		res.render(process.cwd() + '/views/index.pug')
	});

	// Function for confirming if user is authenticated
	const ensureAuthenticated = (req, res, next) => {
		if (req.isAuthenticated()) {
			return next();
		} 
		res.redirect('/'); // if not, redirect back home
	};

	// Handling POST request from registration form
	app.route('/register').post((req, res, next) => {
		// Hashing the password
		const hash = bcrypt.hashSync(req.body.password, 12);
		// Looking if the username exists in the database, and handling it accordingly
		myDatabase.findOne({ username: req.body.username }, function(err, user) {
			if (err) {
			  next(err);
			} else if (user) {
			  res.redirect('/');
			} else {
			  myDatabase.insertOne({
				username: req.body.username,
				password: hash
			  }, (err, doc) => {
				if (err) {
				  res.redirect('/');
				} else {
				  next(null, doc.ops[0]);
				}
			  })
			}
		  })
		}, 
		  passport.authenticate('local', { failureRedirect: '/' }), function(req, res) {
		  res.redirect('/chat') // If successful register, redirect to chatroom
	});

	// Handling POST request from local login form
	app.route('/login').post(passport.authenticate('local', { failureRedirect: '/' }), (req, res, next) => {
		res.redirect('/chat') // If authenticated, redirect to chatroom
	});

	// GET request for logging out; Unauthenticates and redirects home
	app.route('/logout').get((req, res) => {
		req.logout();
		res.redirect('/');
	});

	// Rendering the chatroom page
	app.route('/chat').get(ensureAuthenticated, (req, res) => {
		res.render(process.cwd() + '/views/chat.pug')
	});
}