const { Telegraf, session, Scenes: { WizardScene, Stage }, Composer, Context, Markup } = require("telegraf");
const fileManagerHelper = require("./utils/FileManagerHelper.js");
const db = require("./db.js");
const axios = require('axios').default;
const { v4: uuidv4 } = require('uuid');

module.exports = {
  init: bot => {

    // markup elements
    //const exitKeyboard = Markup.keyboard(['Exit']).resize().oneTime();
    //const remove_keyboard = Markup.inlineKeyboard([])
    //const exitKeyboard = Markup.inlineKeyboard([
    //  Markup.button.callback('❌', 'exit')
    //])
    const exitKeyboard = {
      reply_markup: JSON.stringify({
        inline_keyboard: [
          [{ text: "❌", callback_data: "exit" }]
        ]
      })
    };
    const getCategoryKeyboard = (ctx) => {
      let buttons = marketProductCategories.map((category) => {return [{text: translate('market.categoryButtonText.'+category, ctx), callback_data: category}]})
      return {
        reply_markup: JSON.stringify({
          inline_keyboard: [
            ...buttons,
            [{ text: "❌", callback_data: "exit" }]
          ]
        })
      }
    }
    const marketProductCategories = ["TRANSPORT", "SPARE_PARTS", "ACCESSORIES", "EQUIPMENT", "OTHER"]

    // scene steps
    const titleHandler = new Composer()
    titleHandler.on('text', async ctx => {
      console.log("M1: " + ctx.message.text + " by USER: " + ctx.scene.state.userFirstName);
      ctx.scene.state.title = ctx.message.text;
      bot.telegram.editMessageReplyMarkup(ctx.chat.id, ctx.scene.state.lastBotMsgId, reply_markup={})
      let payload = await ctx.replyWithMarkdown(translate('market.descriptionText', ctx), exitKeyboard)
      ctx.scene.state.lastBotMsgId = payload.message_id
      return ctx.wizard.next();
    })

    const descriptionHandler = new Composer()
    descriptionHandler.on('text', async ctx => {
      console.log("M2: " + ctx.message.text + " by USER: " + ctx.scene.state.userFirstName);
      ctx.scene.state.description = ctx.message.text;
      bot.telegram.editMessageReplyMarkup(ctx.chat.id, ctx.scene.state.lastBotMsgId, reply_markup={})
      let payload = await ctx.replyWithMarkdown(translate('market.priceText', ctx), exitKeyboard);
      ctx.scene.state.lastBotMsgId = payload.message_id
      return ctx.wizard.next();
    });

    const priceHandler = new Composer()
    priceHandler.on('text', async ctx => {
      console.log("M3: " + ctx.message.text + " by USER: " + ctx.scene.state.userFirstName);
      ctx.scene.state.price = ctx.message.text;
      bot.telegram.editMessageReplyMarkup(ctx.chat.id, ctx.scene.state.lastBotMsgId, reply_markup={})
      let payload = await ctx.replyWithMarkdown(translate('market.categoryText', ctx), getCategoryKeyboard(ctx));
      ctx.scene.state.lastBotMsgId = payload.message_id
      return ctx.wizard.next();
    });

    // buttons to select
    const categoryHandler = new Composer()
    categoryHandler.on("callback_query", async ctx => {
      //bot.telegram.answerCallbackQuery(ctx.update.callback_query.id, {text: 'No news'});
      ctx.editMessageReplyMarkup(reply_markup={})
      console.log("CATEGORY: " + ctx.update.callback_query.data + " by USER: " + ctx.scene.state.userFirstName);
      ctx.scene.state.category = ctx.update.callback_query.data;
      await bot.telegram.sendMessage(ctx.chat.id, translate('market.categoryButtonText.'+ctx.update.callback_query.data, ctx));
      await ctx.replyWithMarkdown(translate('market.photoText', ctx), exitKeyboard);
      return ctx.wizard.next();
    });

    const imageHandler = new Composer()
    imageHandler.on('photo', async ctx => {

      // Get Image
      const getUrl = await ctx.telegram.getFileLink(ctx.message.photo[3].file_id);
      const imgUrl = getUrl.href;
      console.log("IMG URL: " + imgUrl + " by USER: " + ctx.scene.state.userFirstName);

      const response = await axios.get(imgUrl, { responseType: 'arraybuffer' })
      const b64image = Buffer.from(response.data, 'binary').toString('base64')


    });
/*
    const finalSave = () => {
      // product creation in DB
      let sql = "INSERT INTO market_products (user_uin, name, description, price, status, date_created, category) VALUES (?, ?, ?, ?, ?, ?, ?)";
      let params = [ctx.message.from.id, ctx.scene.state.title, ctx.scene.state.description, ctx.scene.state.price, 'NEW', new Date(), ctx.scene.state.category];

      let result = await db.query(sql, params);

      // image creation in DB
      let fileName = uuidv4() + '.jpg';
      await fileManagerHelper.create('market', b64image, fileName, 'Bearer '+ctx.scene.state.token);

      let sqlFile = "INSERT INTO market_product_images (market_product_id, file_name) VALUES (?, ?)";
      let paramsFile = [result.insertId, fileName];
      await db.query(sqlFile, paramsFile);

      // end text
      await ctx.replyWithHTML(translate('market.finalText', ctx));
      await bot.telegram.sendMessage(371176498, `*DONE:*\n${ctx.scene.state.userFirstName} добавил товар, ${ctx.scene.state.title}, ${ctx.scene.state.description}. Язык [ ${ctx.scene.state.locale} ]`, { parse_mode: "Markdown" });
      console.log("MARKET | DONE by USER: " + ctx.scene.state.userFirstName);

      return ctx.scene.leave();
    }*/


    // scene
    const marketScene = new WizardScene('marketScene', titleHandler, descriptionHandler, priceHandler, categoryHandler, imageHandler);
    marketScene.enter(async ctx => {

      let userData = {
        uin: ctx.update.message.chat.id,
        firstName: ctx.update.message.chat.first_name,
        photoUrl: '',
        username: ctx.update.message.chat.username
      }
      let response = await axios.post('http://app.electrotallinn.ee/api/authentication/login/bot', userData);
      // scene vars
      ctx.scene.state.token = response.data.token;
      ctx.scene.state.userFirstName = ctx.update.message.chat.first_name;
      ctx.scene.state.locale = ctx.message.from.language_code;

      console.log("MARKET | STARTED by USER: " + ctx.scene.state.userFirstName);
      bot.telegram.sendMessage(371176498, `*MARKET | STARTED:*\nНачал, [ ${ctx.scene.state.userFirstName} ], язык [ ${ctx.scene.state.locale} ]`, { parse_mode: "Markdown" });
      let payload = await ctx.replyWithMarkdown(translate('market.titleText', ctx), exitKeyboard);
      ctx.scene.state.lastBotMsgId = payload.message_id;
    });
    marketScene.leave(ctx => {
      console.log("MARKET | ABORTED by USER: " + ctx.scene.state.userFirstName)
      bot.telegram.sendMessage(ctx.chat.id, translate('market.leaveText', ctx))
    });

    return marketScene
  },

  initCommand: bot => {

    // command to start
    bot.command("/sell", async ctx => {
      if (ctx.message.chat.type != 'private') {
        bot.telegram.sendMessage(ctx.chat.id, translate('market.chatTypeText', ctx));
      } else {
        ctx.scene.enter('marketScene');
      }
    });

  }

}