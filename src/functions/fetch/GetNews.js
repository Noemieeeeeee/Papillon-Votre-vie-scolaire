// modules
import axios from 'axios';

// vars
import { app } from '@/main.ts'
import GetToken from '@/functions/login/GetToken.js';

// main function
async function getNews(forceReload) {
    switch(localStorage.loginService) {
        case "pronote":    
			// return pronote news
			return getPronoteNews(forceReload);
		case "ecoledirecte":
            return;
    }
    
}

// pronote : get timetable
function getPronoteNews(forceReload) {
    // gather vars
    const API = app.config.globalProperties.$api;

    // get token
    const token = localStorage.getItem('token');

    // construct url (date is a TEST date)
    let URL = `${API}/news?token=${token}`;

    // check if timetable is cached
    let newsCache = localStorage.getItem('NewsCache');

    if(newsCache != null && !forceReload) {
        // timetable is cached, check if it's up to date
        newsCache = JSON.parse(newsCache);

        let today = new Date();
        let cacheDate = new Date(newsCache.date);

        if(today.toDateString() == cacheDate.toDateString()) {
            // timetable is up to date, return it
            return new Promise((resolve) => {
                resolve(constructPronoteNews(newsCache.news));
            });
        }
    }

    // send request
    return axios.get(URL)
        .then((response) => {
            if(response.data == 'expired') {
                // token expired, get new token
                GetToken();
            }

            // save timetable to localstorage cache with today's date
            let today = new Date();
            let newsCache = {
                date: today,
                news: response.data
            }

            localStorage.setItem('NewsCache', JSON.stringify(newsCache));

            // construct timetable and return it as a promise
            return new Promise((resolve) => {
                resolve(constructPronoteNews(response.data));
            });
        })
        .catch((error) => {
            if(error.response.data == 'expired') {
                // token expired, get new token
                GetToken();
            }

            // error, return error
            return new Promise((reject) => {
                reject(error);
            });
        });
}

// pronote : construct timetable
function constructPronoteNews(news) {
    let newsArray = [];

    // for each news in news
    for(let i = 0; i < news.length; i++) {
        // get news
        let newsItem = news[i];

        // if no title, set it to "Sans titre"
        if(newsItem.title == null) {
            newsItem.title = "Sans titre";
        }

        let newsReturn = {
            title: newsItem.title,
            content: newsItem.content,
            htmlContent: newsItem.html_content[0].texte.V,
            date: newsItem.date,
            dateString: new Date(newsItem.date).toLocaleDateString( 'fr-FR', { weekday: 'long', month: 'long', day: 'numeric' }) + " à " + new Date(newsItem.date).toLocaleTimeString( 'fr-FR', { hour: '2-digit', minute: '2-digit' }),
            category: newsItem.category,
            author: newsItem.author,
            attachments: newsItem.attachments,
            isSurvey: newsItem.survey,
            isRead: newsItem.read,
            isAnonymized: newsItem.anonymous_survey,
        }

        newsArray.push(newsReturn);
    }

    // sort news by date
    newsArray.sort((a, b) => {
        return new Date(b.date) - new Date(a.date);
    });

    return newsArray;
}

// export
export default getNews