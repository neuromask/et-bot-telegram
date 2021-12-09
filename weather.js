const OpenWeatherAPI = require("openweather-api-node")

let weather = new OpenWeatherAPI({
    key: process.env.OWM,
    locationName: "Tallinn",
    units: "metric"
})

module.exports = {
    init: bot => {
        
        bot.command("/pogoda", ctx => {
            weather.setLanguage("ru")
            weather.getCurrent().then(data => {
                let temp = Math.round(data.weather.temp.cur)
                let answer = `ET⚡️ *Weather*\nВ Таллинне *${data.weather.description}*\n`
                answer += `Температура сейчас примерно *${temp}\u00B0С*\n`
                if (temp < -10) answer += "Лютый мороз, накинь пару шуб!"
                else if (temp < -5) answer += "Жесть как холодно, одевайся как танк!"
                else if (temp < 0) answer += "Очень холодно, одевайся тепло!"
                else if (temp < 5) answer += "Холодно, одевайся потеплее!"
                else if (temp < 10) answer += "Прохладно, одевайся средне."
                else if (temp < 15) answer += "Номрмально, можно не укутываться ;)"
                else if (temp < 20) answer += "Почти лето, гуляем ;)"
                else if (temp >= 20) answer += "Лето, минимум одежды, ура ;)"
                else if (temp > 25) answer += "Жара, можно без одежды ;)"
                ctx.replyWithMarkdown(answer);
            })
            
        });

    }
}