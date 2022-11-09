const express = require("express");
const contestRoutes = express.Router();
const Contest = require("../db/contest");

// List contests
contestRoutes.route("/contest").get(async (req, res) => {
	const test_series = req.query.test_series || '';
	const contest = await Contest.find({test_series});
	res.json(contest);
});

// Get contest
contestRoutes.route("/contest/:id").get(async (req, res) => {
	const contest = await Contest.findOne({ _id: req.params.id });
	res.json(contest);
});

// Get Test Series
contestRoutes.route("/test_series").get(async (req, res) => {
	const ts = await Contest.distinct('test_series');
	const cnt = await Promise.all(ts.map(t => Contest.find({test_series: t}).count()));
	res.json(ts.map((t, idx) => ({name: t, count: cnt[idx]})));
});

module.exports = contestRoutes;
