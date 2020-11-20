function get(module) {
  try {
    console.log("getting module: " + module);
    return require(module);
  } catch (error) {
    console.log(
      "unable to find dependency: " +
      module +
      "\nUse npm install in the root diectory of this program to install all required modules using package.json\n debug err:\n" +
      error
    );
    process.exit()
  }
}

exports.get = get;
