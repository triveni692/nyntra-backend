const dbo = require("../db/conn");
const axios = require('axios');
require("dotenv").config({ path: "../config.env" });
const TOKEN = process.env.BEARER_TOKEN;

const headers = { headers: {
	Authorization: `Bearer ${TOKEN}`,
	"Content-Type": "application/json"
}};

const Contest = require("../db/contest");
const Question = require("../db/question");

const MAX_LIMIT=20; // maximum number of contests to fetch

async function get_all_contests() {
	const uri = `https://unacademy.com/api/v1/uplus/contest/all/?goal_uid=KSCGY&preference=E0X317EU&state=0&limit=${MAX_LIMIT}&offset=0&state=1`;
	let contests = (await axios.get(uri)).data.results;

	contests = contests.map(d => ({
		u_contest_url: `https://unacademy.com/goal/a/KSCGY/combat/b/${d.quiz_details.uid}/solution`,
		test_series: "Combats",
		u_id: d.uid,
		name: d.name,
		starts_at: new Date(d.starts_at),
		duration: d.quiz_details.duration,
		topics: d.topic_groups.map(e=>e.name),
		description: d.instructions,
		// raw: JSON.stringify(d)
	}));

	// console.log(contests[0]);

	async function count(idx) {
		// console.log(idx, contests.length);
		return await Contest.count({"u_id": contests[idx].u_id});
	}


	let l = 0, r = contests.length - 1, m = 0;
	while(r - l > 1) {
		m = Math.floor((l + r) / 2);
		if (await count(m)) r = m;
		else l = m; 
	}
	if (!await count(r)) m = r + 1;
	else if (!await count(l)) m = l + 1;
	else m = 0;
	return contests.slice(0, m);
}

async function upload_combat(cts) {
	const uri = `https://unacademy.com/api/v1/uplus/contest/solution/?contest_uid=${cts.u_id}`;
	let qs = (await axios.get(uri, headers)).data;
	qs = qs.questions_data;
	qs = qs.map(q => ({
		contest_id: null,
		u_id: q["uid"],
		content: q["content"],
		correctAnswer: q["correctAnswer"],
		choices: q["choices"].map(e => {
			return { uid: e["uid"], content: e["content"] };
		}),
		solution_explanation: (q["solution"]["solution_explanation"] || ""),
		solution_video_link: (q["solution"]["videoLink"] || ""),
		raw: JSON.stringify(q)
	}));
	// console.log(questions);
	const contest = await Contest.create(cts).catch(e=>console.log(e));
	console.log(contest._id, contest.name);
	const questions = await Question.create(qs.map(s => ({...s, contest_id: contest._id}))).catch(e=>console.log(e));
	console.log(questions.map(q => `id_${q._id}__contest_id_${q.contest_id}`));
}


dbo.connectToServer(async err => {
	if (err) return console.error(err);

	const contests = await get_all_contests();
	// console.log(contests);
	console.log(contests.map(c => [c.name, c.starts_at]));

	// await Promise.all(contests.map(upload_combat));

	console.log("Done!!");
});



