const dbo = require("../db/conn");
const axios = require('axios');
require("dotenv").config({ path: "../config.env" });
const TOKEN = process.env.BEARER_TOKEN;

const Contest = require("../db/contest");
const Question = require("../db/question");

// Example: /test-series/upsc-cse-prelims-test-series-2024/D1MT6LRO, insert the last 8 digit ID.
const TEST_SERIES = ["RLMAQZ0M"];

const headers = { headers: {
	Authorization: `Bearer ${TOKEN}`,
	"Content-Type": "application/json"
}};

function get_topics(d) {
	const ans = [];
	d.forEach(e => {
		e.concepts.forEach(t => ans.push(t));
	});
	return ans;
}

async function get_contest(id, index) {
	const [{data: session}, {data: d}] = await Promise.all([
		axios.post(`https://unacademy.com/api/v3/quizzes/quiz/${id}/enroll/`, {language: 1}, headers).catch(e => console.log(e)),
		axios.get(`https://unacademy.com/api/v3/quizzes/quiz/${id}/details/`, headers).catch(e => console.log(e))
	]);
	const session_id = session.uid;
	
	await axios.post(`https://unacademy.com/api/v1/quizzes/session/${session_id}/finish_quiz/`, {}, headers).catch(e=>console.log(e));

	const { data } = await axios.get(`https://api-frontend.unacademy.com/api/v2/quizzes/session/${session_id}/get_questions_paginated_with_attempts/?limit=100&offset=0`, headers).catch(e => console.log(e));

	while (data.next) {
		const {data: more} = await axios.get(data.next, headers).catch(e => console.log(e));
		data.next = more.next;
		data.results.push(...more.results);
	}
	console.assert(data.count === data.results.length, `count mismatch (${index}): ${data.count}, ${data.results.length}\nhttps://api-frontend.unacademy.com/api/v2/quizzes/session/${session_id}/get_questions_paginated_with_attempts/?limit=100&offset=0`);
	console.assert(data.next === null, "missing questions");

	const contest = {
		u_contest_url: d.permalink,
		// TODO: needs change
		test_series: "Science & Tech",
		u_id: d.uid,
		// TODO: needs change
		name: d.title,
		starts_at: new Date(d.start_time),
		duration: d.duration/60,
		topics: get_topics(d.syllabus),
		description: d.instructions,
		raw: JSON.stringify(d)
	}

	const solutions = data.results.map(q => ({
		contest_id: null,
		u_id: q.uid,
		content: q.content["1"],
		correctAnswer: q.correct_answers_list[0],
		choices: q.answers.map(c => ({ uid: c.uid, content: c.content["1"] })),
		solution_explanation: q.solution_explanation["1"],
		solution_video_link: '',
		raw: JSON.stringify(q)
	}));

	return {
		contest,
		solutions
	};
}

async function upload_contest(c) {
	const contest = await Contest.create(c.contest).catch(e=>console.log(e));
	console.log(contest._id, contest.name);
	const questions = await Question.create(c.solutions.map(s => ({...s, contest_id: contest._id}))).catch(e=>console.log(e));
	console.log(questions.map(q => `id_${q._id}__contest_id_${q.contest_id}`));
}


dbo.connectToServer(async err => {
	if (err) return console.error(err);


	await Promise.all(TEST_SERIES.map(async tid => {
		let { data: contest_ids } = await axios.get(`https://unacademy.com/api/v2/collection/${tid}/items/?limit=600`);
		contest_ids = contest_ids.results.filter(c => !c.value.time_remaining);
		contest_ids = contest_ids.map(c => c.value.uid);

		const contests = await Promise.all(contest_ids.map(get_contest));
		// contests.forEach(c => {
		// 	console.log(c.contest);
		// 	console.log("-----");
		// 	c.solutions.forEach(q => console.log(q));
		// })
		await Promise.all(contests.map(upload_contest));
	}));
	console.log("\n\nDone!!!\n\n");
});

