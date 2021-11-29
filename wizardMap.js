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

let langCode, userName;

// Language based answers
const localizedStrings = {
  chatTypeText: {
    'en': '[Warning] This command only for private chat. Lets talk in private - @ElectroTallinnBot :)',
    'et-ee': '[Hoiatus] See käsk on mõeldud ainult privaatseks vestluseks. Räägime privaatselt - @ElectroTallinnBot :)',
    'ru': '[Предупреждение] Эта команда только для приватного чата. Поговорим наедине - @ElectroTallinnBot :)'
  },
  titleText: {
    'en': '⚠️ Before adding a point, please make sure that the outlet is working and same point has not been previously added to the map!\n\n1️⃣ *Name*\nPlease name the place, write address, company or street name near the object.',
    'et-ee': '⚠️ Enne punkti lisamist veenduge, et pistikupesa töötab ja et sellist punkti pole kaardile varem lisatud.!\n\n1️⃣ *Nimi*\nPalun nimatage koht, kirjutage objekti lähedale aadress, ettevõtte või tänava nimi.',
    'ru': '⚠️ Перед добавлением точки убедитесь в том, что розетка работает и такая точка уже не добавлена ранее на карту!\n\n1️⃣ *Название*\nНазовите место: Укажите адрес, компанию или улицу рядом с объектом.'
  },
  descriptionText: {
    'en': '2️⃣ *Desription*\nPlease describe place. Is it outside or inside? How to find it in place.',
    'et-ee': '2️⃣ *Kirjeldus*\nPalun kirjeldage kohta. Kas see on väljas või sees? Kuidas seda kohal leida.',
    'ru': '2️⃣ *Описание*\nОпишите место. Это снаружи или внутри? Как найти на месте.'
  },
  typeText: {
    'en': '3️⃣ *Type*\nPlease select type of place.',
    'et-ee': '3️⃣ *Tüüp*\nPalun valige koha tüüp.',
    'ru': '3️⃣ *Тип*\nПожалуйста, выберите тип места.'
  },
  coordsText: {
    'en': '4️⃣ *Location*\nPlease select your current location or use marker for custom location.',
    'et-ee': '4️⃣ *Asukoht*\nPalun valige oma praegune asukoht või kasutage kohandatud asukoha jaoks markerit.',
    'ru': '4️⃣ *Место расположения*\nДля текущей позиции - нажмите на кнопу либо поставьте точку(локацию) на карте через "скрепку"'
  },
  coordsBtnText: {
    'en': 'My current location.',
    'et-ee': 'Minu praegune asukoht.',
    'ru': 'Мое текущее местоположение.'
  },
  photoText: {
    'en': '5️⃣ *Photo*\nPlease take a picture of the objec in landscape mode.',
    'et-ee': '5️⃣ *Foto*\nPalun pildistage objekt maastikurežiimis.',
    'ru': '5️⃣ *Фото*\nПожалуйста, сделайте фото объекта в ландшафтном режиме или загрузите из библиотеки телефона.'
  },
  finalText: {
    'en': '👍 <b>Thank you</b> 👍\nLocation will be approved in 24h and added to the <a href="https://map.electrotallinn.ee">map</a>.',
    'et-ee': '👍 <b>Täname</b> 👍\nAsukoht kinnitatakse 24 tunni jooksul ja lisatakse <a href="https://map.electrotallinn.ee">kaardile</a>.',
    'ru': '👍 <b>Спасибо</b> 👍\nМестоположение будет одобрено в течение 24 часов и добавлено на <a href="https://map.electrotallinn.ee">карту</a>.'
  },
  leaveText: {
    'en': 'Ended.',
    'et-ee': 'Lõppenud.',
    'ru': 'Завершено.'
  }
}

module.exports = {
  init: bot => {

    // markup elements
    const exit_keyboard = Markup.inlineKeyboard([
      Markup.button.callback('❌', 'exit')
    ])
    const remove_keyboard = Markup.removeKeyboard();

    const coords_keyboard = Markup.keyboard([
      Markup.button.locationRequest('📍 [Location]')
    ]).resize().oneTime();

    const type_keyboard = {
      reply_markup: JSON.stringify({
        inline_keyboard: [
          [{ text: "⚡ [Charging]", callback_data: "CHARGE" }],
          [{ text: "🛠️ [Repair]", callback_data: "REPAIR" }],
          [{ text: "💦 [Water]", callback_data: "WATER" }],
          [{ text: "💨 [Air]", callback_data: "AIR" }],
          [{ text: "❌", callback_data: "exit" }]
        ]
      })
    };


    // scene steps
    const titleHandler = new Composer()
    titleHandler.on('text', async ctx => {
      console.log("T1: " + ctx.message.text + " by USER: " + userName);
      ctx.scene.state.title = ctx.message.text;
      console.log(ctx.message);
      await ctx.replyWithMarkdown(localizedStrings['descriptionText'][langCode], exit_keyboard);
      return ctx.wizard.next();
    })

    const descriptionHandler = new Composer()
    descriptionHandler.on('text', async ctx => {
      console.log("T2: " + ctx.message.text + " by USER: " + userName);
      ctx.scene.state.description = ctx.message.text;
      await ctx.replyWithMarkdown(localizedStrings['typeText'][langCode], type_keyboard);
      return ctx.wizard.next();
    });

    const typeHandler = new Composer()
    typeHandler.on("callback_query", async ctx => {
      console.log("TYPE: " + ctx.update.callback_query.data + " by USER: " + userName);
      ctx.scene.state.type = ctx.update.callback_query.data;
      await ctx.replyWithMarkdown(localizedStrings['coordsText'][langCode], coords_keyboard);
      return ctx.wizard.next();
    });

    const coordsHandler = new Composer()
    coordsHandler.on('location', async ctx => {
      console.log("POS: " + ctx.message.location.latitude + ',' + ctx.message.location.longitude + " by USER: " + userName);
      ctx.scene.state.lat = ctx.message.location.latitude;
      ctx.scene.state.lng = ctx.message.location.longitude;
      await ctx.replyWithMarkdown(localizedStrings['photoText'][langCode], exit_keyboard);
      return ctx.wizard.next();

    });

    const imageHandler = new Composer()
    imageHandler.on('photo', async ctx => {
      // Get Image
      const getUrl = await ctx.telegram.getFileLink(ctx.message.photo[2].file_id);
      const imgUrl = getUrl.href;
      console.log("IMG URL: " + imgUrl + " by USER: " + userName);

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

      await ctx.replyWithHTML(localizedStrings['finalText'][langCode], remove_keyboard);
      await bot.telegram.sendMessage(371176498, `*DONE:*\n${userName} отправил точку, ${ctx.scene.state.title}, ${ctx.scene.state.description}. Язык [ ${langCode} ]`, { parse_mode: "Markdown" });
      console.log("MAP | DONE by USER: " + userName);

      return ctx.scene.leave();
    });


    // scene
    const mapScene = new WizardScene('mapScene', titleHandler, descriptionHandler, typeHandler, coordsHandler, imageHandler);
    mapScene.enter(ctx => ctx.replyWithMarkdown(localizedStrings['titleText'][langCode], exit_keyboard));
    mapScene.leave(ctx => {
      console.log("MAP | ABORTED by USER: " + userName)
      bot.telegram.sendMessage(ctx.chat.id, localizedStrings['leaveText'][langCode], remove_keyboard)
    });

    return mapScene
  },

  initCommand: bot => {

    // get user lang
    function setLang(ctx) {
      const userLang = ctx.update.message.from.language_code;
      if (userLang == "ru" || userLang == "et-ee") {
        langCode = ctx.message.from.language_code;
      } else {
        langCode = "en";
      }
      console.log("LANG: " + langCode + " by USER: " + userName);
    }

    // command to start
    bot.command("/add", async ctx => {
      userName = ctx.update.message.chat.first_name;
      console.log("MAP | STARTED by USER: " + userName);
      if (ctx.message.chat.type != 'private') {
        bot.telegram.sendMessage(ctx.chat.id, localizedStrings['chatTypeText'][langCode]);
      } else {
        ctx.scene.leave();
        ctx.scene.enter('mapScene');
        setLang(ctx);
      }
      bot.telegram.sendMessage(371176498, `*MAP | STARTED:*\nНачал, [ ${userName} ], язык [ ${langCode} ]`, { parse_mode: "Markdown" });
    });

  }

}