// modules
import axios from 'axios';

// vars
import { app } from '@/main.ts'
import GetToken from '@/functions/login/GetToken.js';

// main function
function getPunishments(forceReload) {
	switch(localStorage.loginService) {
        case "pronote":    
			// return pronote punishements
			return getPronotePunishments(forceReload);
		case "ecoledirecte":
            return;
    }
}

async function getPronotePunishments(forceReload) {
	// gather vars
	const API = app.config.globalProperties.$api;

	// get token
	const token = localStorage.getItem('token');

	// construct url
	let URL = `${API}/punishments?token=${token}`;

	let cache = localStorage.getItem('PunishmentsCache');
	if (cache != null && !forceReload) {
		let punishments = JSON.parse(cache).punishments;

		return new Promise((resolve) => {
			resolve(constructPronotePunishments(punishments));
		});
	}
	else {
		return axios.get(URL)
		.then((response) => {
			let punishments = response.data;

			punishments = constructPronotePunishments(punishments);
			
			let today = new Date();
			let cacheElement = {
				date: today,
				punishments: response.data
			};
			localStorage.setItem('PunishmentsCache', JSON.stringify(cacheElement));

			return punishments;
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

// pronote : construct punishments
function constructPronotePunishments(punishments) {
	let punish = []

	punishments.forEach((punishment) => {
		let newPunishment = {
			data: {
				id: punishment.id,
				reasons: punishment.reason,
				nature: punishment.nature,
				givenBy: punishment.giver
			},
			date: {
				givenDate: new Date(punishment.date),
				schedules: punishment.schedule,
				duration: punishment.duration
			},
			homeworks: punishment.homework,
			status: {
				isSchedulable: punishment.schedulable,
				isExclusion: punishment.exclusion,
				isDuringLesson: punishment.durring_lesson,
			}
		}
		
		punish.push(newPunishment)
	})

	punish.sort((a, b) => {
		return b.date.givenDate - a.date.givenDate;
	})

	return punish
}

export default getPunishments;