ps2 role sync is a discord bot used to aid in the administration of planetside 2 outfits who use discord to manage their players.
Coded for [No Fear](https://ps2.nofearoutfit.org/) (connery NC) by [silverlily](https://github.com/silvenlily/) but useable by anyone.

Features:  
automaticly detects when a discord users nickname doesn't match with a ingame name in the outfit and applies a role as specified in the config. (*ING Doesn't Match* for example)  
automaticly detects when a discord users roles dont match with their ps2 rank and applies a role as specified in the config. (*rank update* for example)   


original repo: https://github.com/silvenlily/ps2PlayerManager

getting started: (ubuntu terminal)  
**[git](https://github.com/git-guides/install-git) & [npm](https://www.npmjs.com/get-npm) are required to install using this guide.**

1. clone the repo using "`sudo git clone https://github.com/silvenlily/ps2PlayerManager`"
2. move into the directory this created
3. install the depencenies using "`sudo npm install`"
4. run the bot using "`node .\ps2-player-manager.js`" the first time you do this the bot will generate config & tokens files for you.
5. place your tokens into /config/tokens.json & modifiy config values as needed.
6. if not using pm2 run the bot using "`node .\ps2-player-manager.js`" if using pm2 (recommended) start the bot using "`pm2 start ps2-player-manager.js --watch`"

recommended:  
Use a proccess manager like [pm2](https://pm2.keymetrics.io/docs/usage/quick-start/) to manage the bot and automatically restart if it crashes.

dependencys:  
[eris](https://www.npmjs.com/package/eris)  
[axios](https://www.npmjs.com/package/axios)

**config file**  
all values not marked as optional are _required._  
configVersion: do. not. change. this.  
psGuild: planetside guild id  
world: _(default: 1 (connery))_ planetside numeric server id  
dGuild: discord guild id  
commandChar: prefix for commands  
member: _(default: "]")_ the role id required to automaticly try and match a discord user to a ps2 player  
exempt: discord users with this role will be ignored, regardless of if they have the member role  
unmached: role id to give to players if they have the member, and their discord nick does not match a ps2 player on the given server and guild.  
matchRanks: _(default: false)_ true/false should the bot give players the update role if their ps2 role & discord role do not match. If false then update & ranks are unused.  
update: role id used if matchRanks is true
ranks: ps2 rank names & discord role id pairs, , first letter must be capitalized and all other letters must be lowercase  
format is {"rank name":"role id", "rank name":"role id", "rank name":"role id"}  
for example: {"Ensign":"1234556789", "Liutenent":"1234556789","Captian":"1234556789"}  
use [jsonlint.com](https://jsonlint.com/) to validate your ranks as json can be quite fiddley.

License (modified ISC)  
Copyright 2020 lily-s

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that both:

1. The above copyright notice and this permission notice appear in all copies.
2. The entire contents of this file (README.md) appear unmodified in all copies OR if the software has been modified the unmodified contents of this file appears in the modified softwares readme and/or licence files.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
