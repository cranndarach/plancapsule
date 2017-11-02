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
    jsonfile.readFile(dbPath)
      .then((data) => {
        resolve(data);
      })
      .catch((err) => {
        if (err instanceof ENOENT) {
          console.log("No data file found. Starting a new one.");
          resolve([]);
        } else {
          // Don't want it to mess with anything if there's an unexpected error.
          // throw err;
          reject(err);
        }
      });
  });
}

function addNew(entry) {
  return loadData().then((data) => {
    data.push(entry);
    return jsonfile.writeFile(dbPath, data);
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
      .catch((err) => {
        throw err;
      });
  });
}


