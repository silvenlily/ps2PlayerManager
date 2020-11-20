let configHandler = require("./lily-modules/config-handler.js");
const nodeModuleHandler = require ("./lily-modules/node-modules-handler")
var numMissmached = { names: 0, ranks: 0 };

var exemptMembers = configHandler.fetchExempt();
var config = configHandler.fetchConfig();
const tokens = configHandler.fetchTokens();
if (!config.cacheTime) {
  config.cacheTime = 600000;
}

const Eris = nodeModuleHandler.get("eris");
const axios = nodeModuleHandler.get("axios");
const postGres = nodeModuleHandler.get("pg");
var dbCache = {}
var db

startup();
function startup() {
  console.log("Connecting to database...");
  if(tokens.pgSql.url != ""){
    db = new postGres.Client(tokens.pgSql.url)
  } else {
    db = new postGres.Client({
      host: tokens.pgSql.host,
      port: tokens.pgSql.port,
      user: tokens.pgSql.user,
      password: tokens.pgSql.password,
      database: tokens.pgSql.database
    })
  }
  db.connect()
    .then(() => {
      console.log("Connected to pg server.");
      db.query("SELECT * FROM users")
        .then((res) => {
          console.log("Connected to database.")
          for (let i = 0; i < res.rows.length; i++) {
            dbCache[res.rows[i]["psname"]] = res.rows[i];
          }
          bot.connect();
        })
        .catch((e) => {
          console.log(
            "Unable to query database: " + tokens.pgSql.database + " table: " +
              tokens.pgSql.userTable +
              " \nPlease ensure this database exists, has a table named users and that the provided user credentials have read/write access to it."
          );
          process.exit();
        });
    })
    .catch((e) => {
      console.log("Unable to connect to database.");
      process.exit();
    });
}

var bot = new Eris(tokens.discord);

async function log(level, msg) {
  if (config.consoleLevel >= level) {
    console.log(msg);
  }
}

async function fetchPsApi() {
  let request = `https://census.daybreakgames.com/s:${tokens.api}/get/ps2:v2/outfit/?outfit_id=${config.psGuild}&c:resolve=member_character`;
  log(7,"request: " + request);
  try {
    const response = await axios.get(request);
    let players = response["data"]["outfit_list"][0]["members"];

    for (let i = 0; i < players.length; i++) {
      if(!dbCache[players[i]["name"]["first_lower"]]){
        db.query("INSERT INTO users(psname,psid,rank,status) VALUES ($1,$2,$3,$4);",[players[i]["name"]["first_lower"],players[i]["character_id"],players[i]["rank"],1])
        db.Cache[players[i]["name"]["first_lower"]] = {psname: players[i]["name"]["first_lower"],psid: players[i]["character_id"],rank: players[i]["rank"],status: 1}
      } else if(dbCache[players[i]["name"]["first_lower"]]["rank"] != players[i]["rank"]){
        db.query("UPDATE users SET rank = $1 WHERE psname = $2",[players[i]["rank"],players[i]["name"]["first_lower"]])
        db.Cache[players[i]["name"]["first_lower"]]["rank"] = players[i]["rank"]
        console.log("Updated " + players[i]["name"]["first_lower"] + "'s rank to " + players[i]["rank"])
      }
    }
    log(5,"fetched player cache");
  } catch (error) {
    console.log(
      "err in requesting player data from daybreak servers: \n~~~~~~~~~~~\n" +
        error +
        "\n~~~~~~~~~~~"
    );
  }
}

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
    config["reminder"] = config["reminder"].replace(
      "%role%",
      guild.roles.find((r) => {
        if (r.id === config.unmached) {
          return true;
        }
      }).mention
    );
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
          let guild = bot.guilds.find((g) => {
            if (g.id === config.dGuild) {
              return true;
            }
          });
          let role = guild.roles.find((r) => {
            if (r.id === config.reminderChannel) {
              return true;
            }
          });
          let rmsg = config["reminder"];
          if (role) {
            rmsg = rmsg.replaceAll("%role%", role.mention);
          }
          bot.createMessage(config["reminderChannel"], rmsg);
        }, 604800000);
      }, reminder);
    }
  }

  guild.fetchAllMembers();
  console.log("Connected to discord.");
  fixChanges()
  setInterval(fixChanges, config.cacheTime);
});

async function fixChanges() {
  await fetchPsApi();
  let guild = bot.guilds.find((g) => {
    if (g.id === config.dGuild) {
      return true;
    }
  });
  let guildMembers = guild.members.filter(async () => {
    return true;
  });
  log(5, "Checking " + guildMembers.length + " guild members");
  numMissmached = { names: 0, ranks: 0 };
  for (let i = 0; i < guildMembers.length; i++) {
    log(7,"[" +(i + 1) +"/" +guildMembers.length +"] checking: " +guildMembers[i]["username"]);
    updateGuildMember(guildMembers[i]);
  }
  log(5, "Finished checking guild members, there are " + numMissmached.names + " users with missmached names and " + numMissmached.ranks + " users with missmached ranks.");
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
    if (msg.guildID === config.dGuild) {
      var member = msg.channel.guild.fetchMembers({
        userIDs: msg.author.id,
      });
      switch (command) {
        case "exempt":
          member = msg.channel.guild.fetchMembers({
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
              bot.createMessage(msg.channel.id,"Usage:\n" + config.commandChar + "exempt [@user]");
            }
          } else {
            sendTimedMessage(msg.channel.id,"You need to be an admistrator to use this command.",10);
          }
          break;
        case "remind":

          bot.createMessage(msg.channel.id, config["reminder"]);
          log(4,"User: " + msg.author.username + " ran reminder.")
          msg.delete();
          break;
        case "apipull":
          member = (await member)[0];
          if (member.permission.has("manageRoles")) {
          log(5, "Making api pull from command.");
          fixChanges();
          log(5, "Finished checking guild members, there are " + numMissmached.names + " users with missmached names and " + numMissmached.ranks + " users with missmached ranks.");
          }
          break;
        case "urank":
          member = msg.channel.guild.fetchMembers({
            userIDs: msg.author.id,
          });
          member = (await member)[0];
          if (member.permission.has("manageRoles")) {
            bot.createMessage(msg.channel.id,"There are " + numMissmached.ranks + " users with missmached roles.");
          } else {
            sendTimedMessage(msg.channel.id,"You need to have the manage roles permission to use this command.",10);
          }
          break;
        case "uname":
          member = msg.channel.guild.fetchMembers({
            userIDs: msg.author.id,
          });
          member = (await member)[0];
          if (member.permission.has("manageRoles")) {
            bot.createMessage(msg.channel.id,"There are " + numMissmached.names + " users with missmached names.");
          } else {
            sendTimedMessage(msg.channel.id,"You need to have the manage roles permission to use this command.",10);
          }
          break;
      }
    }
  }
});

async function sendTimedMessage(channel, msg, time) {
  bot.createMessage(channel, msg)
    .then((newmsg) => {
      setTimeout(function () {
        newmsg
          .delete()
          .catch((err) => console.log("delete timed message error: " + err));
      }, time * 1000);
    })
    .catch((err) => console.log("send timed message error: " + err));
}

async function updateGuildMember(member) {
  if (member.roles.includes(config["member"])) {
    if (!member.roles.includes(config["exempt"])) {
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

          if(dbCache[playername]){ //if member exists in dbCache
            if(member.roles.includes(config.unmached)){ //if member has bad ign role remove it
              member.removeRole(config.unmached);
              log(4, "removed umached IGN role from " + playername);
            }
            if(config.matchRanks){ //if match ranks is enabled
              if (
                member.roles.includes(config["ranks"][dbCache[playername]["rank"]])
              ) {
                //if member has correct rank role
                if (member.roles.includes(config.update)) {
                  //if member has update role remove it
                  member.removeRole(config.update);
                  log(4, "removed update rank role from " + playername);
                }
              } else {
                if (config["ranks"][dbCache[playername]["rank"]]) {
                  numMissmached.ranks++;
                  if (!member.roles.includes(config.update)) {
                    //if member does not have update rank role add it
                    member.addRole(config.update);
                    log(4, "added update role to " + playername);
                  }
                } else {
                  if (member.roles.includes(config.update)) {
                    //if member does have update rank role remove it
                    member.removeRole(config.update);
                    log(4, "removed update rank role from " + playername);
                  }
                }
              }
            }
          } else { //if member does not exist in member cache
            numMissmached.names++
            if (member.roles.includes(config.update)) { //if member has update role remove it
              member.removeRole(config.update);
              log(4, "removed update rank role from " + playername);
            }
            if (!member.roles.includes(config.unmached)) { //if member does not have bad ign role add it
              member.addRole(config.unmached);
              log(4, "added umached IGN role to " + playername);
            }
          }
        }
      }
    }
  } else { //if member does not have member role
    if (member.roles.includes(config.update)) {
      member.removeRole(config.update);
      log(4, "removed update rank role from " + playername);
    }
    if (member.roles.includes(config.unmached)) {
      member.remove(config.unmached);
      log(4, "removed umached IGN role from " + playername);
    }
  }
}
