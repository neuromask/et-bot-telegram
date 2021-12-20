const { Telegraf, session, Scenes: { WizardScene, Stage }, Composer, Context, Markup } = require("telegraf");
const fileManagerHelper = require("../utils/FileManagerHelper.js");
const db = require("../db.js");
const axios = require('axios').default;
const { v4: uuidv4 } = require('uuid');
const utils = require("../utils/Utils.js");

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

    const finishKeyboard = (ctx) => {
      return {
        reply_markup: JSON.stringify({
          inline_keyboard: [
            [{ text: translate('market.finishButtonText', ctx), callback_data: "finish" }, { text: "❌", callback_data: "exit" }]
          ]
        })
      }
    }

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
      let payload = await ctx.replyWithMarkdown(translate('market.photoText', ctx), exitKeyboard);
      ctx.scene.state.lastBotMsgId = payload.message_id
      return ctx.wizard.next();
    });

    const imageHandler = new Composer()
    imageHandler.on('photo', async ctx => {

      let groupFirst = false;
      if (ctx.message.media_group_id && ctx.scene.state.imageHandlerGroupId == ctx.message.media_group_id) {
        groupFirst = true
      } else if (ctx.message.media_group_id && ctx.scene.state.imageHandlerGroupId != ctx.message.media_group_id) {
        ctx.scene.state.imageHandlerGroupId = ctx.message.media_group_id
      }

      if (!groupFirst) bot.telegram.editMessageReplyMarkup(ctx.chat.id, ctx.scene.state.lastBotMsgId, reply_markup={})

      ctx.scene.state.images = ctx.scene.state.images || []

      if (ctx.scene.state.images.length < 3) {
        // Get image link
        const getUrl = await ctx.telegram.getFileLink(ctx.message.photo[3].file_id);
        const imgUrl = getUrl.href;
        console.log("IMG URL: " + imgUrl + " by USER: " + ctx.scene.state.userFirstName);
        const response = await axios.get(imgUrl, { responseType: 'arraybuffer' })
        
        ctx.scene.state.images.push(Buffer.from(response.data, 'binary').toString('base64'))
      }

      if (ctx.scene.state.images.length == 3) {
        finish(ctx)
      } else if (!groupFirst) {
        let payload = await ctx.replyWithMarkdown(translate('market.morePhotoText', ctx) + '\n*('+ctx.scene.state.images.length+'/3)*', finishKeyboard(ctx));
        ctx.scene.state.lastBotMsgId = payload.message_id
      }
    });

    const finish = async ctx => {
      // product creation in DB
      let sql = "INSERT INTO market_products (user_uin, name, description, price, status, date_created, category) VALUES (?, ?, ?, ?, ?, ?, ?)";
      let params = [ctx.scene.state.uin, ctx.scene.state.title, ctx.scene.state.description, ctx.scene.state.price, 'ACTIVE', new Date(), ctx.scene.state.category];

      let result = await db.query(sql, params);

      // image creation in DB
      ctx.scene.state.images.forEach(async item => {
        try {
          let fileName = uuidv4() + '.jpg';
          await fileManagerHelper.create('market', item, fileName, 'Bearer '+ctx.scene.state.token);
          let sqlFile = "INSERT INTO market_product_images (market_product_id, file_name) VALUES (?, ?)";
          let paramsFile = [result.insertId, fileName];
          await db.query(sqlFile, paramsFile);
        } catch(e){
          console.log(e)
        }
      });

      // end text
      await ctx.replyWithHTML(translate('market.finalText', ctx));
      await bot.telegram.sendMessage(371176498, `*DONE:*\n${ctx.scene.state.userFirstName} добавил товар, ${ctx.scene.state.title}, ${ctx.scene.state.description}. Язык [ ${ctx.scene.state.locale} ]`, { parse_mode: "Markdown" });
      console.log("MARKET | DONE by USER: " + ctx.scene.state.userFirstName);

      return ctx.scene.leave();
    };

    imageHandler.action('finish', (ctx) => {
      ctx.editMessageReplyMarkup(reply_markup={})
      finish(ctx)
    });

    // scene
    const marketScene = new WizardScene('marketScene', titleHandler, descriptionHandler, priceHandler, categoryHandler, imageHandler);
    marketScene.enter(async ctx => {
      
      // Get avatar link
      let avatarObject = await ctx.telegram.getUserProfilePhotos(ctx.update.message.from.id, 0, 1)
      let getUrl = await ctx.telegram.getFileLink(avatarObject.photos[0][2].file_id);
      const userAvatarUrl = getUrl.href;

      let userData = {
        uin: ctx.update.message.chat.id,
        firstName: ctx.update.message.chat.first_name,
        photoUrl: userAvatarUrl,
        username: ctx.update.message.chat.username
      }
      let response = await axios.post(`${utils.getApiBaseUrl()}/authentication/login/bot`, userData);

      // Scene vars
      ctx.scene.state.token = response.data.token;
      ctx.scene.state.userFirstName = ctx.update.message.chat.first_name;
      ctx.scene.state.locale = ctx.message.from.language_code;
      ctx.scene.state.uin = ctx.message.from.id;

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
        ctx.scene.state.locale = ctx.message.from.language_code;
        ctx.replyWithMarkdown(translate('market.chatTypeText', ctx));
      } else {
        ctx.scene.enter('marketScene');
      }
    });

  }

}