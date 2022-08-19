const axios = require('axios');
require("dotenv").config({ path: "../config.env" });
const cheerio = require("cheerio");
const pretty = require("pretty");
const dbo = require("../db/conn");
const Contest = require("../db/contest");
const Question = require("../db/question");


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
		Authorization: "Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ijg5OWVhZWM2MDIxNjhhZWNmNTM2MzRjM2ExMGRhNTljIn0.eyJ1c2VyX2lkIjo5NzAzMjA3LCJ1aWQiOiJHUEtMVUhFSFVDIiwiZGlkIjoiIiwianRpIjoiMTpYU1BFT1Z4WHVtR05TR2ZVN2J3MHhOZldtWTN2NEkiLCJleHAiOjE2NjI1MzQ4MTksImlhdCI6MTY1OTk0MjgxOSwidHlwIjoxfQ.TQVV2JZPZPMUf0sXuUoaJLj3rXrXxyZ5P4tCv5zW6sxadJ9xKHTSPAwpTMkTWbK6f4wyDwCcc9HwUo4FFBd_hgvPvk8g0_AESX67sXPHLChi2RbM1R3xX166oSUaHT3kosbEwYnx2srKNxDrK2gLF816wVnA5NcsBNJ1uM6l7CRW6TSh69ILxLQm8ZryD6NeHJGNK_Rp1BpLH3TXAwnt_mR-DykFXL3W6oVvuKBcRLEy68uASGOXv1CkAbUa4z6I7MEQ-JgSNTNvQYwOInWTNoB0ngsEWlloV5D8URuwne9eTOfcqkMTz9cFq14N1NmVIpD3wZxgIKt-fe0hd30j6w",
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