const fs = require("fs");

const defaultTokens = {
  configVersion: 1,
  discord: "place your discord bot token here.",
  api: "example",
};
const defaultConfig = {
  configVersion: 1,
  psGuild: "",
  world: 1,
  dGuild: "",
  commandChar: "]",
  member: "",
  exempt: "",
  unmached: "",
  matchRanks: false,
  update: "unused if matchRanks is false",
  ranks: {},
};

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
  let path = "./excemptMemberCashe.json";
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
