'use strict';

const { node, npm, metarhia } = require('./src/dependencies.js');
const console = require('./lib/logger.js');
const prisma = require('./lib/prisma.js');
const common = require('./lib/common.js');
const { loadDir, createRouting } = require('./src/loader.js');
const { Static } = require('./src/static.js');
const { Server } = require('./src/server.js');
const { Code } = require('./src/code.js');
const { start } = require('repl');
const { DirectoryWatcher } = metarhia.metawatch;

const starts = [];
const sandbox = node.vm.createContext({
  console,
  common,
  prisma,
  npm,
  node,
  metarhia,
  db: {},
});

(async () => {
  const applications = await node.fsp.readFile('.applications', 'utf8');
  const appPath = node.path.join(process.cwd(), applications.trim());
  const apiPath = node.path.join(appPath, './api');
  const api = await loadDir(apiPath, sandbox, true);
  const routing = createRouting(api);
  const application = {
    path: appPath,
    sandbox,
    console,
    routing,
    starts,
  };
  const config = new Code('config', application);
  const lib = new Code('lib', application);
  const domain = new Code('domain', application);
  application.static = new Static('static', application);
  (application.watcher = new DirectoryWatcher({ timeout: 1000 })),
    await lib.load();
  await domain.load();
  await config.load();
  Object.assign(sandbox, {
    api,
    lib: lib.tree,
    domain: domain.tree,
    config: config.tree,
    application,
  });
  application.config = config.tree;
  application.server = new Server(application);
  await application.static.load();
  console.log({ start });

  application.starts.map(common.execute);
  application.starts = [];
})();
