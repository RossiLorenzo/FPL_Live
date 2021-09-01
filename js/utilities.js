// CORS Utilities
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
async function evaluate_promises(all_promises){
	return await Promise.all(all_promises).then(function (responses) {
		return Promise.all(responses.map(async function (response) {
			return {'url': response.url, 'data': await response.json()};
		}));
	});
}

// Histrogram of an array
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

// Remove element from list
Array.prototype.remove = function() {
    var what, a = arguments, L = a.length, ax;
    while (L && this.length) {
        what = a[--L];
        while ((ax = this.indexOf(what)) !== -1) {
            this.splice(ax, 1);
        }
    }
    return this;
};