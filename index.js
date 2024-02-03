const fs = require('hexo-fs');
const path = require('path');
const log = require('hexo-log')({
    debug: false,
    silent: false
});
const axios = require('axios-https-proxy-fix');
const cheerio = require('cheerio');

const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay))


let options = {
    options: [
        { name: '-u, --update', desc: 'Update steam games data' },
        { name: '-d, --delete', desc: 'Delete steam games data' }
    ]
};

hexo.extend.generator.register('steamgames', function (locals) {
    if (!this.config.steam || !this.config.steam.enable) {
        return;
    }
    return require('./lib/steam-games-generator').call(this, locals);
});
hexo.extend.console.register('steam', 'Update steam games data', options, async function (args) {
    if (args.d) {
        source_dir = __dirname.split("\\").slice(0, -2).join("/");

        if (fs.existsSync(path.join(source_dir, `source/_data/steam/`))) {
            fs.rmdirSync(path.join(source_dir, `source/_data/steam/`));
            log.info('Steam games data has been deleted');
        }
    } else if (args.u) {
        if (!this.config.steam || !this.config.steam.enable) {
            log.info("Please add config to _config.yml");
            return;
        }
        if (!this.config.steam.steamId && !this.config.steam.steamInfos) {
            log.info("Please add steamId/steamInfos to _config.yml");
            return;
        }
        if (!this.config.steam.apiKey) {
            log.info("Please add apiKey to _config.yml");
            return;
        }

        let games = [];
        let appid_list = [];
        source_dir = __dirname.split("\\").slice(0, -2).join("/"); //获取blog根目录

        if (this.config.steam.steamId) {
            updateSteamGames(this.config.steam.steamId, this.config.steam.apiKey, this.config.steam.tab, this.config.steam.length, this.config.steam.proxy, this.config.steam.freeGames);
            games = games.concat(JSON.parse(fs.readFileSync(path.resolve(source_dir, `source/_data/steam/${this.config.steam.steamId}.json`))));
        } else if (this.config.steam.steamInfos) {
            this.config.steam.steamInfos.forEach(steamInfo => {
                updateSteamGames(steamInfo.id, this.config.steam.apiKey, steamInfo.tab || this.config.steam.tab, steamInfo.length || this.config.steam.length, steamInfo.proxy || this.config.steam.proxy, steamInfo.freeGames || this.config.steam.freeGames);
            });
            await sleep(3000);
            // this.config.steam.steamInfos.forEach(steamInfo => {
            //     games = games.concat(JSON.parse(fs.readFileSync(path.resolve(source_dir, `source/_data/steam/${steamInfo.id}.json`))));
            // });
            exclude_games = JSON.parse(fs.readFileSync(path.resolve(source_dir, `source/_data/extra_steam.json`)));

            this.config.steam.steamInfos.forEach(steamInfo => {
                new_games = JSON.parse(fs.readFileSync(path.resolve(source_dir, `source/_data/steam/${steamInfo.id}.json`)));
                new_games.forEach(game => {
                    if (appid_list.includes(game.appid)) {
                        games.forEach(g => {
                            if (g.appid == game.appid) {
                                g.playtime_forever += game.playtime_forever;
                            }
                        });
                    } else {
                        games.push(game);
                        appid_list.push(game.appid);
                    }
                });
            });
        };
        exclude_games.forEach(info => {
            games = games.filter(item => {
                return item.appid != info.appid;
            })
        })
        games.sort(function (first, second) {
            return second.playtime_forever - first.playtime_forever;
        });
        fs.writeFile(path.join(source_dir, `source/_data/steam.json`), JSON.stringify(games), err => {
            if (err) {
                log.info(`Failed to write data to steam.json`);
                console.log(err);
            } else {
                log.info(`${games.length} games data are saved.`);
            }
        });
    } else {
        console.error("Unknown command, please use \"hexo steam -h\" to see the available commands")
    };
});

function updateSteamGames(steamId, apiKey, tab = "recent", length = 1000, proxy = false, freeGames = false) {
    if (fs.existsSync(path.join(source_dir, `source/_data/steam/`))) {
        fs.rmdirSync(path.join(source_dir, `source/_data/steam/`));
    }
    let options = {
        method: "GET",
        url: `http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${apiKey}&steamid=${steamId}&format=json&include_appinfo=true${freeGames ? '&include_played_free_games=true' : ''}`,
        timeout: 30 * 60 * 1000,
        responseType: "json",
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.87 Safari/537.36"
        }
    };
    if (proxy && proxy.host && proxy.port) {
        options.proxy = {
            host: proxy.host,
            port: proxy.port
        };
    }
    axios(options).then(response => {
        if (response.status === 200) {
            const games = response.data.response.games;
            if (games.length === 0) {
                log.error('No game data obtained.')
                return;
            }
            if (!fs.existsSync(path.join(source_dir, `source/_data/steam/`))) {
                fs.mkdirsSync(path.join(source_dir, `source/_data/steam/`));
            }
            let gameData = games.slice(0, length);

            fs.writeFile(path.join(source_dir, `source/_data/steam/${steamId}.json`), JSON.stringify(gameData), err => {
                if (err) {
                    log.info(`Failed to write data to ${steamId}.json`);
                    console.log(err);
                } else {
                    log.info(`${gameData.length} games(${steamId}) data are saved.`);
                }
            });
        } else {
            console.error('ERROR: ' + response.status)
        }
    }).catch(error => {
        console.log(error);
    });
}
