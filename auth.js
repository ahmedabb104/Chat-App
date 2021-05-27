const passport = require('passport');
const LocalStrategy = require('passport-local');
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
	
	  // Local authenticaton strategy
	  passport.use(new LocalStrategy(
		function(username, password, done) {
		  myDatabase.findOne({ username: username }, function (err, user) {
			if (err) { return done(err); }
			if (!user) { return done(null, false); }
			if (!bcrypt.compareSync(password, user.password)) { return done(null, false); }
			return done(null, user);
		  })
		}
	  ))
}