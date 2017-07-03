const fs = require('fs');
const hasNodeModule = fs.existsSync(__dirname + '/node_modules/git-hosting-webhooks/index.js');
const modulePath = hasNodeModule ? 'git-hosting-webhooks' : './index.js';
const webhooks = require(modulePath);
const exec = require('nexecp').exec;

let config = require('./config');
config.logger = {
  info:  console.log,
  error: console.log
};

const listener = webhooks(config, genericCallback);

function extractGitPullOutput(gitPullOutput) {
  const re = /^From (https:\/\/[\w-]+(\.[\w-]+)+([\w.,@?^=%&amp;:/~+#-]*[\w@?^=%&amp;/~+#-]))?\n\s*(\[new branch\]|[0-9a-f]+\.\.[0-9a-f]+)\s+([0-9a-zA-Z\-\_]+)\s+\->\s([0-9a-zA-Z\_\-]+)\/([0-9a-zA-Z\_\-]+)$/gm;
  const matches = re.exec(gitPullOutput);
  const bits = matches ? {
    repoUrl: matches[1],
    localBranch: matches[5],
    remoteName: matches[6],
    remoteBranch: matches[7]
  } : matches;
  console.log('## git pull output', gitPullOutput, '\n', bits);
  return bits;
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
  console.log('\n\n## issueHandler', payload);
}

function pushHandler(data) {
  const { repos } = config;
  const localInstances = repos[data.url];
  console.log('\n\n## pushHandler', data, 'local instances', localInstances);
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
      const pullOutput = extractGitPullOutput(stderr);
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
  'issue:updated': issueHandler,
  'repo:push': pushHandler
};
const handlerKeys = Object.keys(handlers);

function genericCallback(result) {
  const { provider, event, data, payload } = result;
  console.log('# genericCallback got provider/event/data/payload', provider, event, data, payload);

  // Switch action according to event
  if(handlerKeys.indexOf(event) === -1) {
    console.log('## genericCallback ERR: unhandled event "' + event + '"');
  }
  else {
    // Pick up appropriate handler and run...
    const handler = handlers[event];
    handler(data);
  }

}

// listen
listener.listen();
