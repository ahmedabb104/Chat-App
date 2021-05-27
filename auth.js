const passport = require('passport');
const LocalStrategy = require('passport-local');
const GithubStrategy = require('passport-github').Strategy;
const bcrypt = require('bcrypt');
const ObjectID = require('mongodb').ObjectID;

module.exports = (app, myDatabase) => {
	// Serializing and deserializing the user object
	passport.serializeUser((user, done) => {
		done(null, user._id)
	  });
	  passport.deserializeUser((id, done) => {
		myDatabase.findOne({ _id: new ObjectID(id) }, (err, doc) => { 
		  done(null, doc) 
		});
	  });
	
	  // Local authenticaton strategy, https://www.passportjs.org/packages/passport-local/
	  passport.use(new LocalStrategy(
		function(username, password, done) {
		  myDatabase.findOne({ username: username }, function (err, user) {
			if (err) { return done(err); }
			if (!user) { return done(null, false); }
			if (!bcrypt.compareSync(password, user.password)) { return done(null, false); }
			return done(null, user);
		  })
		}
	  ));

	  // Github OAuth strategy, https://www.passportjs.org/packages/passport-github/
	  passport.use(new GithubStrategy({
		clientID: process.env.GITHUB_CLIENT_ID,
		clientSecret: process.env.GITHUB_CLIENT_SECRET,
		callbackURL: 'https://ahmeds-chat-app.herokuapp.com/auth/github/callback'
	  	},
	  	function (accessToken, refreshToken, profile, cb) {
			myDatabase.findOneAndUpdate(
			{ id: profile.id },
			{
				$setOnInsert: {
				id: profile.id,
				username: profile.username || 'John Doe',
				created_on: new Date(),
				provider: profile.provider || ''
				},
				$set: {
				last_login: new Date(),
				},
				$inc: {
				login_count: 1
				}
			},
			{ upsert: true, new: true },
			(err, doc) => {
				return cb(null, doc.value);
			}
			)
		}
		));
}