"use strict";

require("dotenv").config();
const Telegraf = require("telegraf");
const Extra = require("telegraf/extra");
const Markup = require("telegraf/markup");
const session = require("telegraf/session");
const schedule = require("node-schedule");
const chats = require("./chatsInfo.json");
const fs = require("fs");
const path = require("path");
const parser = require("./parse");

const bot = new Telegraf(process.env.BOT_TOKEN);
bot.start(async (ctx) => {
  const chatId = ctx.update.message.chat.id;
  await ctx.reply(
    "Цей бот присилає оновлення графіку відключень Чернівціобленерго"
  );
  if (chats.filter((e) => e?.id === chatId).length < 1) {
    chats.push({ id: chatId });
    await fs.writeFile("./chatsInfo.json", JSON.stringify(chats), (err) => {
      if (err) {
        console.log(err);
      }
    });
    await ctx.reply(
      "Чи бажаєте Ви вказати групу відключень, для того щоб отримувати детальну інформацію?",
      Markup.inlineKeyboard([
        Markup.callbackButton("Так", "Yes"),
        Markup.callbackButton("Ні", "No"),
      ]).extra()
    );
  }
});

bot.action("Yes", async (ctx) => {
  await ctx.deleteMessage();
  let groupsNumber = parseInt(process.env.GROUPS);
  let keyboard = [];
  const resKeyboard = [];
  let chunk = [];

  for (let i = 1; i <= groupsNumber; i++) {
    keyboard.push(Markup.callbackButton(i.toString(), i.toString()));
  }

  for (let i = 0; i < keyboard.length; i++) {
    chunk.push(keyboard[i]);
    if (chunk.length === 6 || i === keyboard.length - 1) {
      resKeyboard.push(chunk);
      chunk = [];
    }
  }
  resKeyboard.push([
    Markup.callbackButton("Не вказувати групу", "cancelgroup"),
  ]);
  await ctx.reply(
    "Виберіть групу:",
    Markup.inlineKeyboard(resKeyboard).extra()
  );
});

bot.action(["No", "cancelgroup"], async (ctx) => {
  await ctx.deleteMessage();
});

bot.action(/^\d+$/, async (ctx) => {
  const chatId = ctx.update.callback_query.from.id;
  const group = parseInt(ctx.update.callback_query.data);
  let chatIndex = chats.findIndex((obj) => obj.id == chatId);
  if (chatIndex >= 0) {
    chats[chatIndex].group = group;
    await fs.writeFile("./chatsInfo.json", JSON.stringify(chats), (err) => {
      if (err) {
        console.log(err);
      }
    });
    await ctx.deleteMessage();
    ctx.reply("Ви вибрали групу: " + group);
  }
});

bot.command("schedule", async (ctx) => {
  if (!fs.existsSync("schedule.png")) {
    await parser.getSchedulePic();
  }
  await ctx.telegram.sendPhoto(ctx.update.message.chat.id, {
    source: "schedule.png",
  });
});

bot.command("test", async (ctx) => {
  await checkSchedule();
});

// const job = schedule.scheduleJob("*/5 * * * *", checkSchedule);

async function checkSchedule() {
  //every 5 minutes
  const newSchedule = await parser.parseSchedule();
  const compareSchedules = await parser.compareSchedules(newSchedule);
  if (!compareSchedules) {
    fs.writeFileSync(
      path.join("schedules", `${newSchedule?.date}.json`),
      JSON.stringify(newSchedule)
    );
    console.log("Sending schedule: " + new Date() + "\n");
    for (let chat of chats) {
      try {
        const getSchedule = await parser.getSchedulePic();
        if (getSchedule)
          await bot.telegram.sendPhoto(chat.id, { source: "schedule.png" });
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
  } else {
    console.log("same");
  }
}

bot.use(session());
bot.catch((err) => {
  console.log(err);
});

bot.launch();

process.on("uncaughtException", function (err) {
  console.log("Caught exception: ", err);
});
