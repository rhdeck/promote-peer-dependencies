#!/usr/bin/env node
const ppd = require("./../index.js");
const cp = require("child_process");
const commander = require("commander");
const yarnif = require("yarnif");
const Path = require("path");
const fs = require("fs");
commander
  .arguments("[fromdependency]")
  .description(
    "Promote recursively found peer dependencies of this package or the specified module to be installed dependencies here"
  );
commander.parse(process.argv);
const targetpath = process.cwd();
var doInstall = false;
if (commander.args[0]) {
  const package = commander.args[0];
  //Let's try some techniques for finding this package
  const packagepath = Path.join(targetpath, "node_modules", package);
  if (fs.existsSync(packagepath)) {
    ppd(packagepath, targetpath);
    doInstall = true;
  } else {
    try {
      const requirepath = require.resolve(package);
      if (requirepath) {
        if (fs.existsSync(Path.resolve(requirepath, "package.json"))) {
          ppd(requirepath, targetpath);
          doInstall = true;
        } else {
          var parentpath = requirepath;
          while (!doInstall) {
            parentpath = Path.dirname(parentpath);
            if (!parentpath) break;
            if (Path.basename(parentpath) == "node_modules") break;
            if (fs.existsSync(Path.resolve(parentpath, "package.json"))) {
              const p = require(Path.resolve(parentpath, "package.json"));
              if (p && p.name == package) {
                ppd(parentpath, targetpath);
                doInstall = true;
              } else {
                break; // there is something wrong
              }
            }
          }
        }
      }
    } catch (e) {}
  }
} else {
  ppd(path);
  doInstall = true;
}
if (doInstall) {
  yarnif.install();
} else {
  console.log("Could not install package from arguments", commander.args);
}
