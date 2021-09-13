const { Telegraf, session, Scenes: {WizardScene, Stage}, Context, Markup } = require("telegraf");
const {image_search, image_search_generator} = require("duckduckgo-images-api");
require('dotenv').config();
const bot = new Telegraf(process.env.TELEGRAM_TOKEN);
const axios = require('axios').default;
const { v4: uuidv4 } = require('uuid');

// MySQL
const mysql = require('mysql');
const connection = mysql.createPool({
  host      : process.env.DB_HOST,
  user      : process.env.DB_USER,
  password  : process.env.DB_PASS,
  database  : process.env.DB_NAME
});

// Scenes -----------------------------------

let langCode, userName;

// Language based answers
const localizedStrings = {
  chatTypeText:{
    'en': '[Warning] This command only for private chat. Lets talk in private - @ElectroTallinnBot :)',
    'et-ee': '[Hoiatus] See käsk on mõeldud ainult privaatseks vestluseks. Räägime privaatselt - @ElectroTallinnBot :)',
    'ru': '[Предупреждение] Эта команда только для приватного чата. Поговорим наедине - @ElectroTallinnBot :)'
  },
  titleText:{
    'en':'⚠️ Before adding a point, please make sure that the outlet is working and same point has not been previously added to the map!\n\n1️⃣ *Name*\nPlease name the place, write address, company or street name near the object.',
    'et-ee':'⚠️ Enne punkti lisamist veenduge, et pistikupesa töötab ja et sellist punkti pole kaardile varem lisatud.!\n\n1️⃣ *Nimi*\nPalun nimatage koht, kirjutage objekti lähedale aadress, ettevõtte või tänava nimi.',
    'ru':'⚠️ Перед добавлением точки убедитесь в тои, что розетка работает и такая точка уже не добавлена ранее на карту!\n\n1️⃣ *Название*\nНазовите место: Укажите адрес, компанию или улицу рядом с объектом.'
  },
  descriptionText:{
      'en':'2️⃣ *Desription*\nPlease describe place. Is it outside or inside? How to find it in place.',
      'et-ee':'2️⃣ *Kirjeldus*\nPalun kirjeldage kohta. Kas see on väljas või sees? Kuidas seda kohal leida.',
      'ru':'2️⃣ *Описание*\nОпишите место. Это снаружи или внутри? Как найти на месте.'
  },
  typeText:{
      'en':'3️⃣ *Type*\nPlease select type of place.',
      'et-ee':'3️⃣ *Tüüp*\nPalun valige koha tüüp.',
      'ru':'3️⃣ *Тип*\nПожалуйста, выберите тип места.'
  },
  typeTextOption:{
    'en': [['Charging', 'Repair','Water', 'Air'],['Exit']],
    'et-ee': [['Laadimine', 'Remont','Vesi', 'Õhk'],['Exit']],
    'ru': [['Зарядка', 'Ремонт','Вода', 'Воздух'],['Exit']]
  },
  coordsText:{
    'en': '4️⃣ *Location*\nPlease select your current location or use marker for custom location.',
    'et-ee': '4️⃣ *Asukoht*\nPalun valige oma praegune asukoht või kasutage kohandatud asukoha jaoks markerit.',
    'ru': '4️⃣ *Место расположения*\nДля текущей позиции - нажмите на кнопу либо поставьте точку(локацию) на карте через "скрепку"'
  },
  coordsBtnText:{
    'en': 'My current location.',
    'et-ee': 'Minu praegune asukoht.',
    'ru': 'Мое текущее местоположение.'
  },
  photoText:{
    'en': '5️⃣ *Photo*\nPlease take a picture of the objec in landscape mode.',
    'et-ee': '5️⃣ *Foto*\nPalun pildistage objekt maastikurežiimis.',
    'ru': '5️⃣ *Фото*\nПожалуйста, сделайте фото объекта в ландшафтном режиме или загрузите из библиотеки телефона.'
  },
  finalText:{
    'en': '👍 <b>Thank you</b> 👍 Location will be approved in 24h and added to the <a href="https://electrotallinn.ee/map/">map</a>.',
    'et-ee': '👍 <b>Täname</b> 👍 Asukoht kinnitatakse 24 tunni jooksul ja lisatakse <a href="https://electrotallinn.ee/map/">kaardile</a>.',
    'ru': '👍 <b>Спасибо</b> 👍 Местоположение будет одобрено в течение 24 часов и добавлено на <a href="https://electrotallinn.ee/map/">карту</a>.'
  }
}

// Markup elements
const exit_keyboard = Markup.keyboard(['Exit']).resize().oneTime();

const remove_keyboard = Markup.removeKeyboard();
const coords = Markup.keyboard([[{text: 'My current location.', request_location: true}],['Exit']]).resize().oneTime();
/*const coords = {
  reply_markup: JSON.stringify({
    keyboard: [
      [{text: 'Location', request_location: true}],
      [{text: 'Exit'}],
    ],
    resize_keyboard: true,
    one_time_keyboard: true,
  }),
};*/

//const type = Markup.keyboard([[{text:'Charging',callback_data: 'CHARGE'}, 'Repair', 'Water', 'Air'],['Exit']]).resize().oneTime();
const type = {
  reply_markup: JSON.stringify({
    inline_keyboard: [
      [{text:"⚡ [Charging]", callback_data: "CHARGE"}],
      [{text:"🛠️ [Repair]", callback_data: "REPAIR"}],
      [{text:"💦 [Water]", callback_data: "WATER"}],
      [{text:"💨 [Air]", callback_data: "AIR"}]
  ],
    resize_keyboard: true,
    one_time_keyboard: true,
  }),
};

// Steps
const titleHandler = Telegraf.on('text', async ctx => {
  console.log("T1: "+ctx.message.text+" by USER: "+userName);
  ctx.scene.state.title = ctx.message.text;
  await ctx.replyWithMarkdown(localizedStrings['descriptionText'][langCode], exit_keyboard);
  return ctx.wizard.next();

});

const descriptionHandler = Telegraf.on('text', async ctx => {
  console.log("T2: "+ctx.message.text+" by USER: "+userName);
  ctx.scene.state.description = ctx.message.text;
  await ctx.replyWithMarkdown(localizedStrings['typeText'][langCode], type);
  return ctx.wizard.next();

});

const typeHandler = Telegraf.on("callback_query", async data =>  {
  console.log("TYPE: "+data.update.callback_query.data+" by USER: "+userName);
  data.scene.state.type = data.update.callback_query.data;
  await data.replyWithMarkdown (localizedStrings['coordsText'][langCode], coords);
  return data.wizard.next();

});

const coordsHandler = Telegraf.on('location', async ctx => {
  console.log("POS: "+ctx.message.location.latitude+','+ctx.message.location.longitude+" by USER: "+userName);
  ctx.scene.state.lat = ctx.message.location.latitude;
  ctx.scene.state.lng = ctx.message.location.longitude;
  await ctx.replyWithMarkdown(localizedStrings['photoText'][langCode], exit_keyboard);
  return ctx.wizard.next();

});

const imageHandler = Telegraf.on('photo', async ctx => {

  // Get Image
  const getUrl = await ctx.telegram.getFileLink( ctx.message.photo[2].file_id );
  const imgUrl = getUrl.href;
  console.log("IMG URL: "+imgUrl+" by USER: "+userName);

  const response = await axios.get(imgUrl,  { responseType: 'arraybuffer' })
  const buffer = Buffer.from(response.data, 'binary');

  //console.log(file);
  //ctx.replyWithPhoto( {source: Buffer.from(buffer, 'base64')} )
  
  // MySQL 
  connection.getConnection(function(err, c) {
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
      //image: fs.readFileSync("./images/1a.jpg"),
      image: buffer,
      image_name: uuidv4()+'.jpg',
      type: ctx.scene.state.type,
      user_first_name: ctx.message.chat.first_name,
      user_uin: ctx.message.from.id,
      status: 'NEW'
    };
		c.query('INSERT INTO locations SET ?', fields, function(error,result) {
      console.log(result);
      //console.log(error);
			c.release();
    });
  });

  await ctx.replyWithHTML(localizedStrings['finalText'][langCode], remove_keyboard);
  await bot.telegram.sendMessage(371176498, `*DONE:*\n${userName} отправил точку, ${ctx.scene.state.title}, ${ctx.scene.state.description}. Язык [ ${langCode} ]`, {parse_mode: "Markdown"});
  console.log(">>> DONE by USER: "+userName);

  return ctx.scene.leave();

});

const infoScene = new WizardScene('infoScene', titleHandler, descriptionHandler, typeHandler, coordsHandler, imageHandler);
infoScene.enter(ctx => ctx.replyWithMarkdown(localizedStrings['titleText'][langCode], exit_keyboard ));

const stage = new Stage([ infoScene ]);
stage.hears('Exit', ctx => ctx.scene.leave());
//bot.action('exit', ctx => ctx.scene.leave());

bot.use(session(), stage.middleware());

// General
bot.start((ctx) => ctx.reply("Welcome"));
//bot.on("sticker", (ctx) => ctx.reply("👍"));

// New member
bot.on("new_chat_members", (ctx) => {
  bot.telegram.sendMessage(ctx.chat.id, `*Welcome / Добро пожаловать, ${ctx.message.new_chat_member.first_name}!*`, {disable_web_page_preview: true, parse_mode: "Markdown",disable_notification: true});
  bot.telegram.sendMessage(ctx.chat.id, `⚠️ <a href="https://t.me/electrotallinn_alerts/7">Ознакомься</a> с устройством группы в Телеграме! ⚠️ \n⚠️ <a href="https://t.me/electrotallinn_alerts/7">Please read</a> group information in Telegram! ⚠️`, {disable_web_page_preview: true, parse_mode: "HTML",disable_notification: true});
  bot.telegram.sendMessage(ctx.chat.id, "Commands for Bot:\n\n */help* - _List of commands_\n */social* - _ElectroTallinn social media links_\n */ali* - _Aliexpress links_\n */map* - _Charging sockets map_\n */pic* <name> - _Search for image_\n ", {disable_web_page_preview: true,parse_mode: "Markdown",disable_notification: true}).then(({message_id}) => {setTimeout(() => {ctx.deleteMessage(message_id)}, 60000)});
  ctx.replyWithSticker('CAACAgQAAxkBAAEKmPJgtu1nXdo4zdB0lKLHAAFzcsmOyl8AAj8KAAJrfPFTmXeoVb1qy_cfBA');
});

// commands
bot.command("/add", async ctx => {
  userName = ctx.update.message.chat.first_name;
  console.log(">>> STARTED by USER: "+userName);
  if (ctx.message.chat.type != 'private') {
    bot.telegram.sendMessage(ctx.chat.id,localizedStrings['chatTypeText'][langCode]);
  } else {
    ctx.scene.leave();
    ctx.scene.enter('infoScene');
    setLang(ctx);
  }
  bot.telegram.sendMessage(371176498, `*STARTED:*\nНачал, [ ${userName} ], язык [ ${langCode} ]`, {parse_mode: "Markdown"});
});

function setLang(ctx) {
  const userLang = ctx.update.message.from.language_code;
  if (userLang == "ru" || userLang == "et-ee") {
    langCode = ctx.message.from.language_code;
  } else {
    langCode = "en";
  }
  console.log("LANG: "+langCode+" by USER: "+userName);
}

bot.command("/help", ctx => {
  bot.telegram.sendMessage(ctx.chat.id, "Commands for Bot:\n\n */help* - _List of commands_\n */social* - _ElectroTallinn social media links_\n */ali* - _Aliexpress links_\n */map* - _Charging sockets map_\n */pic* <name> - _Search for image_\n", {disable_web_page_preview: true,parse_mode: "Markdown",disable_notification: true});
});

bot.command(["event", "events", "info"], (ctx) => ctx.reply("@electrotallinn_alerts \n**ElectroTallinn Alerts Channel** \nEvents, News, Important Info"));
bot.command("facebook", (ctx) => ctx.reply("https://www.facebook.com/groups/electrotallinn \nEvents, Videos, Photos, Chat, News"));
bot.command("instagram", (ctx) => ctx.reply("https://www.facebook.com/groups/electrotallinn \nEvents, Videos, Photos, Chat, News"));

bot.command("/pic", (ctx) => {
  const request = ctx.message.text;
  let search;
  if (request.split(" ").length > 1) {
    search = request.substr(request.indexOf(" ") + 1);
  } else {
    search = "random image";
  }
  //console.log("SEARCH:"+search);
  
  function print(results) {
    //console.log("RESULTS:"+results);
    if (results != '') {
      let rndImg = results[Math.floor(Math.random() * results.length)];
      //console.log(rndImg.image);

      // pipe url content
      ctx.replyWithPhoto({ url: rndImg.image }, { caption: search });
    } else {
      bot.telegram.sendMessage(ctx.chat.id, "Not found..");
    }
  }
  
  image_search({ query:search, moderate:true, iterations: 1, retries: 1 }).then(results=>print(results));

});

bot.command("/ali", ctx => {
  bot.telegram.sendMessage(ctx.chat.id, "*Aliexpress links:* _https://bit.ly/2DVyl1d_", {disable_web_page_preview: true, parse_mode: "Markdown", disable_notification: true});
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
                { text: "📍 Map", url: 'https://electrotallinn.ee/map' },
                { text: "🏆 Top Ranks", url: 'https://electrotallinn.ee/map/#/top' },
                { text: "ℹ️ Help", url: 'https://electrotallinn.ee/map/#/help' },
              ],
          ]
      }
  })
});

bot.command("/say", ctx => {
  const tell = ctx.message.text;
  const say = tell.substr(tell.indexOf(" ") + 1);
  ctx.deleteMessage();
  bot.telegram.sendMessage(ctx.chat.id, `${say}`, {disable_web_page_preview: true,parse_mode: "Markdown"});
});

bot.command("/social", ctx => {
  //console.log(ctx.from)
  let botMessage = "ET⚡️ *ElectroTallinn* in social media:";
  //ctx.deleteMessage();
  bot.telegram.sendMessage(ctx.chat.id, botMessage, {
      disable_notification: true,
      parse_mode: "Markdown",
      reply_markup: {
          inline_keyboard: [
              [
                { text: "⚡️ Facebook", callback_data: "facebook", url: 'https://www.facebook.com/groups/electrotallinn' },
                { text: "⚡️Instagram", callback_data: "instagram", url: 'https://www.instagram.com/electrotallinn' },
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

bot.action("social", ctx => {
  bot.telegram.sendMessage(ctx.chat.id, "*FACEBOOK:* _https://www.facebook.com/groups/electrotallinn_", {disable_web_page_preview: true,parse_mode: "Markdown",disable_notification: true}).then(({message_id}) => {setTimeout(() => {ctx.deleteMessage(message_id)}, 15000)});
});

bot.action("facebook", ctx => {
  bot.telegram.sendMessage(ctx.chat.id, "*FACEBOOK:* _https://www.facebook.com/groups/electrotallinn_", {disable_web_page_preview: true,parse_mode: "Markdown",disable_notification: true}).then(({message_id}) => {setTimeout(() => {ctx.deleteMessage(message_id)}, 15000)});
});


bot.command("/t", ctx => {

  const opts = {
    reply_markup: JSON.stringify({
      keyboard: [
        [{text: 'Location', request_location: true}],
        [{text: 'Contact', request_contact: true}],
        [{ text: "⚡️ Reddit", callback_data: "dfsghhgfd" }],
      ],
      resize_keyboard: true,
      one_time_keyboard: true,
    }),
  };
  bot.telegram.sendMessage(ctx.chat.id, 'aaa <a href="https://electrotallinn.ee/map/">карту</a>', {
    disable_web_page_preview: true,
    parse_mode: "HTML",
    reply_markup: {
      force_reply: true
    }
  }).then(payload => {
    const replyListenerId = bot.onReplyToMessage(payload.chat.id, payload.message_id, msg => {
        bot.removeReplyListener(replyListenerId)
        console.log(msg) // here's the reply which is I think what you want
    })
  })

  console.log(ctx);
  console.log(ctx.update);

  bot.telegram.sendMessage(ctx.chat.id, 'Contact and Location request', opts);

});

// Hears
bot.hears(["Привет", "привет", "хай", "Хай", "Yo", "Здарова", "здарова", "прив", "Прив", "Здрасте", "здрасте"], (ctx) => ctx.reply("Привет!", {disable_notification: true}));
bot.hears(["mod", "repair", "service", "problem", "tuning"], (ctx) => ctx.reply("@electrotallinn_service - ElectroTallinn Service Group \nTech help, Mods, Tuning, Repair, Service", {disable_notification: true}));
bot.hears(["проблема", "починить", "замена", "тюнинг", "сервис", "тех", "акум", "сервис"], (ctx) => ctx.reply("@electrotallinn_service - ElectroTallinn Мастерская \nРешение проблем, Сервис, Тюнинг, Запчасти", {disable_notification: true}));
bot.hears("hi", (ctx) => ctx.reply("*Hey* there", {disable_web_page_preview: true,parse_mode: "Markdown",disable_notification: true}));
bot.hears("map", (ctx) => ctx.replyWithHTML("<a href='https://www.google.com/maps/d/u/0/edit?mid=1SIuEYU3bxlq76mncjtR5yspMl8Q0s45L&z=9'>Map</a>", {disable_web_page_preview: true,disable_notification: true}));
// Filters
let arr = ['6ля','6лядь','6лять','b3ъeб','cock','cunt','e6aль','ebal','eblan','eбaл','eбaть','eбyч','eбать','eбёт','eблантий','fuck','fucker','fucking','xyёв','xyй','xyя','xуе','xуй','xую','zaeb','zaebal','zaebali','zaebat','архипиздрит','ахуел','ахуеть','бздение','бздеть','бздех','бздецы','бздит','бздицы','бздло','бзднуть','бздун','бздунья','бздюха','бздюшка','бздюшко','бля','блябу','блябуду','бляд','бляди','блядина','блядище','блядки','блядовать','блядство','блядун','блядуны','блядунья','блядь','блядюга','блять','вафел','вафлёр','взъебка','взьебка','взьебывать','въеб','въебался','въебенн','въебусь','въебывать','выблядок','выблядыш','выеб','выебать','выебен','выебнулся','выебон','выебываться','выпердеть','высраться','выссаться','вьебен','гавно','гавнюк','гавнючка','гамно','гандон','гнид','гнида','гниды','говенка','говенный','говешка','говназия','говнецо','говнище','говно','говноед','говнолинк','говночист','говнюк','говнюха','говнядина','говняк','говняный','говнять','гондон','доебываться','долбоеб','долбоёб','долбоящер','дрисня','дрист','дристануть','дристать','дристун','дристуха','дрочелло','дрочена','дрочила','дрочилка','дрочистый','дрочить','дрочка','дрочун','е6ал','е6ут','ебтвоюмать','ёбтвоюмать','ёбaн','ебaть','ебyч','ебал','ебало','ебальник','ебан','ебанамать','ебанат','ебаная','ёбаная','ебанический','ебанный','ебанныйврот','ебаное','ебануть','ебануться','ёбаную','ебаный','ебанько','ебарь','ебат','ёбат','ебатория','ебать','ебать-копать','ебаться','ебашить','ебёна','ебет','ебёт','ебец','ебик','ебин','ебись','ебическая','ебки','ебла','еблан','ебливый','еблище','ебло','еблыст','ебля','ёбн','ебнуть','ебнуться','ебня','ебошить','ебская','ебский','ебтвоюмать','ебун','ебут','ебуч','ебуче','ебучее','ебучий','ебучим','ебущ','ебырь','елда','елдак','елдачить','жопа','жопу','заговнять','задрачивать','задристать','задрота','зае6','заё6','заеб','заёб','заеба','заебал','заебанец','заебастая','заебастый','заебать','заебаться','заебашить','заебистое','заёбистое','заебистые','заёбистые','заебистый','заёбистый','заебись','заебошить','заебываться','залуп','залупа','залупаться','залупить','залупиться','замудохаться','запиздячить','засерать','засерун','засеря','засирать','засрун','захуячить','заябестая','злоеб','злоебучая','злоебучее','злоебучий','ибанамат','ибонех','изговнять','изговняться','изъебнуться','ипать','ипаться','ипаццо','Какдвапальцаобоссать','конча','курва','курвятник','лох','лошарa','лошара','лошары','лошок','лярва','малафья','манда','мандавошек','мандавошка','мандавошки','мандей','мандень','мандеть','мандища','мандой','манду','мандюк','минет','минетчик','минетчица','млять','мокрощелка','мокрощёлка','мразь','мудak','мудaк','мудаг','мудак','муде','мудель','мудеть','муди','мудил','мудила','мудистый','мудня','мудоеб','мудозвон','мудоклюй','нахер','нахуй','набздел','набздеть','наговнять','надристать','надрочить','наебать','наебет','наебнуть','наебнуться','наебывать','напиздел','напиздели','напиздело','напиздили','насрать','настопиздить','нахер','нахрен','нахуй','нахуйник','неебет','неебёт','невротебучий','невъебенно','нехира','нехрен','Нехуй','нехуйственно','ниибацо','ниипацца','ниипаццо','ниипет','никуя','нихера','нихуя','обдристаться','обосранец','обосрать','обосцать','обосцаться','обсирать','объебос','обьебатьобьебос','однохуйственно','опездал','опизде','опизденивающе','остоебенить','остопиздеть','отмудохать','отпиздить','отпиздячить','отпороть','отъебись','охуевательский','охуевать','охуевающий','охуел','охуенно','охуеньчик','охуеть','охуительно','охуительный','охуяньчик','охуячивать','охуячить','очкун','падла','падонки','падонок','паскуда','педерас','педик','педрик','педрила','педрилло','педрило','педрилы','пездень','пездит','пездишь','пездо','пездят','пердануть','пердеж','пердение','пердеть','пердильник','перднуть','пёрднуть','пердун','пердунец','пердунина','пердунья','пердуха','пердь','переёбок','пернуть','пёрнуть','пи3д','пи3де','пи3ду','пиzдец','пидар','пидарaс','пидарас','пидарасы','пидары','пидор','пидорасы','пидорка','пидорок','пидоры','пидрас','пизда','пиздануть','пиздануться','пиздарваньчик','пиздато','пиздатое','пиздатый','пизденка','пизденыш','пиздёныш','пиздеть','пиздец','пиздит','пиздить','пиздиться','пиздишь','пиздища','пиздище','пиздобол','пиздоболы','пиздобратия','пиздоватая','пиздоватый','пиздолиз','пиздонутые','пиздорванец','пиздорванка','пиздострадатель','пизду','пиздуй','пиздун','пиздунья','пизды','пиздюга','пиздюк','пиздюлина','пиздюля','пиздят','пиздячить','писбшки','писька','писькострадатель','писюн','писюшка','похуй','похую','подговнять','подонки','подонок','подъебнуть','подъебнуться','поебать','поебень','поёбываает','поскуда','посрать','потаскуха','потаскушка','похер','похерил','похерила','похерили','похеру','похрен','похрену','похуй','похуист','похуистка','похую','придурок','приебаться','припиздень','припизднутый','припиздюлина','пробзделся','проблядь','проеб','проебанка','проебать','промандеть','промудеть','пропизделся','пропиздеть','пропиздячить','раздолбай','разхуячить','разъеб','разъеба','разъебай','разъебать','распиздай','распиздеться','распиздяй','распиздяйство','распроеть','сволота','сволочь','сговнять','секель','серун','серька','сестроеб','сикель','сила','сирать','сирывать','соси','спиздел','спиздеть','спиздил','спиздила','спиздили','спиздит','спиздить','срака','сраку','сраный','сранье','срать','срун','ссака','ссышь','стерва','страхопиздище','сука','суки','суходрочка','сучара','сучий','сучка','сучко','сучонок','сучье','сцание','сцать','сцука','сцуки','сцуконах','сцуль','сцыха','сцышь','съебаться','сыкун','трахае6','трахаеб','трахаёб','трахатель','ублюдок','уебать','уёбища','уебище','уёбище','уебищное','уёбищное','уебк','уебки','уёбки','уебок','уёбок','урюк','усраться','ушлепок','х_у_я_р_а','хyё','хyй','хyйня','хамло','хер','херня','херовато','херовина','херовый','хитровыебанный','хитрожопый','хуeм','хуе','хуё','хуевато','хуёвенький','хуевина','хуево','хуевый','хуёвый','хуек','хуёк','хуел','хуем','хуенч','хуеныш','хуенький','хуеплет','хуеплёт','хуепромышленник','хуерик','хуерыло','хуесос','хуесоска','хуета','хуетень','хуею','хуи','хуй','хуйком','хуйло','хуйня','хуйрик','хуище','хуля','хую','хуюл','хуя','хуяк','хуякать','хуякнуть','хуяра','хуясе','хуячить','целка','чмо','чмошник','чмырь','шалава','шалавой','шараёбиться','шлюха','шлюхой','шлюшка','ябывает'];
bot.hears(arr, ctx => {
  ctx.replyWithMarkdown( `*${ctx.message.from.first_name}*, не ругаемся :) - _сообщение удалено_`);
  ctx.deleteMessage();
});

//${ctx.message.chat.first_name},
bot.launch();

