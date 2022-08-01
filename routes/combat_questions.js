const express = require("express");
const questionRoutes = express.Router();
const dbo = require("../db/conn");
const ObjectId = require("mongodb").ObjectId;

const fields = ['_id', 'contest_id', 'u_id', 'correctAnswer', 'choices'];
const exclude_raw = { projection: {raw: 0} };

function get_filter(query) {
	let filter = {};
	fields.forEach(key => {
		if(query[key]) {
			filter[key] = (key == '_id' || key == 'contest_id') 
			? ObjectId(query[key]) : query[key];
		}
	});
	return filter;
}

// List combat questions
questionRoutes.route("/combat_question").get((req, res) => {
	const db = dbo.getDb();
	const filter = get_filter(req.query);

	db.collection("combat_questions").find(filter, exclude_raw).limit(500000).toArray((err, result) => {
		if (err) throw err;
		else res.json(result);
	});
});

// Get combat question
questionRoutes.route("/combat_question/:id").get((req, res) => {
	const db = dbo.getDb();
	db.collection("combat_questions").findOne({ _id: ObjectId(req.params.id) }, exclude_raw, (err, result) => {
		if (err) throw err;
		else res.json(result);
	});
});

module.exports = questionRoutes;