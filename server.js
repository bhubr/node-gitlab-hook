const fs = require('fs');
const hasNodeModule = fs.existsSync(__dirname + '/node_modules/git-hosting-webhooks/index.js');
const modulePath = hasNodeModule ? 'git-hosting-webhooks' : './index.js';
const webhooks = require(modulePath);
const exec = require('nexecp').exec;
const jsonFolder = __dirname + '/json';
const payloadsFolder = jsonFolder + '/payloads';

let config = require('./config');
config.logger = {
  info:  console.log,
  error: console.log
};

const listener = webhooks(config, genericCallback);

function extractGitPullOutput(gitPullOutput) {
  const re = /^From (https:\/\/[\w-]+(\.[\w-]+)+([\w.,@?^=%&amp;:/~+#-]*[\w@?^=%&amp;/~+#-]))?\s+((\[new branch\]|[0-9a-f]+\.\.[0-9a-f]+)\s+([0-9a-zA-Z\_]+)\s+\->\s([0-9a-zA-Z\_]+)\/([0-9a-zA-Z\_]+))$/gm;
  const matches = re.exec(gitPullOutput);
  return {
    repoUrl: matches[1],
    localBranch: matches[6],
    remoteName: matches[7],
    remoteBranch: matches[8]
  };
}

/**
 * Get current timestamp
 */
function getTimestamp() {
  return ((new Date()).getTime() / 1000).toString(36);
}

function getExecCallbacks(label) {
  return {
    error: err => {
      console.log('exec', label, '=> ERROR:\n', err);
      throw err;
    },
    out: ({ stdout, stderr }) => {
      console.log('\nexec', label, '=> OK:\n----- stdout -----\n', stdout, '\n----- stderr -----\n', stderr );
      return { stdout, stderr };
    }
  };
}

function issueHandler(payload) {
  console.log('issueHandler');
}

function pushHandler(data) {
  const { repos } = config;
  const localInstances = repos[data.url];
  console.log('pushHandler', data, 'local instances', localInstances);
  if(localInstances === undefined) {
    console.log('no local instance array found, abort handler!');
    return;
  }

  localInstances.forEach(instance => {
    const { localFolder, pm2name } = instance;
    console.log(instance);
    const pullCmd = "cd " + localFolder + " && git pull";
    const pullCallbacks = getExecCallbacks(pullCmd);
    exec(pullCmd)
    .then(pullCallbacks.out)
    .catch(pullCallbacks.error)
    .then(({ stdout, stderr }) => {
      console.log('----- git pull output -----', extractGitPullOutput(stderr));
    })
    .then(() => {
      if(pm2name) {
        const pm2Cmd = 'pm2 restart ' + pm2name;
        const pm2Callbacks = getExecCallbacks(pm2Cmd);
        return exec(pm2Cmd)
        .then(pm2Callbacks.out)
        .catch(pm2Callbacks.error);
      }
      else {
        console.log('no pm2');
        return false;
      }
    });
  });
  // if(payload.commits.length === 0) {
  //   console.log('nothing to do');
  //   return;
  // }

}

const handlers = {
  // issue: issueHandler,
  'repo:push': pushHandler
};

function genericCallback(result) {
  const { provider, event, data, payload } = result;
  console.log('# genericCallback got provider/event/data/payload', provider, event, data, payload);

  // Store payload
  fs.writeFileSync(payloadsFolder + '/payload-' + provider + '-' + getTimestamp() + '.json', JSON.stringify({ event: event.replace(':', '-'), payload }));

  // Refresh payload index and write it
  const jsons = fs.readdirSync(payloadsFolder);
  const gitkeepIndex = jsons.indexOf('.gitkeep');
  if(gitkeepIndex !== -1) {
    delete jsons.splice(gitkeepIndex, 1);
  }
  fs.writeFileSync(jsonFolder + '/payloads.json', JSON.stringify(jsons));

  // Switch action according to event
  if(['repo:push', 'issue'].indexOf(event) === -1) {
    console.log('unhandled event:', event);
  }
  else {
    // Pick up appropriate handler and run...
    const handler = handlers[event];
    handler(data);
  }

}

// listen
listener.listen();
