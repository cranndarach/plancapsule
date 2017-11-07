#!/usr/bin/env/node

const _ = require("lodash");
const path = require("path");
const Promise = require("bluebird");
const jsonfile = Promise.promisifyAll(require("jsonfile"));

const args = process.argv.slice(2);
const cmd = args[0];
const input = args.slice(1).join(" ");
const homedir = process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;
const dbPath = process.env.PLANCAPSULEDATA || path.join(homedir, ".plancapsuledata");

/************
 * Commands *
 ************/

function addNew(entry) {
  return loadData().then((data) => {
    data.push(entry);
    return saveData(data);
  })
    .then(() => {
      console.log("Data successfully updated.");
    })
    .catch((err) => {
      throw err;
    });
}

function removeEntries(indices) {
  return loadData().then((data) => {
    // This is funky bc I'd prefer not to modify the array in place, but every
    // other option is needlessly complicated.
    _.pullAt(data, indices);
    return saveData(data);
  })
    .then(() => {
      console.log(`Removed specified entries. Here is your updated list:`);
      listEntries();
    });
}

function listEntries() {
  return loadData().then((data) => {
    let entryNo = 1;
    data.forEach((entry) => {
      console.log(`${entryNo++}. ${entry}\n`);
    });
  })
    .catch((err) => {
      throw err;
    });
}

function showHelp() {
  console.log("plancapsule - hold onto your brilliant ideas until you can act on them\n");
  for (const cmd in helpText) {
    console.log(`${cmd}\t${helpText[cmd]}`);
  }
}

function showVersion() {
  console.log(`plancapsule v${process.env.npm_package_version}`);
}

/*************
 * Utilities *
 *************/

function loadData() {
  return new Promise((resolve, reject) => {
    jsonfile.readFileAsync(dbPath)
      .then((data) => {
        resolve(data);
      })
    // I guess this is for operational errors and not general exceptions.
    // I need to read about the distinction, but the example says that fs
    // errors will be caught with .error()
      .error((err) => {
        console.log("No data file found. Starting a new one.");
        resolve([]);
      })
      .catch((err) => {
        reject(err);
      });
  });
}

function saveData(data) {
  return jsonfile.writeFileAsync(dbPath, data);
}

function getIndices(numString) {
  let commaSplit = numString.split(",").map(x => x.trim());
  say("Comma split: ", commaSplit);
  let expanded = mapAndFlatten(commaSplit, x => expandRange(x));
  say("Expanded: ", expanded);
  let nums = mapAndFlatten(expanded, x => intOrBust(x));
  say("Nums: ", nums);
  let indices = nums.map(x => x - 1);
  say("Indices: ", indices);
  return indices;
}

function mapAndFlatten(arr, func) {
  let nested = arr.map(func);
  let flattened = _.flatten(nested);
  return flattened;
}

function expandRange(arg) {
  if (arg.indexOf("-") != -1) {
    let endpts = arg.split("-").map(x => parseInt(x));
    return _.range(endpts[0], endpts[1]+1);
  } else {
    return arg;
  }
}

function intOrBust(arg) {
  let num = parseInt(arg);
  if (num) {
    return num;
  } else {
    throw new Error(`Not a number: ${arg}`);
  }
}

function stripTrailingComma(arg) {
  if (arg.indexOf(",") === (arg.length - 1)) {
    return arg.slice(0, -1);
  } else {
    return arg;
  }
}

// Bc console.log is long
function say(...what) { console.log(...what); }

var helpText = {
  "add": "Add a new entry to your list. Format: `plancapsule add My new idea for a brighter future`",
  "remove": "Delete specified entries from your list. Format: `plancapsule remove 1, 3, 5-9`",
  "list": "List all your entries in human-readable form. Format: `plancapsule list`",
  "help": "Print this help text. Format: `plancapsule help`",
  "version": "Print the version number. Format: `plancapsule version`"
};

/********
 * Main *
 ********/

// console.log("Command:", cmd);
// console.log("Arguments:", input);

switch (cmd) {
  case "add":
    addNew(input);
    break;
  case "remove":
    removeEntries(getIndices(input));
    break;
  case "list":
    listEntries();
    break;
  case "version":
  case "-v":
  case "--version":
    showVersion();
    break;
  default:
    console.log(`Unrecognized argument: ${cmd}`);
  case "help":
  case "-h":
  case "--help":
    showHelp();
}
