const { Telegraf, session, Scenes: { WizardScene, Stage }, Composer, Context, Markup } = require("telegraf");
const bot = new Telegraf(process.env.TELEGRAM_TOKEN);


const stepHandler = new Composer()
stepHandler.action('next', async (ctx) => {
  ctx.scene.session.myWizardSessionProp = Math.floor(10 * Math.random())
  await ctx.reply('Step 2. Via inline button')
  return ctx.wizard.next()
})
stepHandler.command('next', async (ctx) => {
  ctx.scene.session.myWizardSessionProp = Math.floor(10 * Math.random()) + 10
  await ctx.reply('Step 2. Via command')
  return ctx.wizard.next()
})
stepHandler.use((ctx) =>
  ctx.replyWithMarkdown('Press `Next` button or type /next')
)

const superWizard = new Scenes.WizardScene(
  'super-wizard',
  async (ctx) => {
    await ctx.reply(
      'Step 1',
      Markup.inlineKeyboard([
        Markup.button.url('❤️', 'http://telegraf.js.org'),
        Markup.button.callback('➡️ Next', 'next'),
      ])
    )
    return ctx.wizard.next()
  },
  stepHandler,
  async (ctx) => {
    // we now have access to the the fields defined above
    const responseText = [
      `[${ctx.myContextProp}] Step 3.`,
      `Your random myWizardSessionProp is ${ctx.scene.session.myWizardSessionProp}`,
    ].join('\n')
    await ctx.reply(responseText)
    return ctx.wizard.next()
  },
  async (ctx) => {
    await ctx.reply('Step 4')
    return ctx.wizard.next()
  },
  async (ctx) => {
    await ctx.reply('Done')
    return await ctx.scene.leave()
  }
)

const bot = new Telegraf(token)
const stage = new Scenes.Stage([superWizard])
//superWizard.enter(ctx => ctx.replyWithMarkdown('entered'))



bot.use(session())

bot.use(stage.middleware())

// commands
bot.command("/add", async ctx => {
  console.log(ctx)
    ctx.scene.enter('super-wizard');
});


bot.launch()
