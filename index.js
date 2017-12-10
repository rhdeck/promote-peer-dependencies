const fs = require("fs");
const cp = require("child_process");
const cpp = require("child-process-promise");
const Path = require("path");
const Promise = require("bluebird");
function readPackageFromPath(path) {
  return new Promise((success, reject) => {
    if (!path) path = process.cwd();
    const packagePath = Path.resolve(path, "package.json");
    fs.readFile(packagePath, "utf8", (err, str) => {
      if (err) {
        success({}, err);
      }
      try {
        const package = JSON.parse(str);
        success(package);
      } catch (err) {
        success({}, err);
        reject(err);
      }
    });
  });
}
function getDependencies(path) {
  return new Promise((success, reject) => {
    if (!path) path = process.cwd();
    return readPackageFromPath(path).then(package => {
      try {
        const dependencies = package.dependencies;
        success(dependencies);
      } catch (err) {
        reject(err);
      }
    });
  });
}
function getPeersFromDependencies(dependenciesObj, referencePath) {
  if (!referencePath) referencePath = process.cwd();
  const dependencyKeys = Object.keys(dependenciesObj);
  return Promise.all(
    dependencyKeys.map(key => {
      return new Promise((success, reject) => {
        const path = Path.resolve(referencePath, "node_modules", key);
        return readPackageFromPath(path).then(
          depPackage => {
            try {
              var newDependencies = {};
              if (depPackage.peerDependencies) {
                Object.keys(depPackage.peerDependencies).forEach(
                  peerDependency => {
                    newDependencies[peerDependency] =
                      depPackage.peerDependencies[peerDependency];
                  }
                );
              }
              success(newDependencies);
            } catch (err) {
              reject(err);
            }
          },
          error => {
            console.log("Found an error:", error);
          }
        );
      });
    })
  ).then(deps => {
    return new Promise((success, reject) => {
      var newDependencies = {};
      deps.forEach(depObj => {
        Object.keys(depObj).forEach(key => {
          newDependencies[key] = depObj[key];
        });
      });
      success(newDependencies, referencePath);
    });
  });
}
function saveDependencies(newDependencies, path) {
  return new Promise((success, reject) => {
    if (!newDependencies || !Object.keys(newDependencies).length) {
      success([]);
      return;
    }
    if (!path) path = process.cwd();
    return readPackageFromPath(path).then(package => {
      var doSave = false;
      var addedDeps = [];
      Object.keys(newDependencies).forEach(key => {
        if (!package.dependencies[key]) {
          package.dependencies[key] = newDependencies[key];
          addedDeps.push(key);
          doSave = true;
        }
      });
      if (doSave) {
        return savePackage(package, path)
          .then(() => {
            return runYarn(addedDeps);
          })
          .then(() => {
            return Promise.resolve(addedDeps);
          });
      } else {
        success(addedDeps);
      }
    });
  });
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
function runYarn(path) {
  return new Promise((success, reject) => {
    return cpp.spawn("yarn", ["install"], {
      encoding: "utf8",
      stdio: "inherit"
    });
  });
}
function promotePeerDependencies(path) {
  if (!path) path = process.cwd();
  return getDependencies(path)
    .then(dependencies => {
      return getPeersFromDependencies(dependencies);
    })
    .then(newDependencies => {
      return saveDependencies(newDependencies, path);
    });
}
module.exports = promotePeerDependencies;
