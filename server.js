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

/**
 * Get current timestamp
 */
function getTimestamp() {
  return ((new Date()).getTime() / 1000).toString(36);
}

function getExecCallbacks(localFolder) {
  return {
    error: err => { console.log('exec ERROR (' + localFolder + ')', err); },
    out: ({ stderr, stdout }) => { console.log('exec (' + localFolder + ')\nstdout:\n', stdout, '\nstderr:\n', stderr ); }
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
    console.log(localFolder, instance);
    const callbacks = getExecCallbacks(localFolder);
    console.log(callbacks, callbacks.out.toString());
    const pullCmd = "cd " + localFolder + " && git pull";
    console.log('exec cmd:', pullCmd);
    exec(pullCmd)
    .then(callbacks.out)
    .catch(callbacks.error)
    .then(() => {
      if(pm2name) {
        console.log('exec', 'pm2 restart ' + pm2name);
        return exec('pm2 restart ' + pm2name)
        .then(callbacks.out)
        .catch(callbacks.error);
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
