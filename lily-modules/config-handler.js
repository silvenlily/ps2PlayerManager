const fs = require("fs");

const defaultTokens = {
  configVersion: 1,
  discord: "place your discord bot token here.",
  api: "example",
};

const defaultConfig = {
  configVersion: 2,
  psGuild: "",
  world: 1,
  dGuild: "",
  commandChar: "]",
  member: "",
  exempt: "",
  unmached: "",
  matchRanks: false,
  reminder:
    "Hey! %1 \nMake your ign maches your ingame username! \nThe bot only checks before the first space in your username so you may include tags after that.",
  reminderTime: "off",
  reminderChannel: "778126610364366889",
  update: "unused if matchRanks is false",
  ranks: {},
};

function updateConfig(def, current, path) {
  let newConfig = current;
  let defItems = Object.keys(def);
  let currentItems = Object.keys(current);
  for (let i = 0; i < defItems.length; i++) {
    if (!currentItems.includes(defItems[i])) {
      newConfig[defItems[i]] = def[defItems[i]];
    }
  }
  try {
    let data = JSON.stringify(newConfig, null, 2);
    fs.writeFileSync(path, data);
  } catch (error) {
    let data = JSON.stringify(newConfig, null, 2);
    console.log(
      `Unable to write to config file. Your new config is:\n~~~~~~~~\n \n` +
        data +
        `\n \n ~~~~~~~~`
    );
  }
  console.log(
    "Updated to new config version, please apply new required values."
  );
}

function fetchConfig() {
  let path = "./config/config.json";
  if (!fs.existsSync("./config")) {
    fs.mkdirSync("./config");
  }

  if (fs.existsSync(path)) {
    console.log("config file found");
    let config = fs.readFileSync(path, "utf8");
    try {
      let configJSON = JSON.parse(config);
      if (!configJSON.configVersion) {
        console.log(
          "I cant determine what config version you have. Please fix or regenerate your config."
        );
        process.exit();
      } else if (configJSON.configVersion < defaultConfig.configVersion) {
        console.log("Updating config");
        updateConfig(defaultConfig, configJSON, path);
        process.exit();
      }
      return configJSON;
    } catch (err) {
      console.log(
        "*************************************************\n********** invalid json in config file **********\n************************************************* "
      );
      process.exit();
    }
  } else {
    console.log("config file not found, generating new config file");
    let data = JSON.stringify(defaultConfig, null, 2);
    fs.writeFileSync(path, data);
    process.exit();
  }
}

function fetchTokens() {
  let path = "./config/tokens.json";
  if (fs.existsSync(path)) {
    console.log("tokens file found");
    let tokens = fs.readFileSync(path, "utf8");
    try {
      return JSON.parse(tokens);
    } catch (err) {
      console.log(
        "***************************************\n***** invalid json in tokens file *****\n***************************************"
      );
      process.exit();
    }
  } else {
    console.log("tokens file not found, generating new tokens file");
    let data = JSON.stringify(defaultTokens, null, 2);
    fs.writeFileSync(path, data);
    let tokens = fs.readFileSync(path, "utf8");
    process.exit();
  }
}

function updateExemptMembers(cashe) {
  let path = "./excemptMemberCashe.json";
  if (fs.existsSync(path)) {
    console.log("updating exempt member cashe");
    let data = JSON.stringify(cashe, null, 2);
    fs.writeFileSync(path, data);
  }
}

function fetchExemptMembers() {
  let path = "./config/excemptMemberCashe.json";
  if (fs.existsSync(path)) {
    console.log("excempt member cashe found");
    let tokens = fs.readFileSync(path, "utf8");
    try {
      return JSON.parse(tokens);
    } catch (err) {
      console.log(
        "***************************************\n***** invalid json in excempt member cashe file *****\n***************************************"
      );
    }
  } else {
    console.log(
      "excempt member cashe file not found, generating new excempt member cashe"
    );
    let data = JSON.stringify({}, null, 2);
    fs.writeFileSync(path, data);
    let tokens = fs.readFileSync(path, "utf8");
  }
}

exports.fetchExempt = fetchExemptMembers;
exports.updateExempt = updateExemptMembers;
exports.fetchConfig = fetchConfig;
exports.defaultConfig = defaultConfig;
exports.fetchTokens = fetchTokens;
exports.defaultTokens = defaultTokens;
