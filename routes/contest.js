const express = require("express");
const contestRoutes = express.Router();
const Contest = require("../db/contest");
const Attempt = require("../db/attempt");
const Question = require("../db/question");

// List contests
contestRoutes.route("/contest").get(async (req, res) => {
	const test_series = req.query.test_series || '';
	let contests = await Contest.find({test_series}).lean();
	// find contests which are being attempted
	let c_ids = await Attempt.find({contest_id: contests.map(e=>e._id), ends_at: {'$gte': new Date()}}).distinct('contest_id');
	c_ids = c_ids.map(e => String(e));
	contests = contests.map(c => {
		const running = c_ids.indexOf(String(c._id)) !== -1;
		if (running) c.running = true;
		return c;
	})
	res.json(contests);
});

// Get contest
contestRoutes.route("/contest/:id").get(async (req, res) => {
	const [contest, q_n] = await Promise.all([
		Contest.findOne({ _id: req.params.id }).lean(),
		Question.find({contest_id: req.params.id}).count()
	]);
	contest.q_n = q_n;
	res.json(contest);
});

// Get Test Series
contestRoutes.route("/test_series").get(async (req, res) => {
	const ts = await Contest.distinct('test_series');
	const cnt = await Promise.all(ts.map(t => Contest.find({test_series: t}).count()));
	res.json(ts.map((t, idx) => ({name: t, count: cnt[idx]})));
});

module.exports = contestRoutes;
