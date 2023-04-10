const { Telegraf, session, Scenes: { WizardScene, Stage }, Composer, Context, Markup } = require("telegraf");
const axios = require('axios').default;
const db = require("../db.js");
const { v4: uuidv4 } = require('uuid');


module.exports = {
  init: bot => {

    // markup elements
    const exitKeyboard = {
      reply_markup: JSON.stringify({
        inline_keyboard: [
          [{ text: "❌", callback_data: "exit" }]
        ],
        remove_keyboard: true
      })
    };
    const remove_keyboard = Markup.removeKeyboard();

    const coords_keyboard = {
      reply_markup: JSON.stringify({
        keyboard: [
          [{text: '📍 [Location]', request_location: true}]
        ],
        resize_keyboard: true,
        one_time_keyboard: true,
      }),
    };

    const getTypeKeyboard = (ctx) => {
      let buttons = mapTypes.map((type) => {return [{text: translate('map.typeButtonText.'+type, ctx), callback_data: type}]})
      return {
        reply_markup: JSON.stringify({
          inline_keyboard: [
            ...buttons,
            [{ text: "❌", callback_data: "exit" }]
          ]
        })
      }
    }
    const mapTypes = ["CHARGE", "REPAIR", "WATER", "AIR"]



    // scene steps
    const titleHandler = new Composer()
    titleHandler.on('text', async ctx => {
      console.log("T1: " + ctx.message.text + " by USER: " + ctx.scene.state.userFirstName);
      ctx.scene.state.title = ctx.message.text;
      bot.telegram.editMessageReplyMarkup(ctx.chat.id, ctx.scene.state.lastBotMsgId, reply_markup={})
      let payload = await ctx.replyWithMarkdown(translate('map.descriptionText', ctx), exitKeyboard);
      ctx.scene.state.lastBotMsgId = payload.message_id;
      return ctx.wizard.next();
    })

    const descriptionHandler = new Composer()
    descriptionHandler.on('text', async ctx => {
      console.log("T2: " + ctx.message.text + " by USER: " + ctx.scene.state.userFirstName);
      ctx.scene.state.description = ctx.message.text;
      bot.telegram.editMessageReplyMarkup(ctx.chat.id, ctx.scene.state.lastBotMsgId, reply_markup={})
      let payload = await ctx.replyWithMarkdown(translate('map.typeText', ctx), getTypeKeyboard(ctx));
      ctx.scene.state.lastBotMsgId = payload.message_id;
      return ctx.wizard.next();
    });
  // buttons to select
    const typeHandler = new Composer()
    typeHandler.on("callback_query", async ctx => {
      ctx.editMessageReplyMarkup(reply_markup={})
      console.log("TYPE: " + ctx.update.callback_query.data + " by USER: " + ctx.scene.state.userFirstName);
      ctx.scene.state.type = ctx.update.callback_query.data;
      await ctx.replyWithMarkdown(translate('map.typeButtonText.'+ctx.update.callback_query.data, ctx), coords_keyboard);
      let payload = await ctx.replyWithMarkdown(translate('map.coordsText', ctx), exitKeyboard);
      ctx.scene.state.lastBotMsgId = payload.message_id;
      return ctx.wizard.next();
    });

    const coordsHandler = new Composer()
    coordsHandler.on('location', async ctx => {
      bot.telegram.editMessageReplyMarkup(ctx.chat.id, ctx.scene.state.lastBotMsgId, reply_markup={})
      console.log("POS: " + ctx.message.location.latitude + ',' + ctx.message.location.longitude + " by USER: " + ctx.scene.state.userFirstName);
      ctx.scene.state.lat = ctx.message.location.latitude;
      ctx.scene.state.lng = ctx.message.location.longitude;
      let msg = await ctx.replyWithMarkdown('Location added', remove_keyboard);
      bot.telegram.deleteMessage(ctx.chat.id, msg.message_id);
      let payload = await ctx.replyWithMarkdown(translate('map.photoText', ctx), exitKeyboard);
      ctx.scene.state.lastBotMsgId = payload.message_id;
      return ctx.wizard.next();

    });

    const imageHandler = new Composer()
    imageHandler.on('photo', async ctx => {

      if (ctx.message.media_group_id) {
        if (ctx.scene.state.imageHandlerGroupId != ctx.message.media_group_id) {
          ctx.scene.state.imageHandlerGroupId = ctx.message.media_group_id
          bot.telegram.editMessageReplyMarkup(ctx.chat.id, ctx.scene.state.lastBotMsgId, reply_markup={})
          let payload = await bot.telegram.sendMessage(ctx.chat.id, translate('map.errorPhotoGroupText', ctx), exitKeyboard)
          ctx.scene.state.lastBotMsgId = payload.message_id;
        }
        return
      }

      // Get Image
      const getUrl = await ctx.telegram.getFileLink(ctx.message.photo[2].file_id);
      const imgUrl = getUrl.href;
      console.log("IMG URL: " + imgUrl + " by USER: " + ctx.scene.state.userFirstName);

      const response = await axios.get(imgUrl, { responseType: 'arraybuffer' })
      const buffer = Buffer.from(response.data, 'binary');

      // MySQL
      let state = ctx.scene.state
      let sql = 'INSERT INTO locations (title, description, lat, lng, image, image_name, type, user_first_name, user_uin, confirmed) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
      let params = [state.title, state.description, state.lat, state.lng, buffer, uuidv4() + '.jpg', state.type, state.userFirstName, ctx.message.from.id, 0];

      await db.query(sql, params);

      // end text
      await ctx.replyWithHTML(translate('map.finalText', ctx));
      await bot.telegram.sendMessage(371176498, `*DONE:*\n${ctx.scene.state.userFirstName} отправил точку, ${ctx.scene.state.title}, ${ctx.scene.state.description}. Язык [ ${ctx.scene.state.locale} ]`, { parse_mode: "Markdown" });
      console.log("MAP | DONE by USER: " + ctx.scene.state.userFirstName);
      return ctx.scene.leave();
    });


    // scene
    const mapScene = new WizardScene('mapScene', titleHandler, descriptionHandler, typeHandler, coordsHandler, imageHandler);
    mapScene.enter(async ctx => {
      // scene vars
      ctx.scene.state.userFirstName = ctx.update.message.chat.first_name;
      ctx.scene.state.locale = ctx.message.from.language_code;
      console.log("MAP | STARTED by USER: " + ctx.scene.state.userFirstName);
      bot.telegram.sendMessage(371176498, `*MAP | STARTED:*\nНачал, [ ${ctx.scene.state.userFirstName} ], язык [ ${ctx.scene.state.locale} ]`, { parse_mode: "Markdown" });
      let payload = await ctx.replyWithMarkdown(translate('map.titleText', ctx), exitKeyboard);
      ctx.scene.state.lastBotMsgId = payload.message_id;
    });
    mapScene.leave(ctx => {
      console.log("MAP | ABORTED by USER: " + ctx.scene.state.userFirstName)
      bot.telegram.sendMessage(ctx.chat.id, translate('map.leaveText', ctx), remove_keyboard)
    });

    return mapScene
  },

  initCommand: bot => {
    // command to start
    bot.command("add", async ctx => {
      if (ctx.message.chat.type != 'private') {
        ctx.scene.state.locale = ctx.message.from.language_code;
        ctx.replyWithMarkdown(translate('map.chatTypeText', ctx));
      } else {
        ctx.scene.enter('mapScene');
      }
    });

  }

}