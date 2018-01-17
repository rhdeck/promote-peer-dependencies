#!/usr/bin/env node
const ppd = require("./../index.js");
const cp = require("child_process");
const path = process.cwd();
ppd(path);
cp.spawnSync("yarn", ["install"], {
  encoding: "utf8",
  stdio: "inherit"
});
