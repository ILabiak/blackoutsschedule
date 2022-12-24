"use strict";

require("dotenv").config();
const Telegraf = require("telegraf");
const session = require("telegraf/session");
const schedule = require('node-schedule');

const bot = new Telegraf(process.env.BOT_TOKEN);
bot.start((ctx) => ctx.reply('Цей бот присилає оновлення графіку відключень Чернівціобленерго'));

bot.use(session());
bot.catch((err) => {
  console.log(err);
});

const job = schedule.scheduleJob('/10 * * * * *', function(){
    
  });

bot.launch();
bot.on("document", async (ctx) => {
  ctx.reply("Got document!");
});
