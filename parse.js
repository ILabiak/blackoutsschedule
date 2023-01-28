"use strict";

const fs = require("fs");
const puppeteer = require("puppeteer");
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
  console.log(JSON.stringify(result, 0, 2));
}

async function compareSchedules(newSchedule) {
  const oldScheduleBuff = fs.readFileSync("schedule.json");
  const oldSchedule = JSON.parse(oldScheduleBuff);
  return JSON.stringify(oldSchedule) === JSON.stringify(newSchedule);
}

async function getSchedulePic() {
  const browser = await puppeteer.launch({
    headless: true,
  });

  const page = await browser.newPage();
  await page.setViewport({
    width: 1920,
    height: 1080,
  });
  try {
    await page.goto("https://oblenergo.cv.ua/shutdowns/");
  } catch (err) {
    console.log(err);
    await browser.close();
    return false;
  }

  try {
    const tableTitle = await page.waitForSelector("#gsv_h");
    const tableTitlePos = await tableTitle.boundingBox();
    const table = await page.$("#gsv");
    const tablePos = await table.boundingBox();
    console.log(tableTitlePos);
    console.log(tablePos);
    const height = tablePos.y - tableTitlePos.y + tablePos.height;

    await page.screenshot({
      path: "schedule.png",
      clip: {
        x: tableTitlePos.x,
        y: tableTitlePos.y,
        width: tableTitlePos.width,
        height: height,
      },
    });
  } catch (err) {
    console.log(err);
    await browser.close();
    return false;
  }

  await browser.close();
  return true;
}

(async () => {
  // await parseSchedule();
  // const newSchedule = JSON.parse(fs.readFileSync("schedule2.json"));
  // console.log(await compareSchedules(newSchedule));
  await getSchedulePic();
})();

module.exports = {
  parseSchedule,
  compareSchedules,
};
