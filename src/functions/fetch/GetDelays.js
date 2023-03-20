// modules
import axios from 'axios';

// vars
import { app } from '@/main.ts'
import GetToken from '@/functions/login/GetToken.js';

// main function
function getDelays(forceReload) {
	switch(localStorage.loginService) {
        case "pronote":    
            // return pronote delays
			return getPronoteDelays(forceReload);
		case "ecoledirecte":
            return;
    }
    
}

async function getPronoteDelays(forceReload) {
	// gather vars
	const API = app.config.globalProperties.$api;

	// get token
	const token = localStorage.getItem('token');

	// construct url
	let URL = `${API}/delays?token=${token}`;

	let delays = {};
	let cache = localStorage.getItem('DelaysCache');
	if (cache != null && !forceReload) {
		delays = JSON.parse(cache).delays;

		return new Promise((resolve) => {
			resolve(constructPronoteDelays(delays));
		});
	}
	else {
		return axios.get(URL)
		.then((response) => {
			delays = response.data;
			delays = constructPronoteDelays(delays);
			
            let today = new Date();
			let cacheElement = {
				date: today,
				delays: response.data
			};
			localStorage.setItem('DelaysCache', JSON.stringify(cacheElement));

			return delays;
		})
		.catch((error) => {
			if (error.response) {
				// check if "notfound" or "expired"
				if (error.response.data == "notfound") {
					// get new token
					GetToken();
				}
				else if (error.response.data == "expired") {
					// get new token
					GetToken();
				}
			}

			if(error.code) {
				return new Promise((reject) => {
					reject({
						error: error.code
					});
				});
			}
		});
	}
}

// pronote : construct delays
function constructPronoteDelays(delays) {
	let dly = []

	delays.forEach((delay) => {
		let newDelay = {
			data: {
				id: delay.id,
				isJustified: delay.justified,
				justification: delay.justification,
				reasons: delay.reasons,
			},
			date: {
				date: new Date(delay.date),
				duration: delay.duration,
			}
		}
		
		dly.push(newDelay)
	})

	dly.sort((a, b) => {
		return b.date.from - a.date.from;
	})

	return dly
}

export default getDelays;