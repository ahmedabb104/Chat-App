"use strict";
require('dotenv').config();

const express = require('express');
const app = express();

app.set('view engine', 'pug');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.route('/').get((req, res) => {
	res.render(process.cwd() + '/views/index.pug')
})

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
	console.log("Listening on port " + PORT)
})