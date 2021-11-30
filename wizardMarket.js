const { Telegraf, session, Scenes: { WizardScene, Stage }, Composer, Context, Markup } = require("telegraf");
const fileManagerHelper = require("./utils/FileManagerHelper.js");
const db = require("./db.js");
const axios = require('axios').default;
const { v4: uuidv4 } = require('uuid');

let langCode, userName;

const localizedStrings = {
  'en': {
    'chatTypeText': '[Warning] This command only for private chat. Lets talk in private - @ElectroTallinnBot :)',
    'titleText': '⚠️ Before adding a product, make sure you have added a username in your Telegram settings!\n\n1️⃣ *Name* \nName: Enter the name of the product.',
    'descriptionText': '2️⃣ *Desription*\nDescribe the product. Condition, characteristics, wear, etc.',   
    'priceText': '3️⃣ *Price*\nWrite product price in euros.',
    'categoryText': '4️⃣ *Category*\nSelect a product category.',
    'categoryButtonText': '4️⃣ *Category*\nSelect a product category.',
    'photoText': '5️⃣ *Photo*\nTake a photo of the product or download from your phone library.',
    'finalText': '👍 <b>Thank you</b> 👍\nProduct will be approved in 24h and added to the <a href="https://app.electrotallinn.ee/market">market</a>.',
    'leaveText': 'Ended.',
    'categoryButtonText': {
      'TRANSPORT': '🛴 [Transport]',
      'SPARE_PARTS':'⚙️ [Spare parts]',
      'ACCESSORIES':'🚥 [Accessories]',
      'EQUIPMENT':'👖 [Equipment]',
      'OTHER':'⚡ [Other]'
    },
    'leaveText': 'Ended'
  },
  'ru': {
    'chatTypeText': '[Предупреждение] Эта команда только для приватного чата. Поговорим наедине - @ElectroTallinnBot :)',
    'titleText': '⚠️ Перед добавлением товара убедитесь в том, что у вас добавлено имя пользователя в настройках Telegram!\n\n1️⃣ *Название*\nНазвание: Укажите наименование товара.',
    'descriptionText': '2️⃣ *Описание*\nОпишите товар. Состояние, характеристика, износ и т.д.',
    'priceText': '3️⃣ *Цена*\nУкажите цену товара в евро.',
    'categoryText': '4️⃣ *Категория*\nВыберите категорию товара.',
    'categoryButtonText': '4️⃣ *Категория*\nВыберите категорию товара.',
    'photoText': '5️⃣ *Фото*\nСделайте фото товара или загрузите из библиотеки телефона.',
    'finalText': '👍 <b>Спасибо</b> 👍\nТовар будет одобрен в течение 24 часов и добавлен в <a href="https://app.electrotallinn.ee/market">маркет</a>.',
    'leaveText': 'Завершено.',
    'categoryButtonText': {
      'TRANSPORT': '🛴 [Транспорт]',
      'SPARE_PARTS':'⚙️ [Комплектующие]',
      'ACCESSORIES':'🚥 [Аксусуары]',
      'EQUIPMENT':'👖 [Экипировка]',
      'OTHER':'⚡ [Другое]'
    },
    'leaveText': 'Ended'
  },
  'et-ee': {
    'chatTypeText': '[Hoiatus] See käsk on mõeldud ainult privaatseks vestluseks. Räägime privaatselt - @ElectroTallinnBot :)',
    'titleText': '⚠️ Enne toote lisamist veendu, et oled Telegrami seadetes lisanud kasutajanime!\n\n1️⃣ *Nimi*\nSisesta toote nimi.',
    'descriptionText': '2️⃣ *Kirjeldus*\nKirjeldage toodet. Seisukord, omadused, kulumine jne.',
    'priceText': '3️⃣ *Hind*\nMärkige kauba hind eurodes.',
    'categoryText': '4️⃣ *Kategooria*\nValige tootekategooria.',
    'categoryButtonText': '4️⃣ *Kategooria*\nValige tootekategooria.',
    'photoText': '5️⃣ *Foto*\nTehke tootest foto või laadige alla oma telefoniraamatukogust.',
    'finalText': '👍 <b>Täname</b> 👍\nKaup kinnitatakse 24 tunni jooksul ja lisatakse <a href="https://app.electrotallinn.ee/market">turule</a>.',
    'leaveText': 'Lõppenud.',
    'categoryButtonText': {
      'TRANSPORT': '🛴 [Transport]',
      'SPARE_PARTS':'⚙️ [Komponendid]',
      'ACCESSORIES':'🚥 [Aksessuaarid]',
      'EQUIPMENT':'👖 [Varustus]',
      'OTHER':'⚡ [Muud]'
    },
    'leaveText': 'Ended'
  }
}

module.exports = {
  init: bot => {

    // markup elements
    //const exitKeyboard = Markup.keyboard(['Exit']).resize().oneTime();
    const remove_keyboard = Markup.inlineKeyboard([])
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
    getCategoryKeyboard = () => {
      let buttons = marketProductCategories.map((category) => {return [{text: localizedStrings[langCode]['categoryButtonText'][category], callback_data: category}]})
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

    translate = (path) => {
      let parts = path.split('.')
      return parts.reduce((previousValue, currentValue) => previousValue[currentValue], localizedStrings[langCode])
    }

    // scene steps
    const titleHandler = new Composer()
    titleHandler.on('text', async ctx => {
      console.log("M1: " + ctx.message.text + " by USER: " + userName);
      ctx.scene.state.title = ctx.message.text;
      bot.telegram.editMessageReplyMarkup(ctx.chat.id, ctx.message.message_id-1, reply_markup={})
      await ctx.replyWithMarkdown(translate('descriptionText'), exitKeyboard);
      return ctx.wizard.next();
    })

    const descriptionHandler = new Composer()
    descriptionHandler.on('text', async ctx => {
      console.log("M2: " + ctx.message.text + " by USER: " + userName);
      ctx.scene.state.description = ctx.message.text;
      bot.telegram.editMessageReplyMarkup(ctx.chat.id, ctx.message.message_id-1, reply_markup={})
      await ctx.replyWithMarkdown(translate('priceText'), exitKeyboard);
      return ctx.wizard.next();
    });

    const priceHandler = new Composer()
    priceHandler.on('text', async ctx => {
      console.log("M3: " + ctx.message.text + " by USER: " + userName);
      ctx.scene.state.price = ctx.message.text;
      bot.telegram.editMessageReplyMarkup(ctx.chat.id, ctx.message.message_id-1, reply_markup={})
      await ctx.replyWithMarkdown(translate('categoryText'), getCategoryKeyboard());
      return ctx.wizard.next();
    });
    // buttons to select
    const categoryHandler = new Composer()
    categoryHandler.on("callback_query", async ctx => {
      //bot.telegram.answerCallbackQuery(ctx.update.callback_query.id, {text: 'No news'});
      //ctx.answerCbQuery()
      ctx.editMessageReplyMarkup(reply_markup={})
      console.log("CATEGORY: " + ctx.update.callback_query.data + " by USER: " + userName);
      ctx.scene.state.category = ctx.update.callback_query.data;
      await bot.telegram.sendMessage(ctx.chat.id, translate('categoryButtonText.'+ctx.update.callback_query.data));
      await ctx.replyWithMarkdown(translate('photoText'), exitKeyboard);
      return ctx.wizard.next();
    });

    const imageHandler = new Composer()
    imageHandler.on('photo', async ctx => {
      bot.telegram.editMessageReplyMarkup(ctx.chat.id, ctx.message.message_id-1, reply_markup={})

      // Get Image
      const getUrl = await ctx.telegram.getFileLink(ctx.message.photo[3].file_id);
      const imgUrl = getUrl.href;
      console.log("IMG URL: " + imgUrl + " by USER: " + userName);

      const response = await axios.get(imgUrl, { responseType: 'arraybuffer' })
      const b64image = Buffer.from(response.data, 'binary').toString('base64')

      // product creation in DB
      let sql = "INSERT INTO market_products (user_uin, name, description, price, status, date_created, category) VALUES (?, ?, ?, ?, ?, ?, ?)";
      let params = [ctx.message.from.id, ctx.scene.state.title, ctx.scene.state.description, ctx.scene.state.price, 'NEW', new Date(), ctx.scene.state.category];

      let result = await db.query(sql, params);

      // image creation in DB
      let fileName = uuidv4() + '.jpg';
      let token = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmaXJzdE5hbWUiOiLQkNC70LXQutGB0LDQvdC00YAiLCJ1aW4iOjM3MTE3NjQ5OCwicGhvdG9VcmwiOiJodHRwczovL3QubWUvaS91c2VycGljLzMyMC9CWFBKNURtb2g4WnBDdDNWcHU2RWxnTzBUMFRsejlqaFNrX3ZaaFo5WVB3LmpwZyIsInVzZXJuYW1lIjoibmV1cm9tYXNrIiwicm9sZSI6IkFETUlOIiwiaWF0IjoxNjM4MTQ0MzcwLCJleHAiOjE2MzgyMzA3NzB9.eUkLs7nS2W4jTUavt0ydPbv_wFLLQWFzPRBEzNeYH7E';
      await fileManagerHelper.create('market', b64image, fileName, token);

      let sqlFile = "INSERT INTO market_product_images (market_product_id, file_name) VALUES (?, ?)";
      let paramsFile = [result.insertId, fileName];
      await db.query(sqlFile, paramsFile);

      await ctx.replyWithHTML(translate('finalText'));
      await bot.telegram.sendMessage(371176498, `*DONE:*\n${userName} добавил товар, ${ctx.scene.state.title}, ${ctx.scene.state.description}. Язык [ ${langCode} ]`, { parse_mode: "Markdown" });
      console.log("MARKET | DONE by USER: " + userName);

      return ctx.scene.leave();
    });


    // scene
    const marketScene = new WizardScene('marketScene', titleHandler, descriptionHandler, priceHandler, categoryHandler, imageHandler);
    marketScene.enter(ctx => {
      ctx.replyWithMarkdown(translate('titleText'), exitKeyboard)
      console.log(ctx)
    });
    marketScene.leave(ctx => {
      console.log("MARKET | ABORTED by USER: " + userName)
      bot.telegram.sendMessage(ctx.chat.id, translate('leaveText'), remove_keyboard)
    });

    return marketScene
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
    bot.command("/sell", async ctx => {
      userName = ctx.update.message.chat.first_name;
      console.log("MARKET | STARTED by USER: " + userName);
      if (ctx.message.chat.type != 'private') {
        bot.telegram.sendMessage(ctx.chat.id, translate('chatTypeText'));
      } else {
        ctx.scene.leave();
        ctx.scene.enter('marketScene');
        setLang(ctx);
      }
      bot.telegram.sendMessage(371176498, `*MARKET | STARTED:*\nНачал, [ ${userName} ], язык [ ${langCode} ]`, { parse_mode: "Markdown" });
    });

  }

}