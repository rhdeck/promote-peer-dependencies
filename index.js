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
    if (!obj1[k] || !semver.valid(v)) {
      obj1[k] = v;
      return;
    }
    if (semver.gt(obj2[k], obj1[k])) {
      obj1[k] = v;
    }
    //Otherwise do nothing
  });
}
function getPeerDependencies(path, useDevDependencies) {
  if (!path) return null;
  var ps = {};
  walkDependencies(path, useDevDependencies, function(path, package) {
    ps = mergeif(ps, returnif(p.peerDependencies));
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
  package[devKey] = mergeif(package[devKey], newDepdendencies);
  savePackage(package, path);
}
function savePackage(package, path) {
  return new Promise((success, reject) => {
    const str = JSON.stringify(package, null, 2); //Make it human readable
    const packagePath = Path.resolve(path, "package.json");
    fs.writeFile(packagePath, str, (err, info) => {
      if (err) {
        reject(err);
        return;
      }
      success(packagePath);
    });
  });
}
function promotePeerDependencies(path, filterFunc) {
  if (!path) path = process.cwd();
  const peers = getPeerDependencies(path);
  if (typeof filterFunc == "function") {
    var goodPeers = {};
    Object.keys(peers).forEach(key => {
      if (filterFunc(key, peers[key])) goodPeers[key] = peers[key];
    });
    return saveDependencies(goodPeers, path);
  } else {
    return saveDependencies(peers, path);
  }
}
module.exports = promotePeerDependencies;
