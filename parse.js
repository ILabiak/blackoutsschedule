"use strict";

const fs = require("fs");
const puppeteer = require("puppeteer");

async function parseSchedule() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto("https://oblenergo.cv.ua/shutdowns/");

  const el = await page.waitForSelector("#gav-image");

  let imageHref = await page.evaluate((sel) => {
    return document.querySelector(sel).getAttribute("src").replace("/", "");
  }, "#gav-image");

  let viewSource = await page.goto(
    "https://oblenergo.cv.ua/shutdowns/" + imageHref
  );
  if (fs.existsSync("schedules/new.png")) {
    fs.rename("schedules/new.png", "schedules/old.png", (err) => {
      if (err) {
        console.log(err);
      }
    });
  }
  fs.writeFile("schedules/new.png", await viewSource.buffer(), function (err) {
    if (err) {
      return console.log(err);
    }
    console.log("The file was saved!");
  });

  browser.close();
  return 1;
}

(async () => {
  await parseSchedule();
})();

module.exports = {
  parseSchedule,
};
