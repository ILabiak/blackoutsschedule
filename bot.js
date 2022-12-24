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
  bot.telegram.sendMessage(868619239, "test");
});

bot.command("pic", async (ctx) => {
  await ctx.telegram.sendPhoto(868619239, { source: "schedules/new.png" });
});

const job = schedule.scheduleJob("* */5 * * * *", async function () {
  //every 20 seconds
  await parser.parseSchedule();
  const compareSchedules = await parser.comparePics();
  if (!compareSchedules) {
    for (let id of chats) {
      try {
        await ctx.telegram.sendPhoto(id, { source: "schedules/new.png" });
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
  else {
    console.log('still same schedule')
  }
});

bot.use(session());
bot.catch((err) => {
  console.log(err);
});

// const job = schedule.scheduleJob('/10 * * * * *', function(){

//   });

bot.launch();
bot.on("document", async (ctx) => {
  ctx.reply("Got document!");
});
