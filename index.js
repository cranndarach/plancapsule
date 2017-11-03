#!/usr/bin/env/node

const _ = require("lodash");
const path = require("path");
const Promise = require("bluebird");
const jsonfile = Promise.promisifyAll(require("jsonfile"));

const args = process.argv.slice(2);
const cmd = args[0];
const input = args.slice(1);
const homedir = process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;
const dbPath = process.env.PLANCAPSULEDATA || path.join(homedir, ".plancapsuledata");

/************
 * Commands *
 ************/

function addNew(entry) {
  return loadData().then((data) => {
    data.push(entry);
    // return jsonfile.writeFileAsync(dbPath, data);
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

/*********************
 * Utility functions *
 *********************/

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

function getIndices(numStrings) {
  let stripped = mapAndFlatten(numStrings, x => stripTrailingComma(x));
  say("Stripped: ", stripped);
  let commaSplit = mapAndFlatten(stripped, x => x.split(",").map(y => y.trim()));
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

/********
 * Main *
 ********/

console.log("Command:", cmd);
console.log("Arguments:", input);

switch (cmd) {
  case "add":
    addNew(input);
    break;
  case "remove":
    // let indices = getIndices(input);
    removeEntries(getIndices(input));
    break;
  case "list":
    listEntries();
    break;
  default:
    console.log(`Unrecognized argument: ${cmd}`);
}
