const axios = require('axios');
require("dotenv").config({ path: "../config.env" });
const cheerio = require("cheerio");
const dbo = require("../db/conn");
const Contest = require("../db/contest");
const Question = require("../db/question");

const TOKEN = process.env.BEARER_TOKEN;
CONTEST_URL = 'https://api-frontend.unacademy.com/api/v1/uplus/subscription/test_series/?goal_uid=KSCGY&limit=500&offset=108&type=0'

async function scrape(url) {
	const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    const ans = [];
    $("li").each((idx, el) => {
    	ans.push($(el).text());
    })
    return ans;
}

var cnt = 0;

async function upload_contest(data) {
	cnt += 1;
	if (cnt == 1) return;
	const d = data.next_session.properties;
	let contest = await Contest.findOne({ u_id: data.uid });
	let created = false;
	if (!contest) {
		contest = await Contest.create({
			u_contest_url: d.permalink,
			test_series: data.permalink,
			u_id: data.uid,
			name: d.title,
			starts_at: new Date(d.start_time),
			duration: d.duration,
			topics: await scrape(`https://unacademy.com/quiz/t/${d.uid}`),
			description: d.instructions,
			raw: JSON.stringify(data)
		});
		created = true;
	}
	console.log(`Contest ${contest._id} (${contest.name}) ${created?'created':'exists'}.`);

	const SOL_URL = `https://unacademy.com/api/v1/uplus/contest/solution/?contest_uid=${data.uid}`;
	const { data: solution } = await axios.get(SOL_URL, { headers: {
		Authorization: `Bearer ${TOKEN}`,
		"Content-Type": "application/json"
	}}).catch(e => console.log(e));

	let questions = solution.questions_data.map(q => ({
		contest_id: contest._id,
		u_id: q.uid,
		content: q.content,
		correctAnswer: q.correctAnswer,
		choices: q.choices.map(c => ({ uid: c.uid, content: c.content })),
		solution_explanation: '',
		solution_video_link: '',
		raw: JSON.stringify(q)
	}));
	
	questions = await Question.create(questions).catch(e => console.log(e));
	console.log(questions);
}

dbo.connectToServer(err => {
	if (err) return console.error(err);

	axios.get(CONTEST_URL).then(async res => {
		const contests = res.data.results.filter(e => e.name.includes("Pratik Nayak"));
		contests.forEach(async c => await upload_contest(c));
	})
	.catch(e => console.log(e));
});