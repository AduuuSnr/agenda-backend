/*

Usage: await notify({messages: {"en": " merabalar aq"}, headings: {"en": "hackten boy"}, userId: 1})

*/

const onesignal = require("onesignal-node");
const query = require("../db/config.js")
const https = require('https');
const axios = require('axios');
const User = require("../models_mysql/UserModel")
const Actions = require("../models_mysql/ActionsModel")

const notify = async (data) => {

    let message = {
        app_id: "2546f458-f4fb-49cb-b0e4-d79d3d7c5c6e",
        contents: data.messages,
        headings: data.headings,
        include_external_user_ids: [data.userId.toString()]
    };
    //
    if (data.template) {
        message.template_id = data.template;
    }
    //if(data.buttons) {

    //}
    const options = {
        method: 'POST',
        url: 'https://onesignal.com/api/v1/notifications',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Basic ZTA5MmM4MjAtNmMzYy00ZGM1LWI1MzEtNDllN2M0ZGM1YTY3'
        },
        data: JSON.stringify(message)
    };
    axios.request(options).then(function (response) {
        console.log("Notification sent.")

    }).catch(function (error) {
        console.error(error.toString());
    });
};

module.exports = notify;