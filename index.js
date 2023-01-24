const colors = require('colors')
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const consolePrefix = `${'['.blue}${'dbd-soft-ui'.yellow}${']'.blue} `

module.exports.register = async function (manager, data) {
    if (manager === undefined) return console.log(consolePrefix + "Shard manager has not been specified!");
    if (data === undefined || data.hasOwnProperty("key") === false || data.hasOwnProperty("dashboard_url") === false) return console.log(consolePrefix + "The endpoint information has not been entered!");

    console.log(consolePrefix + "Shard collector " + colors.brightGreen("ACTIVE"))

    async function submitstats() {

        let guilds = await manager.broadcastEval((c) => c.guilds.cache.size);
        let users = await manager.broadcastEval((c) => c.guilds.cache.map((guild) => guild.members.cache.size));
        let channels = await manager.broadcastEval((c) => c.guilds.cache.map((guild) => guild.channels.cache.size));
        let ping = await manager.broadcastEval((c) => c.ws.ping);

        let list = []

        for (const shard in guilds) {
            let guildc = guilds[shard]
            let userc = users[shard].reduce((p, n) => p + n, 0)
            let channelc = channels[shard].reduce((p, n) => p + n, 0)
            let pingc = ping[shard]

            if (pingc === -1) continue;

            list.push({
                id: shard,
                ping: pingc,
                guilds: guildc,
                channels: channelc,
                users: userc,
                interval: data.interval * 1000 || 15000
            })
        }

        await fetch(data.dashboard_url + "/stats/shards/update", {
            method: "post",
            body: JSON.stringify(list),
            headers: { "Content-Type": "application/json", "Authorization": "Bearer " + data.key }
        }).catch(err => console.log(err))

    }
    setInterval(submitstats, data.interval * 1000 || 15000)
}