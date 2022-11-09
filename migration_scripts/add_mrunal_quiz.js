const dbo = require("../db/conn");
const axios = require('axios');
require("dotenv").config({ path: "../config.env" });
const TOKEN = process.env.BEARER_TOKEN;

const Contest = require("../db/contest");
const Question = require("../db/question");

// const CONTEST_LIST = ["ORPIDB7J12", "IRVC3XHCYH", "VVRINRIBTF", "DHRZ1RKS9K", "YG3SNV2YR6", "XZ5CVVL8S4", "ID079X8Y31", "YD660X5YLF", "P2ZGCSOCSZ", "59QHYZRHK8", "1BYD1RAW3T", "GROPY928MM", "203OT3FNAT", "LL0JY7U62E", "T10FOL1H4M", "2AWVFBZO6V"];
const CONTEST_LIST = ["6P0HALFP97", "TANVW9IS8G", "8HX6897D3R"];
const headers = { headers: {
	Authorization: `Bearer ${TOKEN}`,
	"Content-Type": "application/json"
}};


async function get_contest(id, index) {
	const { data: d } = await axios.get(`https://unacademy.com/api/v3/quizzes/quiz/${id}/details/`, headers).catch(e => console.log(e));
	const { data: session_data } = await axios.get(`https://unacademy.com/api/v1/quizzes/quiz/${id}/my_attempts/`, headers).catch(e => console.log(e));
	const session_id = session_data.latest_session.uid;
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
		test_series: "Pathway to crack UPSC Prelims 2023",
		u_id: d.uid,
		name: d.title,
		starts_at: new Date(d.start_time),
		duration: d.duration/60,
		topics: [d.title.split("by")[0].trim()],
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
	
	const contests = await Promise.all(CONTEST_LIST.map(get_contest));
	// contests.forEach(c => {
	// 	console.log(c.contest);
	// 	console.log("\n-----\n");
	// 	c.solutions.forEach(q => console.log(q));
	// })
	await Promise.all(contests.map(upload_contest));
	console.log("\n\nDone!!!\n\n");
});

