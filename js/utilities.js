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