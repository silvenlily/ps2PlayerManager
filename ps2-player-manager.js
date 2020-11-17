let configHandler = require("./lily-modules/config-handler.js");
var playerCashe = {};
var allowRequest = Date.now() + 5000;
var guild = {};

var exemptMembers = configHandler.fetchExempt();
const config = configHandler.fetchConfig();
const tokens = configHandler.fetchTokens();
if (!config.casheTime) {
  config.casheTime = 600000;
}

const Eris = require("eris");
const axios = require("axios").default;

var bot = new Eris(tokens.discord);

async function log(level, msg) {
  if (config.consoleLevel >= level) {
    console.log(msg);
  }
}

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
  let guild = bot.guilds.find((g) => {
    if (g.id === config.dGuild) {
      return true;
    }
  });

  if (
    config["reminder"] &&
    config["reminderTime"] &&
    config["reminderChannel"] &&
    typeof config["reminder"] != "off"
  ) {
    let currentDate = new Date();
    let hours = currentDate.getHours() * 3600000;
    let minutes = currentDate.getMinutes() * 60000;
    let reminder = hours + minutes;
    reminder = 86400000 - reminder;
    if (config["reminderTime" === "daily"]) {
      setTimeout(() => {
        bot.createMessage(config["reminderChannel"], config["reminder"]);
        setInterval(() => {
          bot.createMessage(config["reminderChannel"], config["reminder"]);
        }, 86400000);
      }, reminder);
    } else if (config["reminderTime" === "weekly"]) {
      let day = currentDate.getDay();
      day = 8 - day;
      day = day * 86400000;
      setTimeout(() => {
        bot.createMessage(config["reminderChannel"], config["reminder"]);
        setInterval(() => {
          bot.createMessage(config["reminderChannel"], config["reminder"]);
        }, 604800000);
      }, reminder);
    }
  }

  guild.fetchAllMembers();
  console.log("Ready!");
  setTimeout(fixChanges, 10000);
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
  let guild = bot.guilds.find((g) => {
    if (g.id === config.dGuild) {
      return true;
    }
  });
  let guildMembers = guild.members.filter(async () => {
    return true;
  });
  log(5, "Checking " + guildMembers.length + " guild members");
  for (let i = 0; i < guildMembers.length; i++) {
    log(
      7,
      "[" +
        (i + 1) +
        "/" +
        guildMembers.length +
        "] checking: " +
        guildMembers[i]["username"]
    );
    updateGuildMember(guildMembers[i]);
  }
  log(5, "Finished checking guild members.");
}

bot.on("messageCreate", async (msg) => {
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
      case "exempt":
        if (msg.guildID === config.dGuild) {
          let member = msg.channel.guild.fetchMembers({
            userIDs: msg.author.id,
          });
          member = (await member)[0];
          if (member.permission.has("administrator")) {
            if (msg.mentions[0]) {
              let changes = {
                exempted: [],
                unexempted: [],
              };
              msg.mentions.forEach((usr) => {
                if (exemptMembers[usr.id]) {
                  exemptMembers[usr.id] = false;
                  changes.exempted.push(usr.mention);
                } else {
                  exemptMembers[usr.id] = true;
                  changes.unexempted.push(usr.mention);
                }
              });
              let reply = "";
              if (changes.exempted[0]) {
                reply = "Added exemption to following users:\n";
                for (let i = 0; i < changes.exempted.length; i++) {
                  reply = reply + changes.exempted[i] + "\n";
                }
              }
              if (changes.unexempted[0]) {
                reply = reply + "Removed exemption to following users:\n";
                for (let i = 0; i < changes.exempted.length; i++) {
                  reply = reply + changes.exempted[i] + "\n";
                }
              }
              if (reply != "") {
                bot.createMessage(msg.channel.id, reply);
                configHandler.updateExempt(exemptMembers);
              }
            } else {
              bot.createMessage(
                msg.channel.id,
                "Usage:\n" + config.commandChar + "exempt [@user]"
              );
            }
          }
        }
        break;
    }
  }
});

async function updateGuildMember(member) {
  if (
    member.roles.includes(config["member"]) &&
    !member.roles.includes(config["exempt"])
  ) {
    if (!exemptMembers[member.id]) {
      if (!member.bot) {
        let playername = member.username;
        if (member.nick) {
          playername = member.nick;
        }
        playername = playername.toLowerCase();
        if (playername.includes(" ")) {
          playername = playername.substring(0, playername.indexOf(" "));
        }
        if (playername.includes("[")) {
          playername = playername.substring(0, playername.indexOf("["));
        }
        if (playerCashe[playername]) {
          //if player is included in the guild list
          if (member.roles.includes(config.unmached)) {
            //if player has the unmached role, remove it
            member.removeRole(config.unmached);
            log(4, "removed umached IGN role from " + playername);
          }
          if (config.matchRanks) {
            if (!member.roles.includes(config.update)) {
              if (
                !member.roles.includes(config["ranks"][playerCashe[playername]])
              ) {
                member.addRole(config.update);
                log(4, "added umached IGN role from " + playername);
              }
            } else if (
              member.roles.includes(config["ranks"][playerCashe[playername]])
            ) {
              member.removeRole(config.update);
              log(4, "removed update rank role from " + playername);
            }
          }
        } else {
          if (member.roles.includes(config.update)) {
            member.removeRole(config.update);
            log(4, "removed update rank role from " + playername);
          }
          if (!member.roles.includes(config.unmached)) {
            member.addRole(config.unmached);
            log(4, "added umached IGN role to " + playername);
          }
        }
      }
    }
  }
}
