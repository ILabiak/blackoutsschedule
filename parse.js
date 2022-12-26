"use strict";

const fs = require("fs");
const puppeteer = require("puppeteer");
const looksSame = require("looks-same");

async function parseSchedule() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto("https://oblenergo.cv.ua/shutdowns/");
  } catch (err) {
    console.log(err);
    return;
  }

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
        return console.log(err);
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

async function comparePics() {
  const { equal } = await looksSame("schedules/old.png", "schedules/new.png");
  return equal;
}

// (async () => {
//   //   await parseSchedule();
//   console.log(await comparePics());
// })();

module.exports = {
  parseSchedule,
  comparePics,
};
