const { image_search, image_search_generator } = require("duckduckgo-images-api");
const censure = require("../assets/censure.json");

function botCommands(lang) {
  if (lang == 'ru') {
    return `ET⚡️ *Команды бота*\n
*/sell* - _Добавить продукт в маркет_
*/add* - _Добавить точку на карту_
*/pogoda* - _Прогноз погоды_
*/app* - _Страница приложения_
*/market* - _Меню маркета_
*/map* - _Меню карты_
*/ali* - _Aliexpress ссылки_
*/help* - _Перечень команд_
*/social* - _Ссылки на соцсети_
*/pic* <название> - _Поиск картинки_
📍 - Отправьте свое гео положение, чтобы найти ближайшую розетку`

  } else {
    return `ET⚡️ *Bot commands*\n
*/sell* - _Add product to sell_
*/add* - _Add point to map_
*/weather* - _Weather forecast_
*/app* - _App webpage_
*/market* - _Market menu_
*/map* - _Map menu_
*/ali* - _Aliexpress links_
*/help* - _List of commands_
*/social* - _ElectroTallinn social media links_
*/pic* <name> - _Search for image_
📍 - Send your geo position to get nearest socket around you`
  }
}


module.exports = {
  init: bot => {
    bot.start((ctx) => ctx.reply(botCommands(ctx.message.from.language_code), { disable_web_page_preview: true, parse_mode: "Markdown", disable_notification: true }));
    // New member
    bot.on("new_chat_members", (ctx) => {
      bot.telegram.sendMessage(ctx.chat.id, `<b>Welcome / Добро пожаловать, ${ctx.message.new_chat_member.first_name}!</b>\n ⚠️ <a href="https://t.me/electrotallinn/106800/116732">Ознакомься</a> с устройством группы в Телеграме! ⚠️ \n ⚠️ <a href="https://t.me/electrotallinn/106800/116732">Please read</a> group information in Telegram! ⚠️\n`,
        { disable_web_page_preview: true, parse_mode: "HTML", disable_notification: true });
      ctx.replyWithSticker('CAACAgQAAxkBAAEKmPJgtu1nXdo4zdB0lKLHAAFzcsmOyl8AAj8KAAJrfPFTmXeoVb1qy_cfBA');
    });

    bot.command("help", ctx => {
      bot.telegram.sendMessage(ctx.chat.id, botCommands(ctx.message.from.language_code), { disable_web_page_preview: true, parse_mode: "Markdown", disable_notification: true });
    });

    bot.command("test", async ctx => {
      console.log(ctx.message.from)
      let avatarObject = await ctx.telegram.getUserProfilePhotos(ctx.update.message.from.id, 0, 1)
      let getUrl = await ctx.telegram.getFileLink(avatarObject.photos[0][2].file_id);
      const userAvatarUrl = getUrl.href;
      console.log(userAvatarUrl)
    });

    bot.command("ali", ctx => {
      bot.telegram.sendMessage(ctx.chat.id, "ET⚡️ *Aliexpress links*\n\n_https://bit.ly/2DVyl1d_", { disable_web_page_preview: true, parse_mode: "Markdown", disable_notification: true });
    });

    bot.command("app", ctx => {
      bot.telegram.sendMessage(ctx.chat.id, "ET⚡️ *App*\n\n_https://electrotallinn.ee_", { disable_web_page_preview: true, parse_mode: "Markdown", disable_notification: true });
    });

    bot.command("map", ctx => {
      let botMessage = "ET⚡️ *Map*\n";
      bot.telegram.sendMessage(ctx.chat.id, botMessage, {
        disable_notification: true,
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              { text: "🌏 Map", url: 'https://electrotallinn.ee/map' },
              { text: "🏆 Top Ranks", url: 'https://electrotallinn.ee/users/ranks' },
            ],
            [
              { text: "ℹ️ App", url: 'https://electrotallinn.ee' },
              { text: "📍 Add Point", url: 'https://t.me/electrotallinnbot?start' },
            ]
          ]
        }
      })
    });

    bot.command("market", ctx => {
      let botMessage = "ET⚡️ *Market*\n";
      bot.telegram.sendMessage(ctx.chat.id, botMessage, {
        disable_notification: true,
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              { text: "🛒 Market", url: 'https://electrotallinn.ee/market' },
              { text: "⚡ App", url: 'https://electrotallinn.ee' },
            ],
            [
              { text: "👤 Group", url: 'https://t.me/electrotallinn/106273' },
              { text: "💰 Bot Sell", url: 'https://t.me/electrotallinnbot?start' },
            ]
          ]
        }
      })
    });

    bot.command("say", ctx => {
      const tell = ctx.message.text;
      const say = tell.substr(tell.indexOf(" ") + 1);
      ctx.deleteMessage();
      bot.telegram.sendMessage(ctx.chat.id, `${say}`, { disable_web_page_preview: true, parse_mode: "Markdown" });
    });

    bot.command("social", ctx => {
      let botMessage = "ET⚡️ *Social media links*\n";
      //ctx.deleteMessage();
      bot.telegram.sendMessage(ctx.chat.id, botMessage, {
        disable_notification: true,
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              { text: "⚡️ Facebook", url: 'https://www.facebook.com/groups/electrotallinn' },
              { text: "⚡️ Instagram", url: 'https://www.instagram.com/electrotallinn' },
              { text: "⚡️ VK", url: 'https://vk.com/electrotallinn' }
            ],
            [
              { text: "⚡️ Youtube", url: 'https://www.youtube.com/electrotallinn' },
              { text: "⚡️ Flickr", url: 'https://www.flickr.com/electrotallinn' },
              { text: "⚡️ Reddit", url: 'https://www.reddit.com/r/electrotallinn' }
            ],
          ]
        }
      })
    });

    //bot.on("sticker", (ctx) => ctx.reply("👍"));
    bot.action("timeout-msg", ctx => {
      bot.telegram.sendMessage(ctx.chat.id, "text", { disable_web_page_preview: true, parse_mode: "Markdown", disable_notification: true }).then(({ message_id }) => { setTimeout(() => { ctx.deleteMessage(message_id) }, 15000) });
    });

    bot.command("pic", (ctx) => {
      const request = ctx.message.text;
      let search;
      if (request.split(" ").length > 1) {
        search = request.substr(request.indexOf(" ") + 1);
      } else {
        search = "random image";
      }
      function print(results) {
        //console.log("RESULTS:"+results);
        if (results != '') {
          let rndImg = results[Math.floor(Math.random() * results.length)];
          ctx.replyWithPhoto({ url: rndImg.image }, { caption: search });
        } else {
          bot.telegram.sendMessage(ctx.chat.id, "Not found..");
        }
      }
      image_search({ query: search, moderate: true, iterations: 1, retries: 1 }).then(results => print(results));
    });

    // ------------- Hears ------------- //

    bot.hears(["Привет", "привет", "хай", "Хай", "Yo", "Здарова", "здарова", "прив", "Прив", "Здрасте", "здрасте"], (ctx) => ctx.reply("Привет!", { disable_notification: true }));
    bot.hears(["mod", "repair", "service", "problem", "tuning"], (ctx) => ctx.reply("@electrotallinn_service - ElectroTallinn Service Group \nTech help, Mods, Tuning, Repair, Service", { disable_notification: true }));
    bot.hears(["проблема", "починить", "замена", "тюнинг", "сервис", "тех", "акум", "сервис"], (ctx) => ctx.reply("@electrotallinn_service - ElectroTallinn Мастерская \nРешение проблем, Сервис, Тюнинг, Запчасти", { disable_notification: true }));
    bot.hears("hi", (ctx) => ctx.reply("*Hey* there", { disable_web_page_preview: true, parse_mode: "Markdown", disable_notification: true }));
    bot.hears("map", (ctx) => ctx.replyWithHTML("<a href='https://map.electrotallinn.ee'>Map</a>", { disable_web_page_preview: true, disable_notification: true }));

    bot.on('location', async ctx => {
      //console.log(ctx.message.message_thread_id)
      //if (ctx.message.message_thread_id == '106281' || ctx.message.message_thread_id == 'undefined') {}
      if (ctx.message.chat.id == '-1001298173179' && ctx.message.from.is_bot == false) {
        ctx.sendMessage(-1001298173179, { message_thread_id: 143695, text: `<b>ET⚡️Location</b>\n\n🚀 <b>${ctx.message.from.first_name}</b> начал движение!\n📍 Следите на карте ниже!`, disable_web_page_preview: true, parse_mode: "HTML", disable_notification: true });
        ctx.forwardMessage(-1001298173179, { message_thread_id: 143695 }, ctx.chat.id, ctx.message.from.id);
      }
    });

    // ------------- Filters ------------- //

    bot.on('message', ctx => {
      //console.log(ctx.message.chat.id)
      // main ctx.message.chat.id -1001298173179
      // service ctx.message.message_thread_id 106266
      // -- ctx.message.message_thread_id --
      // general thread 
      // rides thread 106281
      // location thread 143695
      // chat thread 106277
      if (ctx.message.text && ctx.message.message_thread_id != '106277' && ctx.message.chat.id != '-1001207578072') {
        if (censure.some(word => ctx.message.text.toString().toLowerCase().split(" ").includes(word))) {
          ctx.replyWithMarkdown(`*${ctx.message.from.first_name}*, не ругаемся :) - _сообщение удалено_`);
          ctx.deleteMessage();
        }
      }
      
    });

  }

}