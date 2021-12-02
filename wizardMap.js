const { Telegraf, session, Scenes: { WizardScene, Stage }, Composer, Context, Markup } = require("telegraf");
const axios = require('axios').default;
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();
// MySQL
const mysql = require('mysql');
const connection = mysql.createPool({
  host      : process.env.DB_HOST,
  user      : process.env.DB_USER,
  password  : process.env.DB_PASS,
  database  : process.env.DB_NAME
});

// Language based answers
const localizedMapStrings = {
  'en': {
    'chatTypeText': '[Warning] This command only for private chat. Lets talk in private - @ElectroTallinnBot :)',
    'titleText': '⚠️ Before adding a point, please make sure that the outlet is working and same point has not been previously added to the map!\n\n1️⃣ *Name*\nPlease name the place, write address, company or street name near the object.',
    'descriptionText': '2️⃣ *Desription*\nPlease describe place. Is it outside or inside? How to find it in place.',
    'typeText': '3️⃣ *Type*\nPlease select type of place.',
    'coordsText': '4️⃣ *Location*\nPlease select your current location or use marker for custom location.',
    'coordsBtnText': 'My current location.',
    'photoText': '5️⃣ *Photo*\nPlease take a picture of the objec in landscape mode.',
    'finalText': '👍 <b>Thank you</b> 👍\nLocation will be approved in 24h and added to the <a href="https://map.electrotallinn.ee">map</a>.',
    'en': 'Ended.',
    'typeButtonText': {
      'CHARGE': '⚡ [Charging]',
      'REPAIR':'🛠️ [Repair]',
      'WATER':'💦 [Water]',
      'AIR':'💨 [Air]'
    }
  },
  'ru': {
    'chatTypeText': '[Предупреждение] Эта команда только для приватного чата. Поговорим наедине - @ElectroTallinnBot :)',
    'titleText': '⚠️ Перед добавлением точки убедитесь в том, что розетка работает и такая точка уже не добавлена ранее на карту!\n\n1️⃣ *Название*\nНазовите место: Укажите адрес, компанию или улицу рядом с объектом.',
    'descriptionText': '2️⃣ *Описание*\nОпишите место. Это снаружи или внутри? Как найти на месте.',
    'typeText': '3️⃣ *Тип*\nПожалуйста, выберите тип места.',
    'coordsText': '4️⃣ *Место расположения*\nДля текущей позиции - нажмите на кнопу либо поставьте точку(локацию) на карте через "скрепку"',
    'coordsBtnText': 'Мое текущее местоположение.',
    'photoText': '5️⃣ *Фото*\nПожалуйста, сделайте фото объекта в ландшафтном режиме или загрузите из библиотеки телефона.',
    'finalText': '👍 <b>Спасибо</b> 👍\nМестоположение будет одобрено в течение 24 часов и добавлено на <a href="https://map.electrotallinn.ee">карту</a>.',
    'ru': 'Завершено.',
    'typeButtonText': {
      'CHARGE': '⚡ [Зарядка]',
      'REPAIR':'🛠️ [Ремонт]',
      'WATER':'💦 [Вода]',
      'AIR':'💨 [Воздух]'
    }
  },
  'et-ee': {
    'titleText': '⚠️ Enne punkti lisamist veenduge, et pistikupesa töötab ja et sellist punkti pole kaardile varem lisatud.!\n\n1️⃣ *Nimi*\nPalun nimatage koht, kirjutage objekti lähedale aadress, ettevõtte või tänava nimi.',
    'chatTypeText': '[Hoiatus] See käsk on mõeldud ainult privaatseks vestluseks. Räägime privaatselt - @ElectroTallinnBot :)',
    'descriptionText': '2️⃣ *Kirjeldus*\nPalun kirjeldage kohta. Kas see on väljas või sees? Kuidas seda kohal leida.',
    'typeText': '3️⃣ *Tüüp*\nPalun valige koha tüüp.',
    'coordsText': '4️⃣ *Asukoht*\nPalun valige oma praegune asukoht või kasutage kohandatud asukoha jaoks markerit.',
    'coordsBtnText': 'Minu praegune asukoht.',
    'photoText': '5️⃣ *Foto*\nPalun pildistage objekt maastikurežiimis.',
    'finalText': '👍 <b>Täname</b> 👍\nAsukoht kinnitatakse 24 tunni jooksul ja lisatakse <a href="https://map.electrotallinn.ee">kaardile</a>.',
    'etee': 'Lõppenud.',
    'typeButtonText': {
      'CHARGE': '⚡ [Laadimine]',
      'REPAIR':'🛠️ [Remont]',
      'WATER':'💦 [Vesi]',
      'AIR':'💨 [Õhk]'
    }
  }
}

module.exports = {
  init: bot => {

    // markup elements
    const exitKeyboard = {
      reply_markup: JSON.stringify({
        inline_keyboard: [
          [{ text: "❌", callback_data: "exit" }]
        ]
      })
    };
    const remove_keyboard = Markup.removeKeyboard();

    const coords_keyboard = Markup.keyboard([
      Markup.button.locationRequest('📍 [Location]')
    ]).resize().oneTime();

    getTypeKeyboard = (ctx) => {
      let buttons = mapTypes.map((type) => {return [{text: localizedMapStrings[ctx.scene.state.locale]['typeButtonText'][type], callback_data: type}]})
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

    translate = (path, ctx) => {
      let parts = path.split('.')
      return parts.reduce((previousValue, currentValue) => previousValue[currentValue], localizedMapStrings[ctx.scene.state.locale]) || path
    }

    // scene steps
    const titleHandler = new Composer()
    titleHandler.on('text', async ctx => {
      console.log("T1: " + ctx.message.text + " by USER: " + ctx.scene.state.userFirstName);
      ctx.scene.state.title = ctx.message.text;
      bot.telegram.editMessageReplyMarkup(ctx.chat.id, ctx.scene.state.lastBotMsgId, reply_markup={})
      let payload = await ctx.replyWithMarkdown(translate('descriptionText', ctx), exitKeyboard);
      ctx.scene.state.lastBotMsgId = payload.message_id;
      return ctx.wizard.next();
    })

    const descriptionHandler = new Composer()
    descriptionHandler.on('text', async ctx => {
      console.log("T2: " + ctx.message.text + " by USER: " + ctx.scene.state.userFirstName);
      ctx.scene.state.description = ctx.message.text;
      bot.telegram.editMessageReplyMarkup(ctx.chat.id, ctx.scene.state.lastBotMsgId, reply_markup={})
      let payload = await ctx.replyWithMarkdown(translate('typeText', ctx), getTypeKeyboard(ctx));
      ctx.scene.state.lastBotMsgId = payload.message_id;
      return ctx.wizard.next();
    });

    const typeHandler = new Composer()
    typeHandler.on("callback_query", async ctx => {
      console.log("TYPE: " + ctx.update.callback_query.data + " by USER: " + ctx.scene.state.userFirstName);
      ctx.scene.state.type = ctx.update.callback_query.data;
      await ctx.replyWithMarkdown(translate('coordsText', ctx), coords_keyboard);
      return ctx.wizard.next();
    });

    const coordsHandler = new Composer()
    coordsHandler.on('location', async ctx => {
      console.log("POS: " + ctx.message.location.latitude + ',' + ctx.message.location.longitude + " by USER: " + ctx.scene.state.userFirstName);
      ctx.scene.state.lat = ctx.message.location.latitude;
      ctx.scene.state.lng = ctx.message.location.longitude;
      await ctx.replyWithMarkdown(translate('photoText', ctx), exitKeyboard);
      return ctx.wizard.next();

    });

    const imageHandler = new Composer()
    imageHandler.on('photo', async ctx => {
      // Get Image
      const getUrl = await ctx.telegram.getFileLink(ctx.message.photo[2].file_id);
      const imgUrl = getUrl.href;
      console.log("IMG URL: " + imgUrl + " by USER: " + ctx.scene.state.userFirstName);

      const response = await axios.get(imgUrl, { responseType: 'arraybuffer' })
      const buffer = Buffer.from(response.data, 'binary');

      // MySQL
      connection.getConnection(function (err, c) {
        if (err) {
          console.log(err);
          c.release();
          return;
        }
        const fields = {
          title: ctx.scene.state.title,
          description: ctx.scene.state.description,
          lat: ctx.scene.state.lat,
          lng: ctx.scene.state.lng,
          image: buffer,
          image_name: uuidv4() + '.jpg',
          type: ctx.scene.state.type,
          user_first_name: ctx.message.chat.first_name,
          user_uin: ctx.message.from.id,
          confirmed: false
        };
        c.query('INSERT INTO locations SET ?', fields, function (error, result) {
          console.log(result);
          //console.log(error);
          c.release();
        });
      });

      await ctx.replyWithHTML(translate('finalText', ctx), remove_keyboard);
      await bot.telegram.sendMessage(371176498, `*DONE:*\n${ctx.scene.state.userFirstName} отправил точку, ${ctx.scene.state.title}, ${ctx.scene.state.description}. Язык [ ${langCode} ]`, { parse_mode: "Markdown" });
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
      let payload = await ctx.replyWithMarkdown(translate('titleText', ctx), exitKeyboard);
      ctx.scene.state.lastBotMsgId = payload.message_id;
    });
    mapScene.leave(ctx => {
      console.log("MAP | ABORTED by USER: " + ctx.scene.state.userFirstName)
      bot.telegram.sendMessage(ctx.chat.id, translate('leaveText', ctx))
    });

    return mapScene
  },

  initCommand: bot => {
    // command to start
    bot.command("/add", async ctx => {
      if (ctx.message.chat.type != 'private') {
        bot.telegram.sendMessage(ctx.chat.id, translate('chatTypeText', ctx));
      } else {
        ctx.scene.enter('mapScene');
      }
    });

  }

}