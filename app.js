const { Telegraf, session, Scenes: { WizardScene, Stage }, Composer, Context, Markup } = require("telegraf");
require('dotenv').config();
const wizardMap = require("./components/wizardMap.js");
const wizardMarket = require("./components/wizardMarket.js");
const wizardWeather = require("./components/weather.js");
const msg = require("./components/msg.js");
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
const sceneWeather = wizardWeather.init(bot);

const stage = new Stage([sceneMap, sceneMarket, sceneWeather]);
stage.action('exit', ctx => {
  ctx.editMessageReplyMarkup(reply_markup={})
  ctx.scene.leave()
});

bot.use(session())
bot.use(stage.middleware())

wizardMap.initCommand(bot);
wizardMarket.initCommand(bot);
wizardWeather.initCommand(bot);

// ------------- Components ------------- //

msg.init(bot);

// ------------- Launch bot ------------- //

bot.launch();