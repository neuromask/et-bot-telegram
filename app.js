const { Telegraf, session, Scenes: { WizardScene, Stage }, Composer, Context, Markup } = require("telegraf");
require('dotenv').config();
const wizardMap = require("./wizardMap.js");
const wizardMarket = require("./wizardMarket.js");
const weather = require("./weather.js");
const msg = require("./msg.js");
const bot = new Telegraf(process.env.TELEGRAM_TOKEN);

// ------------- Translation ------------- //

const translations = require("./translation.json");
translate = (path, ctx) => {
  let parts = path.split('.')
  return parts.reduce((previousValue, currentValue) => previousValue[currentValue], translations[ctx.scene.state.locale]) || path
}

// ------------- Wizards ------------- //

const sceneMap = wizardMap.init(bot);
const sceneMarket = wizardMarket.init(bot);

const stage = new Stage([sceneMap, sceneMarket]);
stage.action('exit', ctx => {
  ctx.editMessageReplyMarkup(reply_markup={})
  ctx.scene.leave()
});

bot.use(session())
bot.use(stage.middleware())

wizardMap.initCommand(bot);
wizardMarket.initCommand(bot);

// ------------- Components ------------- //

msg.init(bot);
weather.init(bot);

// ------------- Launch bot ------------- //

bot.launch();