// Global Variables
var url_parameters = window.location.search;
var league_id = ((url_parameters.match('league=([0-9]*)') == null) ? '504155' : url_parameters.match('league=([0-9]*)')[1]);

// Utilities
async function async_cors_fetch(url){
	let cors_url = 'https://vast-forest-31073.herokuapp.com/' + url
	let response = await fetch(cors_url);
	let data = await response.json();
	return data;
}
function cors_fetch(url){
	let cors_url = 'https://vast-forest-31073.herokuapp.com/' + url
	let response = fetch(cors_url);
	return response;
}
function array_histogram (array) {
	let c = {}, arr = [...array], prev;
	arr.sort();
	for (let element of arr) {
		if (element !== prev) c[element] = 1;
    	else c[element]++;
    	prev = element;
  	}
	return c;
}
function update_live_points(standings, picks, live){
	for (var i = standings.length - 1; i >= 0; i--) {
		let entry = standings[i].entry;
		standings[i]['live_points'] = picks[entry]
			.filter(x => x.position <= 11)
			.map(x => live.filter(y => y.id == x.element)
			.map(y => y.stats.total_points * x.multiplier))
			.flat()
			.reduce((x,y) => x+y)
	}
	standings.sort(function(a, b){return (b.total-b.event_total+b.live_points) - (a.total-a.event_total+a.live_points)});
	return standings;
}
function DT_initialize(id, params, else_fun) { 
	if ( ! $.fn.DataTable.isDataTable(id) ) {
	  $(id).dataTable(params);
	  return true;
	}
	return false;
}

// Pull Static Data
async function static_details(){
	let data = await async_cors_fetch('https://fantasy.premierleague.com/api/bootstrap-static/');
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

// Pull Fixtures
async function schedule(gameweek){
	let data = await async_cors_fetch(`https://fantasy.premierleague.com/api/fixtures/?event=${gameweek}`);
	return data;
}

// Pull Live Data
async function live_data(gameweek){
	let data = await async_cors_fetch(`https://fantasy.premierleague.com/api/event/${gameweek}/live/`);
	return data.elements;
}

// Pull League Data 
async function league_details(league_id){
	let page_number = 1;
	let next_page = true;
	let standings = [];
	let page;
	while (next_page && page_number < 5) {
		page = await async_cors_fetch(`https://fantasy.premierleague.com/api/leagues-classic/${league_id}/standings/?page_standings=${page_number}`);
		standings.push(page.standings.results);
		next_page = page.standings.has_next;
		page_number = page_number + 1;
	};
	return {
		league: page.league,
		standings: standings.flat()
	};
};

// Pull Team Details
async function team_details(team_ids, gameweek){
	let teams_data_promises = [];
	for (const t of team_ids) { 
		teams_data_promises.push(cors_fetch(`https://fantasy.premierleague.com/api/entry/${t.entry}/event/${gameweek}/picks/`));
	}
	let data = await Promise.all(teams_data_promises).then(function (responses) {
		return Promise.all(responses.map(function (response) {
			return response.json();
		}));
	});
	let data_clean = {};
	for (let i = 0; i < team_ids.length; i++) {
		data_clean[team_ids[i].entry] = data[i]	
	}
	return data_clean;
}

async function generate_page(){
	var app = Vue.createApp({
		data() { 
			return { 
				to_load: true,
				title: 'Loading', 
				gameweek: 1,
				selected_id: 1, 
				runs: 0 
			} 
		},
		async created() { 

			let static_data = await static_details();
			let gameweek = static_data.gameweeks.filter(x => x.is_current)[0].id;
			gameweek = ((url_parameters.match('gameweek=([0-9]{1,2})') == null) ? gameweek : url_parameters.match('gameweek=([0-9]*)')[1]);
			let league_data = await league_details(league_id);
			let teams_data = await team_details(league_data.standings, gameweek);
			let schedule_data = await schedule(gameweek);
			let live = await live_data(gameweek);

			let picks = {}
			if ("picks" in teams_data[Object.keys(teams_data)[0]]) {
				for (const [key, value] of Object.entries(teams_data)) {
					picks[key] = value.picks;
				}
			}

			let captains_agg = {}
			if (!("detail" in teams_data[Object.keys(teams_data)[0]])) {
				captains_agg = array_histogram(Object.keys(teams_data).map(x => teams_data[x].picks.filter(x => x.is_captain)[0].element));	
			}

			let ownership_agg = {}
			if ("picks" in teams_data[Object.keys(teams_data)[0]]) {
				ownership_agg = array_histogram(Object.values(picks).map(y => y.map(z => z.element)).flat())
			}

			league_data.standings = update_live_points(league_data.standings, picks, live);

			this.to_load = false;
			this.gameweek = gameweek;
			this.title = league_data.league.name;
			this.standings = league_data.standings;
			this.team_details = teams_data;
			this.static_data = static_data;
			this.captains_agg = captains_agg;
			this.ownership_agg = ownership_agg;
			this.schedule = schedule_data;
			this.selected_id = league_data.standings[0].entry;
			this.lineup = picks[league_data.standings[0].entry];
			this.picks = picks;
			this.live = live;

			setInterval(async () => {
				this.schedule = await schedule(gameweek);
				this.live = await live_data(gameweek);
				let updated_standings = update_live_points(this.standings, this.picks, live);
				this.standings = updated_standings;
				$('#standings').DataTable().order( [[ 3, 'desc' ]] ).draw( false );
			}, 60000)
		},
		async updated() { 
			console.log('updating')
			let to_init = DT_initialize('#standings', {
				'pageLength': 15,
				'dom': 'tp',
				'order': [[ 3, "desc" ]],
				"columnDefs": [ 
					{ "orderable": false, "targets": [0] }
				]
			});
			if (!to_init) {
				$('#standings').DataTable().order( [[ 3, 'desc' ]] ).draw( false );
			}
			DT_initialize('#captains', {
				'pageLength': 5,
				'dom': 'tp',
				'order': [[ 1, "desc" ]],
				"columnDefs": [
					{ "width": "50%", "targets": 0 }
				]	
			});
			DT_initialize('#ownership', {
				'pageLength': 5,
				'dom': 'tp',
				'order': [[ 1, "desc" ]],
				"columnDefs": [
		    		{ "width": "50%", "targets": 0 }
		  		]	
			});
			DT_initialize('#team_tbl', {
				'pageLength': 11,
				'dom': 'tp',
				"bSort" : false,
				"columnDefs": [
		    		{ "width": "50%", "targets": 0 }
		  		],
				"language": {
					"paginate": {
						"previous": "Starting 11",
						"next": "Bench"
					}
		  		}
			});
		},
		methods: { 
			select_row: function (id) {
				this.runs = this.runs+1;
				this.selected_id = id;
				this.lineup = this.picks[id];
			}
		}
	});
	await app.mount('#vue_app');

};

generate_page()