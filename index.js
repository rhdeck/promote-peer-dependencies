const fs = require("fs");
const Path = require("path");
const semver = require("semver");
const walkDependencies = require("@raydeck/walk-dependencies");
function readPackageFromPath(path) {
  if (!path) path = process.cwd();
  const packagePath = Path.resolve(path, "package.json");
  if (!fs.existsSync(packagePath)) return;
  str = fs.readFileSync(packagePath, "utf8");
  try {
    const package = JSON.parse(str);
    return package;
  } catch (err) {}
}
function returnif(obj) {
  if (obj) return obj;
  else return {};
}
function mergeif(obj1, obj2) {
  if (!obj1) obj1 = {};
  if (!obj2) return obj1;
  Object.keys(obj2).forEach(k => {
    const v = obj2[k];
    const o = obj1[k];
    if (!o) {
      obj1[k] = v;
      return;
    }
    if (!semver.valid(o) && !semver.validRange(o)) {
      //do nothing - old guy has a magic ticket
      return;
    }
    if (!semver.valid(v) && !semver.validRange(v)) {
      //just do it - new guy has a magic ticket
      obj1[k] = v;
      return;
    }
    if (semver.valid(o) && semver.valid(v)) {
      if (semver.gt(v, o)) {
        obj1[k] = v;
      }
      return;
    }
    if (semver.valid(o) && semver.validRange(v)) {
      if (!semver.gtr(o, v)) {
        obj1[k] = v;
      }
      return;
    }
    if (semver.validRange(o) && semver.valid(v)) {
      if (semver.gtr(v, o)) {
        obj1[k] = v;
      }
      return;
    }
    if (semver.validRange(o) && semver.validRange(v)) {
      if (!semver.intersects(o, v)) {
        if (v > o) {
          obj1[k] = v;
          return;
        }
      }
    }
  });
  return obj1;
}
function getPeerDependencies(path, useDevDependencies) {
  if (!path) return null;
  var ps = {};
  walkDependencies(path, useDevDependencies, function(path, package) {
    let pds = returnif(package.peerDependencies);
    ps = mergeif(ps, pds);
  });
  return ps;
}
function saveDependencies(newDependencies, path, asDev) {
  if (!newDependencies || !Object.keys(newDependencies).length) {
    return;
  }
  const devKey = asDev ? "devDependencies" : "dependencies";
  var package = readPackageFromPath(path);
  if (!package[devKey]) package[devKey] = {};
  package[devKey] = mergeif(package[devKey], newDependencies);
  return savePackage(package, path);
}
function savePackage(package, path) {
  const str = JSON.stringify(package, null, 2); //Make it human readable
  const packagePath = Path.resolve(path, "package.json");
  fs.writeFileSync(packagePath, str);
  return true;
}
function promotePeerDependencies(path, targetpath, filterFunc) {
  if (!path) path = process.cwd();
  if (!targetpath) targetpath = process.cwd();
  if (!filterFunc || typeof filterFunc != "function")
    filterFunc = () => {
      return true;
    };
  const peers = getPeerDependencies(path);
  var goodPeers = {};
  if (!peers) return false;
  Object.keys(peers).forEach(key => {
    if (filterFunc(key, peers[key])) goodPeers[key] = peers[key];
  });
  return saveDependencies(goodPeers, targetpath);
}
module.exports = promotePeerDependencies;
