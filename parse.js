"use strict";

const fs = require("fs");
// const puppeteer = require("puppeteer");
// const looksSame = require("looks-same");
const axios = require("axios");
const cheerio = require("cheerio");
global.crypto = require("crypto");

const getHTML = async (url) => {
  try {
    const { data } = await axios.get(url);
    // console.dir(data)
    return cheerio.load(data);
  } catch (err) {
    // console.log('axios err', err)
    return;
  }
};

async function parseSchedule() {
  const $ = await getHTML("https://oblenergo.cv.ua/shutdowns/");
  if ($ === undefined) return;

  //get time array
  let timeArray = [];
  const pElement = $("#gsv > div > p:nth-child(1)");

  pElement.find("u b").each((i, elem) => {
    const time = $(elem).text().trim();
    timeArray.push(time);
  });
  // console.log(timeArray);

  // [
  //   '00:00', '01:00', '02:00',
  //   '03:00', '04:00', '05:00',
  //   '06:00', '07:00', '08:00',
  //   '09:00', '10:00', '11:00',
  //   '12:00', '13:00', '14:00',
  //   '15:00', '16:00', '17:00',
  //   '18:00', '19:00', '20:00',
  //   '21:00', '22:00', '23:00',
  //   '00:00'
  // ]

  // get groups schedule data
  const result = {
    time: timeArray,
    schedules: [],
  };
  $('[id^="inf"]').each(function (i, element) {
    const schedule = $(element).text().split("");
    result.schedules.push({
      id: parseInt($(element).attr("data-id")),
      schedule: schedule,
    });
  });
  console.log(result);
}

async function compareSchedules() {}

(async () => {
  await parseSchedule();
})();

module.exports = {
  parseSchedule,
  comparePics,
};
