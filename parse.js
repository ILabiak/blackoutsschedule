"use strict";

const fs = require("fs");
const puppeteer = require("puppeteer");
const looksSame = require("looks-same");
global.crypto = require("crypto");

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
  // console.log(
  //   "files exist: new.png " +
  //     fs.existsSync("schedules/new.png") +
  //     "\n old.png " +
  //     fs.existsSync("schedules/old.png")
  // );
  if (
    fs.existsSync("schedules/new.png") &&
    fs.existsSync("schedules/old.png")
  ) {
    const { equal, diffBounds, diffClusters } = await looksSame(
      "schedules/new.png",
      "schedules/old.png",
      { tolerance: 5 }
    );
    if (!equal) {
      let diffFilePath = "schedules/" + crypto.randomUUID() + ".png";
      await looksSame.createDiff({
        reference: "schedules/new.png",
        current: "schedules/old.png",
        diff: diffFilePath,
        highlightColor: "#ff00ff", // color to highlight the differences
        strict: false, // strict comparsion
        tolerance: 5,
        antialiasingTolerance: 0,
        ignoreAntialiasing: true, // ignore antialising by default
        ignoreCaret: true, // ignore caret by default
      });
      console.log(
        "Images are different. Difference file: " +
          diffFilePath +
          "\n" +
          new Date()
      );
    }
    // console.log("returning equal parameter.");
    return equal;
  }
  // console.log("just returning true");
  return true;
}

// (async () => {
//   // await parseSchedule();
//     console.log(await comparePics());
// })();

module.exports = {
  parseSchedule,
  comparePics,
};
