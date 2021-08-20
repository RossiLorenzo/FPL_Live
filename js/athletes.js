// API URLs 
var base_url = 'https://olympics.com/tokyo-2020/'
var all_athletes_url = base_url +'olympic-games/en/results/all-sports/zzje001a.json'
var athlete_details_url = base_url + 'RMA/olympic/data/CAT/BIO/ATH/ath_id.json'

// Mappings
var sports_mapping = {"BK3":"3x3 Basketball","ARC":"Archery","GAR":"Artistic Gymnastics","SWA":"Artistic Swimming","ATH":"Athletics","BDM":"Badminton","BSB":"Baseball/ Softball","BKB":"Basketball","VBV":"Beach Volleyball","BOX":"Boxing","CSL":"Canoe Slalom","CSP":"Canoe Sprint","BMF":"Cycling BMX Freestyle","BMX":"Cycling BMX Racing","MTB":"Cycling Mountain Bike","CRD":"Cycling Road","CTR":"Cycling Track","DIV":"Diving","EQU":"Equestrian","FEN":"Fencing","FBL":"Football","GLF":"Golf","HBL":"Handball","HOC":"Hockey","JUD":"Judo","KTE":"Karate","OWS":"Marathon Swimming","MPN":"Modern Pentathlon","GRY":"Rhythmic Gymnastics","ROW":"Rowing","RUG":"Rugby","SAL":"Sailing","SHO":"Shooting","SKB":"Skateboarding","CLB":"Sport Climbing","SRF":"Surfing","SWM":"Swimming","TTE":"Table Tennis","TKW":"Taekwondo","TEN":"Tennis","GTR":"Trampoline Gymnastics","TRI":"Triathlon","VVO":"Volleyball","WPO":"Water Polo","WLF":"Weightlifting","WRE":"Wrestling"};

// Make the athletes table fiterable
$('#athletes thead tr').clone(true).appendTo('#athletes thead');
$('#athletes thead tr:eq(1) th').each(function(i){
	var title = $(this).text();
	$(this).html('<input type="text" placeholder="Search ' + title + '" />');

	$('input', this).on('keyup change', function(){
		if(athletes_table.column(i).search() !== this.value){
			athletes_table
				.column(i)
				.search(this.value)
				.draw();
		}
	});
});

// Create the athletes table from the all-athletes URL
var athletes_table = $('#athletes').DataTable( {
	ajax: {
		url: all_athletes_url
	},
	columns: [
		{ data: 'name' },
		{ 
			data: 'noc', 
			render: function(data, type, row) { 
				var image = '<img style="vertical-align:middle" src="img/flags/' + data + '.png" ,width=18px, height=12px />'
				var text = '<span>' + data + '</span>'
				return '<div>' + image + '&nbsp' + text + '</div>'
			}
		},
		{ 
			data: 'dis', 
			render: function(data, type, row) { 
				var image = '<img style="vertical-align:middle" src="img/disciplines/' + data + '.png" ,width=18px, height=18px />'
				var text = '<span>' + sports_mapping[data] + '</span>'
				return '<div>' + image + '&nbsp' + text + '</div>'
			} 
		}
	],

	
	order: [[ 0, "asc" ]],
	scrollY: "400px",
	filter: true,
	processing: true,
	paging: false,
	dom: 'lrtip'
} );

// On click of the athletes table generate the extra info
$('#athletes tbody').on('click', 'tr', function () {
	var row_data = athletes_table.row( this ).data();
	// Populate Image and Name
	$("#athlete_img").attr('src', base_url + 'olympic-games/resOG2020-/img/bios/photos/' + row_data['code'] + '.jpg');
	$("#athlete_name").text(row_data['name']);
	$("#athlete_flag").attr('src', base_url + 'olympic-games/resCOMMON/img/flags/' + row_data['noc'] + '.png');
	$.getJSON( athlete_details_url.replace('ath_id', row_data['code']), function( detailed_data ) {
	});
} );