const express = require("express");
const contestRoutes = express.Router();
const dbo = require("../db/conn");
const ObjectId = require("mongodb").ObjectId;

const exclude_raw = { projection: {raw: 0} };

// List contests
contestRoutes.route("/contest").get((req, res) => {
	const db = dbo.getDb();
	db.collection("contests").find({}, exclude_raw).toArray((err, result) => {
		if (err) throw err;
		else res.json(result);
	});
});

// Get contest
contestRoutes.route("/contest/:id").get((req, res) => {
	const db = dbo.getDb();
	const filter = { _id: ObjectId(req.params.id) };
	db.collection("contests").findOne(filter, exclude_raw, (err, result) => {
		if (err) throw err;
		else res.json(result);
	});
});

module.exports = contestRoutes;