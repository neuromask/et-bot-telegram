const OpenWeatherAPI = require("openweather-api-node")

let weather = new OpenWeatherAPI({
    key: process.env.OWM,
    locationName: "Tallinn",
    units: "metric"
})

module.exports = {
    init: bot => {
        
        bot.command(["/weather", "/pogoda"], ctx => {

            console.log("REQUEST WEATHER - LANG: " + ctx.message.from.language_code + " by USER: " + ctx.message.from.first_name);

            // language
            ctx.scene.state.locale = ctx.message.from.language_code;
            if(ctx.scene.state.locale != 'en' && ctx.scene.state.locale != 'ru') ctx.scene.state.locale = 'en'
            weather.setLanguage(ctx.scene.state.locale);

            weather.getCurrent().then(async data => {
                let temp = -16
                let feels = Math.round(data.weather.feels_like.cur)
                let answer = `ET⚡️ *Weather*\n\n`
                answer += `• ${translate('weather.descriptionText', ctx)} *${data.weather.description}*\n`
                answer += `• ${translate('weather.tempText', ctx)} *${temp}\u00B0С*\n`
                answer += `• ${translate('weather.feelsText', ctx)} *${feels}\u00B0С*\n\n`
                if (temp < -15) answer += `${translate('weather.m15', ctx)}`
                else if (temp < -10) answer += `${translate('weather.m10', ctx)}`
                else if (temp < -5) answer += `${translate('weather.m5', ctx)}`
                else if (temp < 0) answer += `${translate('weather.m0', ctx)}`
                else if (temp >= 0) answer += `${translate('weather.0', ctx)}`
                else if (temp > 5) answer += `${translate('weather.5', ctx)}`
                else if (temp > 10) answer += `${translate('weather.10', ctx)}`
                else if (temp > 15) answer += `${translate('weather.15', ctx)}`
                else if (temp > 20) answer += `${translate('weather.20', ctx)}`
                else if (temp > 25) answer += `${translate('weather.25', ctx)}`
                bot.telegram.sendMessage(ctx.chat.id, answer, { parse_mode: "Markdown" });
                //ctx.replyWithPhoto({ url: `http://openweathermap.org/img/wn/${data.weather.icon.raw}@4x.png`}, { caption: data.weather.description });
                
            })
            
        });

    }
}