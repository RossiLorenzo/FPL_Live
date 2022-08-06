// Global Variables
var url_parameters = window.location.search;
var league_id = ((url_parameters.match('league=([0-9]*)') == null) ? '686236' : url_parameters.match('league=([0-9]*)')[1]);

function DT_initialize(id, params, else_fun) { 
	if ( ! $.fn.DataTable.isDataTable(id) ) {
		$(id).dataTable(params);
	}
	else {
		$(id).DataTable().clear().destroy();
		$(id).dataTable(params);
	}
}

var app = Vue.createApp({
	data() { 
		return { 
			to_load: true,
			static_data: {},
			gameweek: {},
			standings: [],
			team_details: {},
			captains_agg: {},
			ownership_agg: {},
			picks: {},
			live: {},
			title: 'Loading',
			selected_id: 1, 
			runs: 0,
		} 
	},
	async created() { 
		let all_data = await call_all_APIs(league_id);
		console.log(all_data);

		// Static and large uploads 
		this.to_load = false;
		this.static_data = all_data.static;
		this.gameweek = this.static_data.gameweeks.filter(x => x.is_current)[0];
		this.title = all_data.league_details.league.name;

		// Calculated fields
		this.team_details = all_data.teams_details;
		this.picks = create_picks(this.team_details);
		this.captains_agg = create_captains(this.picks);
		this.ownership_agg = create_ownership(this.picks);

		// Live data
		this.schedule = all_data.schedule;
		this.live = all_data.live_data;

		// Clean Players
		this.exp_players = add_opponents(all_data.static, all_data.schedule);
		
		// Update the standings with the most recent scores
		this.standings = update_live_points(all_data.league_details.standings, this.picks, this.live, this.gameweek);
		
		// Selected team
		this.selected_id = this.standings[0].entry;
		this.lineup = this.picks[this.selected_id];

		// Reload the data every minute
		setInterval(async () => {
			let all_data = await call_all_APIs(league_id, this.gameweek.id, ['live_data', 'schedule']);
			// Refresh live data and standings
			this.schedule = all_data.schedule;
			this.live = all_data.live_data;
			this.standings = update_live_points(this.standings, this.picks, this.live, this.gameweek, true);
		}, 60000)
		
	},
	methods: { 
		select_row: function (id) {
			this.runs = this.runs+1;
			this.selected_id = id;
			this.lineup = this.picks[id];
		}
	},
	// Update Live Data with new values
	watch: {
		standings(val) {
			$('#standings').DataTable().destroy();
			this.$nextTick(() => {	
				$('#standings').DataTable(
					{
						'pageLength': 15,
						'dom': 'tp',
						'order': [[ 3, "desc" ]],
						"columnDefs": [ 
							{ "orderable": false, "targets": [0] }
						]
					}
				);
			});
		},
		captains_agg(val) {
			$('#captains').DataTable().destroy();
			this.$nextTick(() => {	
				$('#captains').DataTable(
					{
						'pageLength': 5,
						'dom': 'tp',
						'order': [[ 1, "desc" ]],
						"columnDefs": [
							{ "width": "50%", "targets": 0 }
						]
					}
				);
			});
		},
		ownership_agg(val) {
			$('#ownership').DataTable().destroy();
			this.$nextTick(() => {	
				$('#ownership').DataTable(
					{
						'pageLength': 5,
						'dom': 'tp',
						'order': [[ 1, "desc" ]],
						"columnDefs": [
							{ "width": "50%", "targets": 0 }
						]
					}
				);
			});
		},
		live(val) {
			$('#team_tbl').DataTable().destroy();
			this.$nextTick(() => {	
				$('#team_tbl').DataTable(
					{
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
					}
				);
			});
		}
	}
})

app.mount('#vue_app');
