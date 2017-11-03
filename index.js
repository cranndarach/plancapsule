#!/usr/bin/env/node

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
        // let dataObj = JSON.parse(data);
        resolve(data);
      })
    // .catch((err) => {
    // .catch(ENOENT, (err) => {
    // I guess this is for operational errors and not general exceptions.
    // I need to read about the distinction, but the example says that fs
    // errors will be caught with .error()
      .error((err) => {
        // if (err instanceof ENOENT) {
        console.log("No data file found. Starting a new one.");
        resolve([]);
      })
      .catch((err) => {
        // } else {
          // Don't want it to mess with anything if there's an unexpected error.
          // throw err;
          reject(err);
        // }
      });
  });
}

function addNew(entry) {
  return loadData().then((data) => {
    data.push(entry);
    return jsonfile.writeFileAsync(dbPath, data);
  })
    .then(() => {
      console.log("Data successfully updated.");
    })
    .catch((err) => {
      throw err;
    });
}

function listEntries() {
  return loadData().then((data) => {
    let entryNo = 1;
    data.forEach((entry) => {
      console.log(`${entryNo++}. ${entry}\n`);
    })
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
  case "list":
    listEntries();
    break;
  default:
    console.log(`Unrecognized argument: ${args[0]}`);
}
