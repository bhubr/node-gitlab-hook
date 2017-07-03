const fs = require('fs');
const hasNodeModule = fs.existsSync(__dirname + '/node_modules/git-hosting-webhooks/index.js');
const modulePath = hasNodeModule ? 'git-hosting-webhooks' : './index.js';
const webhooks = require(modulePath);
const exec = require('child_process').exec;
const jsonFolder = __dirname + '/json';
const payloadsFolder = jsonFolder + '/payloads';

let config = require('./config');
config.logger = {
  info:  console.log,
  error: console.log
};

const listener = webhooks(config, genericCallback);

/**
 * Get current timestamp
 */
function getTimestamp() {
  return ((new Date()).getTime() / 1000).toString(36);
}

function getPushHandlerCallback(localFolder) {
  return (error, stdout, stderr) => {
    console.log('pushHandlerCallback for', localFolder, '\n--- error ---\n', error, '\n--- stdout ---\n', stdout, '\n--- stderr ---\n', stderr);
  }
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
    console.log(localFolder, instance);
    const pushHandlerCallback = getPushHandlerCallback(localFolder);
    let cmd = "cd " + localFolder + " && git pull";
    console.log(pushHandlerCallback.toString(), cmd);
    if(pm2name) {
      cmd += ' && pm2 restart ' + pm2name;
    }
    exec(cmd, pushHandlerCallback);
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
