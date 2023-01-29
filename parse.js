"use strict";

const fs = require("fs");
const path = require("path")
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

async function parseSchedule(url = "https://oblenergo.cv.ua/shutdowns/") {
  const $ = await getHTML(url);
  if ($ === undefined) return;

  //get date
  const date = $("#gsv_t > div > b").text();

  //get time array
  let timeArray = [];
  const pElement = $("#gsv > div > p:nth-child(1)");

  pElement.find("u b").each((i, elem) => {
    const time = $(elem).text().trim();
    timeArray.push(time);
  });
  // console.log(timeArray);

  // get groups schedule data
  const result = {
    date: date,
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
  // console.log(JSON.stringify(result, 0, 2));
  return result;
}

async function compareSchedules(newSchedule) {
  let schedulePath = path.join('schedules', `${newSchedule?.date}.json`)
  if(fs.existsSync(schedulePath)){
    const oldScheduleBuff = fs.readFileSync(schedulePath);
    const oldSchedule = JSON.parse(oldScheduleBuff);
    return JSON.stringify(oldSchedule) === JSON.stringify(newSchedule);
  }
  return false
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
    const tableTitle = await page.waitForSelector("#gsv_h");
    const tableTitlePos = await tableTitle.boundingBox();
    const table = await page.$("#gsv");
    const tablePos = await table.boundingBox();
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
  // console.log(await getSchedulePic())
  // console.log('done')
})();

module.exports = {
  parseSchedule,
  compareSchedules,
  getSchedulePic,
};
