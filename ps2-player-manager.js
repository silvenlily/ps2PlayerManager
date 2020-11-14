let configHandler = require("./lily-modules/config-handler.js");
var playerCashe = {};
var allowRequest = Date.now() + 5000;
var guild = {};

const config = configHandler.fetchConfig();
const tokens = configHandler.fetchTokens();
if (!config.casheTime) {
  config.casheTime = 600000;
}

const Eris = require("eris");
const axios = require("axios").default;

var bot = new Eris(tokens.discord);

getPlayerCashe();
async function getPlayerCashe() {
  let request = `https://census.daybreakgames.com/s:${tokens.api}/get/ps2:v2/outfit/?outfit_id=${config.psGuild}&c:resolve=member_character_name`;
  console.log("request: " + request);
  try {
    const response = await axios.get(request);
    let players = response["data"]["outfit_list"][0]["members"];

    for (let i = 0; i < players.length; i++) {
      playerCashe[players[i]["name"]["first_lower"]] = players[i]["rank"];
    }
    console.log("fetched player cashe");
  } catch (error) {
    console.log(
      "err in requesting player data from daybreak servers: \n~~~~~~~~~~~\n" +
        error +
        "\n~~~~~~~~~~~"
    );
  }
}

bot.connect();

bot.on("guildMemberUpdate", async function (guild, member) {
  updateGuildMember(member);
});

bot.on("ready", () => {
  console.log("Ready!");
  setTimeout(fixChanges, 2000);
  setInterval(async () => {
    let request = `https://census.daybreakgames.com/s:${tokens.api}/get/ps2:v2/outfit/?outfit_id=${config.psGuild}&c:resolve=member_character_name`;
    console.log("request: " + request);
    try {
      const response = await axios.get(request);
      players = response["data"]["outfit_list"][0]["members"];
      players.forEach((element) => {
        playerCashe[element["name"]["first_lower"]] = element["rank"];
      });
      console.log("refreshed player cashe");
      fixChanges();
    } catch (error) {
      console.log(
        "err in requesting player data from daybreak servers: \n~~~~~~~~~~~\n" +
          error +
          "\n~~~~~~~~~~~"
      );
    }
  }, config.casheTime);
});

async function fixChanges() {
  console.log("checking player list");
  let guild = bot.guilds.find((g) => {
    if (g.id === config.dGuild) {
      return true;
    }
  });
  await guild.fetchAllMembers();
  let guildMembers = guild.members.filter(async () => {
    return true;
  });
  for (let i = 0; i < guildMembers.length; i++) {
    updateGuildMember(guildMembers[i]);
  }
}

bot.on("messageCreate", (msg) => {
  if (
    msg.content.substring(0, config.commandChar.length) === config.commandChar
  ) {
    let args = msg.content.substring(config.commandChar.length);
    if (args.includes(" ")) {
      args = args.split(" ", 8);
      command = args[0];
    } else {
      command = args;
    }
    switch (command) {
      case "guild":
        console.log("guild");
        getPlayerInfo("silverlilys", tokens.api);
        break;
    }
  }
});

async function updateGuildMember(member) {
  if (
    member.roles.includes(config["member"]) &&
    !member.roles.includes(config["exempt"])
  ) {
    if (!member.bot) {
      let playername = member.username;
      if (member.nick) {
        playername = member.nick;
      }
      console.log(`member update: ` + playername);
      if (playerCashe[playername]) {
        if (member.roles.includes(config.unmached)) {
          member.removeRole(config.unmached);
        }
        if (config.matchRanks) {
          if (!member.roles.includes(config.update)) {
            if (
              !member.roles.includes(config["ranks"][playerCashe[playername]])
            ) {
              member.addRole(config.update);
            }
          } else if (
            member.roles.includes(config["ranks"][playerCashe[playername]])
          ) {
            member.removeRole(config.update);
          }
        }
      } else {
        if (!member.roles.includes(config.unmached)) {
          member.addRole(config.unmached);
        }
      }
    }
  }
}
