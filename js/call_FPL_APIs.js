// Create an array with all the promises 
async function call_all_APIs(league, gameweek, what_to_call = ['static', 'league_details', 'live_data', 'schedule', 'teams_details']){
	// Set up the API's URLs and the final dataset
	const base_url = 'https://fantasy.premierleague.com/api';
	let res = {}

	// Order request by level of dependency - First Static Data (for the gameweek)
	let static;
	if (what_to_call.includes('static') || gameweek == undefined) {
		static = await async_cors_fetch(`${base_url}/bootstrap-static/`);
		gameweek = gameweek ?? static.events.filter(x => x.is_current)[0].id;
		res['static'] = clean_static_data(static);
	}

	// Next league details (for the ids of the entries) + live data + schedules
	let all_promises = [];
	if (what_to_call.includes('league_details')) {
		let page_number = 1;
		while (page_number <= 5) {
			all_promises.push(cors_fetch(`${base_url}/leagues-classic/${league}/standings/?page_standings=${page_number}`));
			page_number++;
		}
	}
	if (what_to_call.includes('live_data')) {
		all_promises.push(cors_fetch(`${base_url}/event/${gameweek}/live/`));
	}
	if (what_to_call.includes('schedule')) {
		all_promises.push(cors_fetch(`${base_url}/fixtures/?event=${gameweek}`));
	}
	let raw_data_1 = await evaluate_promises(all_promises);
	if (what_to_call.includes('league_details') || what_to_call.includes('teams_details')) {
		res['league_details'] = clean_league_data(get_data_by_url(raw_data_1, 'leagues-classic'));
	}
	if (what_to_call.includes('live_data')) {
		res['live_data'] = get_data_by_url(raw_data_1, 'live')[0].elements;
	}
	if (what_to_call.includes('schedule')) {
		res['schedule'] = get_data_by_url(raw_data_1, 'fixtures')[0];
	}

	// Finally get the team by team entry details
	all_promises = [];
	if (what_to_call.includes('teams_details')) {
		let teams = raw_data_1
			.filter(x => x.url.includes('leagues-classic'))
			.map(x => x.data.standings.results)
			.flat()
			.map(x => x.entry)
		for (const t of teams) {
			all_promises.push(cors_fetch(`${base_url}/entry/${t}/event/${gameweek}/picks/`));
		}
	}
	let raw_data_2 = await evaluate_promises(all_promises);
	if (what_to_call.includes('teams_details')) {
		res['teams_details'] = clean_team_details_data(raw_data_2.filter(x => x.url.includes('entry')));
	}
	
	function get_data_by_url(d, u){
		return d.filter(x => x.url.includes(u)).map(x => x.data)
	}

	return res;
};