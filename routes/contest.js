const express = require("express");
const contestRoutes = express.Router();
const Contest = require("../db/contest");

// List contests
contestRoutes.route("/contest").get(async (req, res) => {
	const contest = await Contest.find({});
	res.json(contest);
});

// Get contest
contestRoutes.route("/contest/:id").get(async (req, res) => {
	const contest = await Contest.findOne({ _id: req.params.id });
	res.json(contest);
});

module.exports = contestRoutes;
