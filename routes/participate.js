const express = require("express");
const Contest = require("../db/contest");
const Attempt = require("../db/attempt");
const Options = require("../db/options");
const Question = require("../db/question");
const { logged_user } = require("../utils");

const routes = express.Router();

async function refresh_attempt(attempt) {
	if (attempt.total_n && attempt.correct_n + attempt.incorrect_n + attempt.unmarked_n === attempt.total_n) {
		return attempt;
	}
	let [total_n, correct_n, incorrect_n, unmarked_n] = [0, 0, 0, 0];
	const [ops, qs] = await Promise.all([
		Options.find({ attempt_id: attempt._id }),
		Question.find({ contest_id: attempt.contest_id })
	]);
	const mp = ops.reduce((res, e) => {
		res.set(String(e.question_id), e.selected_answer);
		return res;
	}, new Map());

	// console.log(mp);

	qs.forEach(q => {
		const marked = (mp.get(String(q._id)) || []).join('');
		const correct_ans = q.correctAnswer.join('');
		if (!marked) unmarked_n += 1;
		else if (marked === correct_ans) correct_n += 1;
		else incorrect_n += 1;
		total_n += 1;
	});
	await attempt.updateOne({total_n, correct_n, incorrect_n, unmarked_n});
	return await Attempt.findOne({_id: attempt._id});
}
 

routes.route("/attempt").post(async function (req, res) {
  const [user, contest] = await Promise.all([
  	logged_user(req),
  	Contest.findOne({ _id: req.body.contest })
  ]);
  if (!user || !contest) return res.status(user?400:403).json({reason: "unauthorized", message: "User not logged in or invalid contest ID."})
  
  const now = new Date();
  const ends_at = new Date(now.getTime() + contest.duration * 60000);

  const attempt = await Attempt.findOneOrCreate({
  	contest_id: req.body.contest, 
  	user_id: user._id, 
  	ends_at: { $gte: now }
  }, { starts_at: now, ends_at });

  return res.status(201).json(attempt);
});

routes.route("/attempt/end").post(async function(req, res) {
	let [user, attempt] = await Promise.all([
		logged_user(),
		Attempt.findOne({_id: req.body.id})
	]);
	if (!user || !attempt || !user.equals(attempt.user_id)) {
		return res.status(403).json({reason: "unauthorized"});
	}
	const now = new Date();
	if (attempt.ends_at > now) {
		attempt.ends_at = now;
		attempt = await attempt.save();
		attempt = await refresh_attempt(attempt);
	}
	return res.status(200).json(attempt);
})

routes.route("/attempt").get(async function(req, res) {
	const user = await logged_user();
	if (!user) return res.status(401).json({reason: "unauthorized", message: ""})
	const { contest: contest_id, limit } = req.query;
	const filter = contest_id ? { contest_id } : {};
	const attempts = await Attempt.find({user_id: user._id, ...filter}).limit(limit || 50);
	return res.status(200).json(attempts);
});

routes.route("/attempt/:id").get(async function(req, res) {
	let [attempt, user] = await Promise.all([
		Attempt.findOne({ _id: req.params.id }),
		logged_user(req)
	]);
	if (!user) return res.status(401).json({reason: "unauthorized", message: ""})
	
	if (attempt && user.equals(attempt.user_id)) {
		// update the attempt with number of correct answers etc
		if (attempt.ends_at < new Date()) {
			attempt = await refresh_attempt(attempt);
		}
		return res.status(200).json(attempt);
	}
	return res.status(404).json({reason: "Not Found"});
});

// ------- Options ------

routes.route("/options").post(async function(req, res) {
	const {
		attempt: attempt_id,
		question: question_id,
		answer: selected_answer
	} = req.body;
	if (!attempt_id || !question_id) return res.status(400).json({});

	const [user, attempt, question] = await Promise.all([
		logged_user(),
		Attempt.findOne({_id: attempt_id}),
		Question.findOne({_id: question_id})
	]);
	if (!user || !attempt || !user.equals(attempt.user_id)) {
		return res.status(401).json({reason: "unauthorized"});
	}

	if(!question || !attempt.contest_id.equals(question.contest_id)) {
		return res.status(400).json({reason: "Question does not belong to this contest!"});
	}

	if (selected_answer.length) {
		if (!question.choices.some(e => e.uid === selected_answer[0])) {
			return res.status(400).json({reason: "Selected option is incorrect!"});
		}
	}
	if (attempt.ends_at <= new Date()) {
		return res.status(400).json({reason: "Virtual Contest has ended!"});
	}
	const op = await Options.createOrUpdate({ attempt_id, question_id }, { selected_answer });
	return res.status(200).json(op);
});

// LIST options for a session
routes.route("/options").get(async function(req, res) {
	const filter = {};
	if (req.query.attempt) filter['attempt_id'] = req.query.attempt;
	if (req.query.question) filter['question_id'] = req.query.question;
	const ops = await Options.find(filter);
	return res.status(200).json(ops);
});

routes.route("/options/:id").get(async function(req, res) {
	const op = await Options.findOne({_id: req.params.id});
	return res.status(200).json(op);
});


module.exports = routes;
