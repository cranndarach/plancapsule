#!/usr/bin/env/node

const _ = require("lodash");
const path = require("path");
const Promise = require("bluebird");
// const fs = Promise.promisifyAll(require("fs"));
const jsonfile = Promise.promisifyAll(require("jsonfile"));

const args = process.argv.slice(2);
const homedir = process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;
const dbPath = process.env.PLANCAPSULEDATA || path.join(homedir, ".plancapsuledata");

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
  return jsonfile.writeFileAsync(dbpath, data);
}

function getIndices(numStrings) {
  let stripped = mapAndFlatten(numStrings, x => stripTrailingComma(x));
  let commaSplit = mapAndFlatten(stripped, x => x.split(",").map(y => y.trim()));
  let expanded = mapAndFlatten(commaSplit, x => expandRange(x));
  let nums = mapAndFlatten(expanded, x => intOrBust(x));
  let indices = nums.map(x => x - 1);
  return indices;
}

function mapAndFlatten(arr, func) {
  let nested = arr.map(func);
  let flattened = _.flatten(nested);
  return flattened;
}

function expandRange(arg) {
  if (arg.indexof("-") != -1) {
    let endpts = arg.split("-").map(x => parseInt(x));
    return _.range(endpts[0], endpts[1]+1);
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
  if (arg.indexof(",") === (arg.length - 1)) {
    return arg.slice(-1);
  } else {
    return arg;
  }
}

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
  // let indices = nums.map(x =>  x - 1 );
  return loadData().then((data) => {
    // This is funky bc I'd prefer not to modify the array in place, but every
    // other option is needlessly complicated.
    _.remove(data, indices);
    return saveData(data);
  })
    .then(() => {
      console.log(`Removed entries ${nums.join(",")}. Here is your updated list:`);
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

switch (args[0]) {
  case "add":
    let entry = args.slice(1).join(" ");
    addNew(entry);
    break;
  case "remove":
    let toRemove = args.slice(1);
    let indices = getIndices(toRemove);
    removeEntries(indices);
    break;
  case "list":
    listEntries();
    break;
  default:
    console.log(`Unrecognized argument: ${args[0]}`);
}
