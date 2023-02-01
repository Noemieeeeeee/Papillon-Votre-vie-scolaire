// modules
import axios from 'axios';

// vars
import { app } from '@/main.ts'
import GetToken from '@/functions/login/GetToken.js';

import subjectColor from '@/functions/utils/subjectColor.js'

let dayRequest;

// main function
async function getTimetable(date, forceReload) {
    // as only pronote is supported for now, we can just return the pronote timetable
    
    // return pronote timetable
    return getPronoteTimetable(date, forceReload);
}

// pronote : get timetable
function getPronoteTimetable(date, forceReload) {
    // gather vars
    const API = app.config.globalProperties.$api;
    dayRequest = new Date(date);

    // get token
    const token = localStorage.getItem('token');

    // get date as YYYY-MM-DD
    const dayString = dayRequest.toISOString().split('T')[0];

    // construct url (date is a TEST date)
    let URL = `${API}/timetable?dateString=${dayString}&token=${token}`;

    // check if timetable is cached
    let cacheSearch = JSON.parse(localStorage.getItem('TimetableCache')) || [];
    cacheSearch = cacheSearch.filter((element) => {
        return element.date == dayString && element.token == token;
    });
    if (cacheSearch.length > 0 && !forceReload) {
        // return cached timetable in promise
        return new Promise((resolve, reject) => {
            let timetable = JSON.parse(cacheSearch[0].timetable);
            resolve(constructPronoteTimetable(timetable, dayRequest));
        });
    }
    else {
        // get timetable from API
        return axios.get(URL)
        .then((response) => {
            // get timetable
            let timetable = response.data;

            // construct timetable
            timetable = constructPronoteTimetable(timetable, dayRequest);

            // cache response
            let cache = JSON.parse(localStorage.getItem('TimetableCache')) || [];
            let cacheElement = {
                date: dayString,
                token: token,
                timetable: JSON.stringify(response.data)
            };
            cache.push(cacheElement);
            localStorage.setItem('TimetableCache', JSON.stringify(cache));

            // return timetable
            return timetable;
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
                // return empty timetable in promise
                return new Promise((resolve, reject) => {
                    resolve({
                        error: error.code
                    });
                });
            }
        });
    }
}

// pronote : construct timetable
function constructPronoteTimetable(timetable, date) {
    // declaring vars
    let courses = [];

    // for each course in timetable
    timetable.forEach((course) => {
        // construct course
        let newCourse = {
            course: {
                id: course.id,
                color: subjectColor.getSubjectColor(course.subject.name, course.background_color),
                num: course.num,
                sameTime: false,
                actual: false,
                distance: false,
                lengthCours: 0,
            },
            data: {
                subject: course.subject.name,
                teachers: course.teachers,
                rooms: course.rooms,
                groupNames: course.group_names,
                memo: course.memo,
                hasMemo: false,
                linkVirtual: course.virtual,
            },
            time: {
                start: new Date(course.start),
                end: new Date(course.end)
            },
            status: {
                isCancelled: course.is_cancelled,
                isExempted: course.is_exempted,
                isDetention: course.is_detention,
                isOuting: course.is_outing,
                isTest: course.is_test,
                isCustom: false,
                status: course.status
            }
        };

        if (course.subject.name != "") {
            subjectColor.setSubjectColor(newCourse.data.subject, newCourse.course.color, true);
        }        

        if (course.memo != null) {
            newCourse.data.hasMemo = true;
        }

        if (course.is_detention) {
            newCourse.data.subject = "🚨 Retenue";
            newCourse.course.color = "#ff0000";
            newCourse.status.status = "Vous êtes placé en retenue";
        }

        if (course.is_exempted) {
            newCourse.course.color = "#627E66";
            newCourse.status.status = "Vous êtes dispensé de cours";
        }

        // push course to courses
        courses.push(newCourse);
    });

    // put courses in start order
    courses.sort((a, b) => {
        return new Date(a.time.start) - new Date(b.time.start);
    });

    // return courses
    return courses;
}

// export
export default getPronoteTimetable;