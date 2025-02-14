'use strict';

const { node, npm, metarhia } = require('./src/dependencies.js');
const console = require('./lib/logger.js');
const common = require('./lib/common.js');
const { loadDir, createRouting } = require('./src/loader.js');
const { Static } = require('./src/static.js');
const { Server } = require('./src/server.js');
const { Code } = require('./src/code.js');
const { DirectoryWatcher } = metarhia.metawatch;
const sandbox = node.vm.createContext({
  console,
  common,
  npm,
  node,
  metarhia,
  db: {},
});

class Application {
  constructor() {
    this.starts = [];
    this.sandbox = sandbox;
    this.watcher = null;
    this.application = null;
  }

  async initialize() {
    const applications = await node.fsp.readFile('.applications', 'utf8');
    const appPath = node.path.join(process.cwd(), applications.trim());
    const apiPath = node.path.join(appPath, './api');
    const api = await loadDir(apiPath, this.sandbox, true);
    const routing = createRouting(api);

    this.application = {
      path: appPath,
      sandbox: this.sandbox,
      console,
      routing,
      starts: this.starts,
      watcher: new DirectoryWatcher({ timeout: 1000 }),
    };

    this.application.config = new Code('config', this);
    this.application.lib = new Code('lib', this);
    this.application.domain = new Code('domain', this);
    this.application.static = new Static('static', this);

    await this.loadComponents();
    await this.assignToSandbox(api);
    await this.startServer();
  }

  async loadComponents() {
    await this.application.lib.load();
    await this.application.domain.load();
    await this.application.config.load();
    await this.application.static.load();
  }

  startWatch() {
    // const timeout = this.config.server.timeouts.watch;
    this.watcher = new DirectoryWatcher({ timeout: 1000 });

    this.watcher.on('change', (filePath) => {
      const relPath = filePath.substring(this.path.length + 1);
      const sepIndex = relPath.indexOf(node.path.sep);
      const place = relPath.substring(0, sepIndex);
      node.fs.stat(filePath, (error, stat) => {
        if (error) return;
        if (stat.isDirectory()) return void this[place].load(filePath);
        // if (threadId === 1) this.console.debug('Reload: /' + relPath);
        this[place].change(filePath);
      });
    });

    this.watcher.on('delete', async (filePath) => {
      const relPath = filePath.substring(this.path.length + 1);
      const sepIndex = relPath.indexOf(node.path.sep);
      const place = relPath.substring(0, sepIndex);
      this[place].delete(filePath);
      // if (threadId === 1) this.console.debug('Deleted: /' + relPath);
    });

    this.watcher.on('before', async (changes) => {
      const certPath = node.path.join(this.path, 'cert');
      const changed = changes.filter(([name]) => name.startsWith(certPath));
      if (changed.length === 0) return;
      await this.cert.before(changes);
    });
  }
  async assignToSandbox(api) {
    Object.assign(this.sandbox, {
      api,
      lib: this.application.lib.tree,
      domain: this.application.domain.tree,
      config: this.application.config.tree,
      application: this.application,
    });

    this.application.config = this.application.config.tree;
  }

  async startServer() {
    this.application.server = new Server(this.application);
    this.application.starts.map(common.execute);
    this.application.starts = [];
  }
}

(async () => {
  const app = new Application();
  await app.initialize();
})();
