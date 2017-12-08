# promote-peer-dependencies

Searches registered dependencies for peers, and yarn adds them to your project.

Usage:

```
yarn global add promote-peer-dependencies
cd [your project root]
promote-peer-dependencies
```

Also, this tool is accessible in code:

```
const ppd = require('promote-peer-dependencies');
ppd();
```

**Note** There is a package
[npm-install-peers](https://npmjs.org/npm-install-peers) that predated this one
and is designed for use as a global command line tool. This does that, but is
available as a simple function via require() for integration into other
projects.
