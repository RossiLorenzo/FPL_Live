// Clean data from the static API
function clean_static_data(data){
	let players = {};
	for (const p of data.elements) { 
		players[p.id] = {
			name: p.web_name, code: p.code, 
			points: p.event_points, minutes: parseInt(p.minutes),
			team: p.team
		}
	}
	let teams = {};
	for (const p of data.teams) { 
		teams[p.id] = p;
	}
	return {
		players: players,
		gameweeks: data.events,
		teams: teams
	}
}

// Function to upload the live score for any user
function update_live_points(standings, picks, live, gameweek, subset = false){
	for (var i = standings.length - 1; i >= 0; i--) {
		if (gameweek.finished) {
			standings[i]['live_points'] = standings[i]['event_total'];
		}
		else{
			standings[i]['live_points'] = picks[standings[i].entry]
				.filter(x => x.position <= 11)
				.map(x => live.filter(y => y.id == x.element)
				.map(y => y.stats.total_points * x.multiplier))
				.flat()
				.reduce((x,y) => x+y)
		}
	}
	standings.sort(function(a, b){return (b.total-b.event_total+b.live_points) - (a.total-a.event_total+a.live_points)});
	return standings;
}

// Clean data from the league_details API, returning standings and 
function clean_league_data(data){
	return {
		league: data[0].league,
		standings: data.map(x => x.standings.results).flat()
	}
}

// Clean data from the league_details API, returning standings and 
function clean_team_details_data(data){
	let data_clean = {};
	for (let el of data) {
		data_clean[el.url.match('entry/([0-9]*)')[1]] = el.data;	
	}
	return data_clean;
}

// Create picks data
function create_picks(data){
	let picks = {};
	if ("picks" in data[Object.keys(data)[0]]) {
		for (const [key, value] of Object.entries(data)) {
			picks[key] = value.picks;
		}
	}
	return picks;
}

// Create picks data
function create_captains(data){
	return array_histogram(Object.values(data).map(y => y.filter(z => z.is_captain).map(z => z.element)).flat());
}

// Create picks data
function create_ownership(data){
	return array_histogram(Object.values(data).map(y => y.map(z => z.element)).flat());
}

// Add opponents 
function add_opponents(data, schedule){
	var all_players = data.players;
	var all_players_keys = Object.keys(all_players)
	for (var i = all_players_keys.length - 1; i > 0; i--) {
		var pl_team = all_players[i].team;
		var find_opponent = data.teams[
			schedule.filter(x => x.team_h == pl_team)
			.concat(schedule.filter(x => x.team_a == pl_team))
			.map(x => [x.team_a, x.team_h].remove(pl_team)[0])[0]
		];
		all_players[i].opp_team = '';
		all_players[i].opp_team_link = 'img/no-entry.png';
		if (find_opponent != undefined) {
			all_players[i].opp_team = find_opponent.code;
			all_players[i].opp_team_link = 'https://resources.premierleague.com/premierleague/badges/70/t' + find_opponent.code + '.png'
		}
		
	}
	return all_players;
}

