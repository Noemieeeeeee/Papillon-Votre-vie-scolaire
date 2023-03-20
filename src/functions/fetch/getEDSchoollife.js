// modules
import axios from 'axios';

// vars
import { app } from '@/main.ts'
import GetToken from '@/functions/login/GetToken.js';


//main function

async function getEDSchoollife(forceReload) {
	// gather vars
	const EDAPI = "https://api.ecoledirecte.com/v3"//app.config.globalProperties.$api;

    // get token
    const token = localStorage.getItem('token');

    const userID = JSON.parse(localStorage.UserCache).id;

    // construct url
    let URL = `${EDAPI}/eleves/${userID}/viescolaire.awp?verbe=get`;

	let schoollife = {};
	let cache = localStorage.getItem('EDSchoollifeCache');
	if (cache != null && !forceReload) {
		schoollife = JSON.parse(cache).edschoollife;

		return new Promise((resolve) => {
			resolve(constructEDSchoollife(schoollife));
		});
	}
	else {

        var requestOptions = {
            headers: { "Content-Type": "application/x-www-form-urlencoded", "X-Token": token },            
        };
        let body = `data={}`

		return axios.post(URL, body, requestOptions)
		.then((response) => {
            if (response.data.data.code) {
                if (response.data.data.code == 525) {
                    // get new token
                    GetToken();
                }
                else {
                    return new Promise((reject) => {
                        reject({
                            error: response.data.data.code
                        });
                    });
                }
            }



			schoollife = response.data.data;
			schoollife = constructEDSchoollife(schoollife);
			
            let today = new Date();
			let cacheElement = {
				date: today,
				edschoollife: response.data.data
			};
			localStorage.setItem('EDSchoollifeCache', JSON.stringify(cacheElement));

			return schoollife;
		})
		.catch((error) => {
			if (error.response) {
                if (error.response.data.code == 525) {
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
function constructEDSchoollife(schoollife) {
    console.log(schoollife)
	let schlife = {
        "absences": [],
        "delays": [],
        "punishments": [],
        "encouragements": [],
    }
    console.log(schoollife)
	schoollife.absencesRetards.forEach((absDelays) => {
		let newabsDelays = {
			data: {
				id: absDelays.id,
				isJustified: absDelays.justifie,
				justification: absDelays.motif,
				reasons: absDelays.commentaire,
			},
			date: {
				date: new Date(absDelays.date),
				duration: absDelays.libelle,
			}
		}
        console.log(newabsDelays)
        if(absDelays.typeElement == "Absence") schlife.absences.push(newabsDelays)

        if(absDelays.typeElement == "Retard") schlife.delays.push(newabsDelays)

	})



    schoollife.sanctionsEncouragements.forEach((sctEncour) => {

        if(sctEncour.typeElement == "Punition") {
            let newPunishment = {
                data: {
                    id: sctEncour.id,
                    reasons: { text: sctEncour.commentaire },
                    nature: sctEncour.libelle,
                    givenBy: sctEncour.par
                },
                date: {
                    givenDate: new Date(sctEncour.date),
                    schedules: sctEncour.schedule,
                    duration: sctEncour.duration
                },
                homeworks: sctEncour.aFaire,
                status: {
                    isSchedulable: sctEncour.schedulable,
                    isExclusion: sctEncour.exclusion,
                    isDuringLesson: sctEncour.durring_lesson,
                }
            }
            schlife.punishments.push(newPunishment)
        }

        if(sctEncour.typeElement == "Encouragement") {
            let newsctEncour = {
                data: {
                    id: sctEncour.id,
                    isJustified: sctEncour.justifie,
                    justification: sctEncour.motif,
                    reasons: sctEncour.commentaire,
                },
                date: {
                    date: new Date(sctEncour.date),
                    duration: null// delay.duration,
                }
            }
            
            schlife.encouragements.push(newsctEncour)
        }

	})




	schlife.absences.sort((a, b) => {
		return b.date.from - a.date.from;
	})
    schlife.delays.sort((a, b) => {
		return b.date.from - a.date.from;
	})
    schlife.punishments.sort((a, b) => {
		return b.date.from - a.date.from;
	})
    schlife.encouragements.sort((a, b) => {
		return b.date.from - a.date.from;
	})

	return schlife
}

export default getEDSchoollife;