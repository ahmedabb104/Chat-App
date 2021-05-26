const express = require('express');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const bcrypt = require('bcrypt');

module.exports = (app, myDatabase) => {

	// Rendering home page
	app.route('/').get((req, res) => {
		res.render(process.cwd() + '/views/index.pug')
	});

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
		  res.redirect('/chat') // If successful register, go to chat
	})
}