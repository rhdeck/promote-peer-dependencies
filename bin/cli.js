#!/usr/bin/env node
const ppd = require("./../index.js");
const path = process.cwd();
ppd(path).then((addedDependencies)=>{
    if(addedDependencies && addedDependencies.length) {;
        console.log("Added dependencies: \n  " + addedDependencies.join("\n  "))
    }else {
        console.log("Did not find any new dependencies to add")
    }
}, (error)=>{
    console.log(error);
    process.exit(1);
})
