const express = require("express");
const questionRoutes = express.Router();
const Question = require("../db/question");

const fields = ['_id', 'contest_id', 'u_id', 'correctAnswer', 'choices'];

function get_filter(query) {
	return fields.reduce((res, key) => {
		if(query[key]) {
			res[key] = query[key];
		}
		return res;
	}, {});
}

// List combat questions
questionRoutes.route("/combat_question").get(async (req, res) => {
	const result = await Question.find(get_filter(req.query));
	res.json(result);
});

// Get combat question
questionRoutes.route("/combat_question/:id").get(async (req, res) => {
	const question = await Question.findOne({ _id: req.params.id });
	res.json(result);
});

module.exports = questionRoutes;
