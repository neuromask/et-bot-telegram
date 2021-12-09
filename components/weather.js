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
                answer += `Температура сейчас примерно *${temp}\u00B0С*\n\n`
                if (temp < -10) answer += "🥶 _Лютый мороз, накинь пару шуб!_ 🥶"
                else if (temp < -5) answer += "😱 _Жесть как холодно, одевайся как танк!_ 😱"
                else if (temp < 0) answer += "😨 _Очень холодно, одевайся тепло!_ 😨"
                else if (temp < 5) answer += "😬 _Холодно, одевайся потеплее!_ 😬"
                else if (temp < 10) answer += "😶‍🌫️ _Прохладно, одевайся средне._ 😶‍🌫️"
                else if (temp < 15) answer += "😉 _Номрмально, можно не укутываться_ 😉"
                else if (temp < 20) answer += "🤗 _Почти лето, гуляем_ 🤗"
                else if (temp >= 20) answer += "🤪 _Лето, минимум одежды, ура_ 🤪"
                else if (temp > 25) answer += "🥵 _Жара, можно без одежды_ 🥵"
                ctx.replyWithMarkdown(answer);
            })
            
        });

    }
}