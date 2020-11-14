let configHandler = require("./lily-modules/config-handler.js");
let recentCheckCashe = {};

const config = configHandler.fetchConfig();
const tokens = configHandler.fetchTokens();

const Eris = require("eris");
const axios = require("axios").default;

var bot = new Eris(tokens.discord);

bot.connect();

bot.on("ready", () => {
  console.log("Ready!");
});

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

bot.on("guildMemberUpdate", async function (guild, member, oldMember) {
  if (!recentCheckCashe[member["id"]]) {
    if (
      member.roles.includes(config["member"]) &&
      !member.roles.includes(config["exempt"])
    ) {
      if (!member.bot) {
        console.log("member update: " + member.nick);
        if (!member.roles.includes(config.exempt)) {
          let player = await getPlayerInfo(member.nick);
          if (player.returned === 1) {
            player = player.character_list[0];
            console.log("playerb: \n" + player);
            member.removeRole(config["unmached"]);
          } else if (player.returned === 0) {
            member.addRole(config["unmached"]);
          } else {
            console.log(
              "err: somehow an api request returned this: \n" +
                JSON.stringify(player)
            );
          }
        }
      }
    }
  }
});

async function getPlayerInfo(playerName) {
  playerName = playerName.toLowerCase();
  request =
    "http://census.daybreakgames.com/s:" +
    tokens.api +
    "/get/ps2:v2/character/?name.first_lower=" +
    playerName +
    "&c:resolve=outfit_member,world";
  console.log("request" + request);
  try {
    const response = await axios.get(request);
    return response.data;
  } catch (error) {
    console.log(
      "err in requesting player data from daybreak servers: \n~~~~~~~~~~~\n" +
        error +
        "\n~~~~~~~~~~~"
    );
  }
}
