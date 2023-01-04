"use strict";

require("dotenv").config();
const Telegraf = require("telegraf");
const session = require("telegraf/session");
const schedule = require("node-schedule");
const chats = require("./chatids.json");
const fs = require("fs");
const parser = require("./parse");

const bot = new Telegraf(process.env.BOT_TOKEN);
bot.start(async (ctx) => {
  const chatId = ctx.update.message.chat.id;
  if (!chats.includes(chatId)) {
    chats.push(chatId);
    await fs.writeFile("./chatids.json", JSON.stringify(chats), (err) =>
      console.log(err)
    );
  }
  ctx.reply("Цей бот присилає оновлення графіку відключень Чернівціобленерго");
});

bot.command("schedule", async (ctx) => {
  // await parser.parseSchedule();
  await ctx.telegram.sendPhoto(ctx.update.message.chat.id, {
    source: "schedules/new.png",
  });
});

const job = schedule.scheduleJob("*/5 * * * *", async function () {
  //every 5 minutes
  await parser.parseSchedule();
  const compareSchedules = await parser.comparePics();
  if (!compareSchedules) {
    console.log("Sending schedule: " + new Date() + "\n");
    console.dir('compareSchedules value ' + compareSchedules); //for debug
    for (let id of chats) {
      try {
        await bot.telegram.sendPhoto(id, { source: "schedules/new.png" });
      } catch (err) {
        if (err.code === 403) {
          //delete chatID
          console.log("error found");
          const index = chats.indexOf(id);
          if (index > -1) {
            chats.splice(index, 1);
            await fs.writeFile("./chatids.json", JSON.stringify(chats), (err) =>
              console.log(err)
            );
          }
          return;
        }
        console.log(err);
      }
    }
  }
});

bot.use(session());
bot.catch((err) => {
  console.log(err);
});

bot.launch();

process.on("uncaughtException", function (err) {
  console.log("Caught exception: ", err);
});
