const { Telegraf, session, Scenes: { WizardScene, Stage }, Composer, Context, Markup } = require("telegraf");
const { image_search, image_search_generator } = require("duckduckgo-images-api");
const wizardMap = require("./wizardMap.js");
const wizardMarket = require("./wizardMarket.js");
require('dotenv').config();
const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
const db = require("./db.js");


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


// ------------- Commands ------------- //

bot.start((ctx) => ctx.reply("Commands for Bot:\n\n */map* - _Charging sockets map_\n */add* - _Add point to map_\n */ali* - _Aliexpress links_\n */help* - _List of commands_\n */social* - _ElectroTallinn social media links_\n */pic* <name> - _Search for image_\n ", { disable_web_page_preview: true, parse_mode: "Markdown", disable_notification: true }));
//bot.on("sticker", (ctx) => ctx.reply("👍"));

// New member
bot.on("new_chat_members", (ctx) => {
  bot.telegram.sendMessage(ctx.chat.id, `*Welcome / Добро пожаловать, ${ctx.message.new_chat_member.first_name}!*`, { disable_web_page_preview: true, parse_mode: "Markdown", disable_notification: true });
  bot.telegram.sendMessage(ctx.chat.id, `⚠️ <a href="https://t.me/electrotallinn_alerts/7">Ознакомься</a> с устройством группы в Телеграме! ⚠️ \n⚠️ <a href="https://t.me/electrotallinn_alerts/7">Please read</a> group information in Telegram! ⚠️`, { disable_web_page_preview: true, parse_mode: "HTML", disable_notification: true });
  bot.telegram.sendMessage(ctx.chat.id, "Commands for Bot:\n\n */map* - _Charging sockets map_\n */add* - _Add point to map_\n */ali* - _Aliexpress links_\n */help* - _List of commands_\n */social* - _ElectroTallinn social media links_\n */pic* <name> - _Search for image_\n ", { disable_web_page_preview: true, parse_mode: "Markdown", disable_notification: true }).then(({ message_id }) => { setTimeout(() => { ctx.deleteMessage(message_id) }, 60000) });
  ctx.replyWithSticker('CAACAgQAAxkBAAEKmPJgtu1nXdo4zdB0lKLHAAFzcsmOyl8AAj8KAAJrfPFTmXeoVb1qy_cfBA');
});

bot.command("/help", ctx => {
  bot.telegram.sendMessage(ctx.chat.id, "Commands for Bot:\n\n */map* - _Charging sockets map_\n */add* - _Add point to map_\n */ali* - _Aliexpress links_\n */help* - _List of commands_\n */social* - _ElectroTallinn social media links_\n */pic* <name> - _Search for image_\n ", { disable_web_page_preview: true, parse_mode: "Markdown", disable_notification: true });
});

bot.command("/ali", ctx => {
  bot.telegram.sendMessage(ctx.chat.id, "*Aliexpress links:* _https://bit.ly/2DVyl1d_", { disable_web_page_preview: true, parse_mode: "Markdown", disable_notification: true });
});

bot.command("/map", ctx => {
  //console.log(ctx.from)
  let botMessage = "ET⚡️ *ElectroTallinn* map:";
  //ctx.deleteMessage();
  bot.telegram.sendMessage(ctx.chat.id, botMessage, {
    disable_notification: true,
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [
          { text: "🌏 Map", url: 'https://map.electrotallinn.ee' },
          { text: "🏆 Top Ranks", url: 'https://map.electrotallinn.ee/top' },
        ],
        [
          { text: "ℹ️ Help", url: 'https://map.electrotallinn.ee/help' },
          { text: "📍 Add Point", url: 'https://t.me/electrotallinnbot?start' },
        ],
      ]
    }
  })
});

bot.command("/market", ctx => {
  //console.log(ctx.from)
  let botMessage = "ET⚡️ *ElectroTallinn* map:";
  //ctx.deleteMessage();
  bot.telegram.sendMessage(ctx.chat.id, botMessage, {
    disable_notification: true,
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [
          { text: "🌏 Map", url: 'https://map.electrotallinn.ee' },
          { text: "🏆 Top Ranks", url: 'https://map.electrotallinn.ee/top' },
        ],
        [
          { text: "ℹ️ Help", url: 'https://map.electrotallinn.ee/help' },
          { text: "📍 Add Point", url: 'https://t.me/electrotallinnbot?start' },
        ],
      ]
    }
  })
});

bot.command("/say", ctx => {
  const tell = ctx.message.text;
  const say = tell.substr(tell.indexOf(" ") + 1);
  ctx.deleteMessage();
  bot.telegram.sendMessage(ctx.chat.id, `${say}`, { disable_web_page_preview: true, parse_mode: "Markdown" });
});

bot.command("/social", ctx => {
  let botMessage = "ET⚡️ *ElectroTallinn* in social media:";
  //ctx.deleteMessage();
  bot.telegram.sendMessage(ctx.chat.id, botMessage, {
    disable_notification: true,
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [
          { text: "⚡️ Facebook", callback_data: "facebook", url: 'https://www.facebook.com/groups/electrotallinn' },
          { text: "⚡️Instagram", url: 'https://www.instagram.com/electrotallinn' },
          { text: "⚡️ VK", callback_data: "vk", url: 'https://vk.com/electrotallinn' },
        ],
        [
          { text: "⚡️ Youtube", callback_data: "youtube", url: 'https://www.youtube.com/electrotallinn' },
          { text: "⚡️ Flickr", callback_data: "flickr", url: 'https://www.flickr.com/electrotallinn' },
          { text: "⚡️ Reddit", callback_data: "reddit", url: 'https://www.reddit.com/r/electrotallinn' },
        ],
      ]
    }
  })
});

bot.action("facebook", ctx => {
  bot.telegram.sendMessage(ctx.chat.id, "*FACEBOOK:* _https://www.facebook.com/groups/electrotallinn_", { disable_web_page_preview: true, parse_mode: "Markdown", disable_notification: true }).then(({ message_id }) => { setTimeout(() => { ctx.deleteMessage(message_id) }, 15000) });
});

bot.command("/pic", (ctx) => {
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


// ------------- Filters ------------- //

let arr = ['6ля', '6лядь', '6лять', 'b3ъeб', 'cock', 'cunt', 'e6aль', 'ebal', 'eblan', 'eбaл', 'eбaть', 'eбyч', 'eбать', 'eбёт', 'eблантий', 'fuck', 'fucker', 'fucking', 'xyёв', 'xyй', 'xyя', 'xуе', 'xуй', 'xую', 'zaeb', 'zaebal', 'zaebali', 'zaebat', 'архипиздрит', 'ахуел', 'ахуеть', 'бздение', 'бздеть', 'бздех', 'бздецы', 'бздит', 'бздицы', 'бздло', 'бзднуть', 'бздун', 'бздунья', 'бздюха', 'бздюшка', 'бздюшко', 'бля', 'блябу', 'блябуду', 'бляд', 'бляди', 'блядина', 'блядище', 'блядки', 'блядовать', 'блядство', 'блядун', 'блядуны', 'блядунья', 'блядь', 'блядюга', 'блять', 'вафел', 'вафлёр', 'взъебка', 'взьебка', 'взьебывать', 'въеб', 'въебался', 'въебенн', 'въебусь', 'въебывать', 'выблядок', 'выблядыш', 'выеб', 'выебать', 'выебен', 'выебнулся', 'выебон', 'выебываться', 'выпердеть', 'высраться', 'выссаться', 'вьебен', 'гавно', 'гавнюк', 'гавнючка', 'гамно', 'гандон', 'гнид', 'гнида', 'гниды', 'говенка', 'говенный', 'говешка', 'говназия', 'говнецо', 'говнище', 'говно', 'говноед', 'говнолинк', 'говночист', 'говнюк', 'говнюха', 'говнядина', 'говняк', 'говняный', 'говнять', 'гондон', 'доебываться', 'долбоеб', 'долбоёб', 'долбоящер', 'дрисня', 'дрист', 'дристануть', 'дристать', 'дристун', 'дристуха', 'дрочелло', 'дрочена', 'дрочила', 'дрочилка', 'дрочистый', 'дрочить', 'дрочка', 'дрочун', 'е6ал', 'е6ут', 'ебтвоюмать', 'ёбтвоюмать', 'ёбaн', 'ебaть', 'ебyч', 'ебал', 'ебало', 'ебальник', 'ебан', 'ебанамать', 'ебанат', 'ебаная', 'ёбаная', 'ебанический', 'ебанный', 'ебанныйврот', 'ебаное', 'ебануть', 'ебануться', 'ёбаную', 'ебаный', 'ебанько', 'ебарь', 'ебат', 'ёбат', 'ебатория', 'ебать', 'ебать-копать', 'ебаться', 'ебашить', 'ебёна', 'ебет', 'ебёт', 'ебец', 'ебик', 'ебин', 'ебись', 'ебическая', 'ебки', 'ебла', 'еблан', 'ебливый', 'еблище', 'ебло', 'еблыст', 'ебля', 'ёбн', 'ебнуть', 'ебнуться', 'ебня', 'ебошить', 'ебская', 'ебский', 'ебтвоюмать', 'ебун', 'ебут', 'ебуч', 'ебуче', 'ебучее', 'ебучий', 'ебучим', 'ебущ', 'ебырь', 'елда', 'елдак', 'елдачить', 'жопа', 'жопу', 'заговнять', 'задрачивать', 'задристать', 'задрота', 'зае6', 'заё6', 'заеб', 'заёб', 'заеба', 'заебал', 'заебанец', 'заебастая', 'заебастый', 'заебать', 'заебаться', 'заебашить', 'заебистое', 'заёбистое', 'заебистые', 'заёбистые', 'заебистый', 'заёбистый', 'заебись', 'заебошить', 'заебываться', 'залуп', 'залупа', 'залупаться', 'залупить', 'залупиться', 'замудохаться', 'запиздячить', 'засерать', 'засерун', 'засеря', 'засирать', 'засрун', 'захуячить', 'заябестая', 'злоеб', 'злоебучая', 'злоебучее', 'злоебучий', 'ибанамат', 'ибонех', 'изговнять', 'изговняться', 'изъебнуться', 'ипать', 'ипаться', 'ипаццо', 'Какдвапальцаобоссать', 'конча', 'курва', 'курвятник', 'лох', 'лошарa', 'лошара', 'лошары', 'лошок', 'лярва', 'малафья', 'манда', 'мандавошек', 'мандавошка', 'мандавошки', 'мандей', 'мандень', 'мандеть', 'мандища', 'мандой', 'манду', 'мандюк', 'минет', 'минетчик', 'минетчица', 'млять', 'мокрощелка', 'мокрощёлка', 'мразь', 'мудak', 'мудaк', 'мудаг', 'мудак', 'муде', 'мудель', 'мудеть', 'муди', 'мудил', 'мудила', 'мудистый', 'мудня', 'мудоеб', 'мудозвон', 'мудоклюй', 'нахер', 'нахуй', 'набздел', 'набздеть', 'наговнять', 'надристать', 'надрочить', 'наебать', 'наебет', 'наебнуть', 'наебнуться', 'наебывать', 'напиздел', 'напиздели', 'напиздело', 'напиздили', 'насрать', 'настопиздить', 'нахер', 'нахрен', 'нахуй', 'нахуйник', 'неебет', 'неебёт', 'невротебучий', 'невъебенно', 'нехира', 'нехрен', 'Нехуй', 'нехуйственно', 'ниибацо', 'ниипацца', 'ниипаццо', 'ниипет', 'никуя', 'нихера', 'нихуя', 'обдристаться', 'обосранец', 'обосрать', 'обосцать', 'обосцаться', 'обсирать', 'объебос', 'обьебатьобьебос', 'однохуйственно', 'опездал', 'опизде', 'опизденивающе', 'остоебенить', 'остопиздеть', 'отмудохать', 'отпиздить', 'отпиздячить', 'отпороть', 'отъебись', 'охуевательский', 'охуевать', 'охуевающий', 'охуел', 'охуенно', 'охуеньчик', 'охуеть', 'охуительно', 'охуительный', 'охуяньчик', 'охуячивать', 'охуячить', 'очкун', 'падла', 'падонки', 'падонок', 'паскуда', 'педерас', 'педик', 'педрик', 'педрила', 'педрилло', 'педрило', 'педрилы', 'пездень', 'пездит', 'пездишь', 'пездо', 'пездят', 'пердануть', 'пердеж', 'пердение', 'пердеть', 'пердильник', 'перднуть', 'пёрднуть', 'пердун', 'пердунец', 'пердунина', 'пердунья', 'пердуха', 'пердь', 'переёбок', 'пернуть', 'пёрнуть', 'пи3д', 'пи3де', 'пи3ду', 'пиzдец', 'пидар', 'пидарaс', 'пидарас', 'пидарасы', 'пидары', 'пидор', 'пидорасы', 'пидорка', 'пидорок', 'пидоры', 'пидрас', 'пизда', 'пиздануть', 'пиздануться', 'пиздарваньчик', 'пиздато', 'пиздатое', 'пиздатый', 'пизденка', 'пизденыш', 'пиздёныш', 'пиздеть', 'пиздец', 'пиздит', 'пиздить', 'пиздиться', 'пиздишь', 'пиздища', 'пиздище', 'пиздобол', 'пиздоболы', 'пиздобратия', 'пиздоватая', 'пиздоватый', 'пиздолиз', 'пиздонутые', 'пиздорванец', 'пиздорванка', 'пиздострадатель', 'пизду', 'пиздуй', 'пиздун', 'пиздунья', 'пизды', 'пиздюга', 'пиздюк', 'пиздюлина', 'пиздюля', 'пиздят', 'пиздячить', 'писбшки', 'писька', 'писькострадатель', 'писюн', 'писюшка', 'похуй', 'похую', 'подговнять', 'подонки', 'подонок', 'подъебнуть', 'подъебнуться', 'поебать', 'поебень', 'поёбываает', 'поскуда', 'посрать', 'потаскуха', 'потаскушка', 'похер', 'похерил', 'похерила', 'похерили', 'похеру', 'похрен', 'похрену', 'похуй', 'похуист', 'похуистка', 'похую', 'придурок', 'приебаться', 'припиздень', 'припизднутый', 'припиздюлина', 'пробзделся', 'проблядь', 'проеб', 'проебанка', 'проебать', 'промандеть', 'промудеть', 'пропизделся', 'пропиздеть', 'пропиздячить', 'раздолбай', 'разхуячить', 'разъеб', 'разъеба', 'разъебай', 'разъебать', 'распиздай', 'распиздеться', 'распиздяй', 'распиздяйство', 'распроеть', 'сволота', 'сволочь', 'сговнять', 'секель', 'серун', 'серька', 'сестроеб', 'сикель', 'сила', 'сирать', 'сирывать', 'соси', 'спиздел', 'спиздеть', 'спиздил', 'спиздила', 'спиздили', 'спиздит', 'спиздить', 'срака', 'сраку', 'сраный', 'сранье', 'срать', 'срун', 'ссака', 'ссышь', 'стерва', 'страхопиздище', 'сука', 'суки', 'суходрочка', 'сучара', 'сучий', 'сучка', 'сучко', 'сучонок', 'сучье', 'сцание', 'сцать', 'сцука', 'сцуки', 'сцуконах', 'сцуль', 'сцыха', 'сцышь', 'съебаться', 'сыкун', 'трахае6', 'трахаеб', 'трахаёб', 'трахатель', 'ублюдок', 'уебать', 'уёбища', 'уебище', 'уёбище', 'уебищное', 'уёбищное', 'уебк', 'уебки', 'уёбки', 'уебок', 'уёбок', 'урюк', 'усраться', 'ушлепок', 'х_у_я_р_а', 'хyё', 'хyй', 'хyйня', 'хамло', 'хер', 'херня', 'херовато', 'херовина', 'херовый', 'хитровыебанный', 'хитрожопый', 'хуeм', 'хуе', 'хуё', 'хуевато', 'хуёвенький', 'хуевина', 'хуево', 'хуевый', 'хуёвый', 'хуек', 'хуёк', 'хуел', 'хуем', 'хуенч', 'хуеныш', 'хуенький', 'хуеплет', 'хуеплёт', 'хуепромышленник', 'хуерик', 'хуерыло', 'хуесос', 'хуесоска', 'хуета', 'хуетень', 'хуею', 'хуи', 'хуй', 'хуйком', 'хуйло', 'хуйня', 'хуйрик', 'хуище', 'хуля', 'хую', 'хуюл', 'хуя', 'хуяк', 'хуякать', 'хуякнуть', 'хуяра', 'хуясе', 'хуячить', 'целка', 'чмо', 'чмошник', 'чмырь', 'шалава', 'шалавой', 'шараёбиться', 'шлюха', 'шлюхой', 'шлюшка', 'ябывает'];
bot.hears(arr, ctx => {
  ctx.replyWithMarkdown(`*${ctx.message.from.first_name}*, не ругаемся :) - _сообщение удалено_`);
  ctx.deleteMessage();
});

bot.hears("!sql", async ctx => {
  let result = await db.query("SELECT * from users where id=?", [3]);
  bot.telegram.sendMessage(ctx.chat.id, result);
});

bot.launch();