const utils = require("../utils/Utils.js");
const axios = require('axios').default;

module.exports = {
    init: bot => {
        
        bot.on('location', async ctx => {
            if (ctx.message.chat.type == 'private') {
                // get info
                ctx.scene.state.locale = ctx.message.from.language_code;
                console.log("POS: " + ctx.message.location.latitude + ',' + ctx.message.location.longitude + " by USER: " + ctx.message.from.first_name);
                ctx.scene.state.lat = ctx.message.location.latitude;
                ctx.scene.state.lng = ctx.message.location.longitude;
                
                let response = await axios.get(`${utils.getApiBaseUrl()}/locations/nearest?lat=${ctx.scene.state.lat}&lng=${ctx.scene.state.lng}`);
                await ctx.replyWithMarkdown(`${translate('nearest.nearestPoint', ctx)}*${translate('nearest.distance', ctx)} ${response.data.distance} ${translate('nearest.km', ctx)}*\n${response.data.title}\n${response.data.description}`)
                await ctx.replyWithLocation(response.data.lat, response.data.lng)
                await ctx.replyWithPhoto(`${utils.getApiBaseUrl()}/locations/image/${response.data.imageName}`);
            }
            
        });

    }
}