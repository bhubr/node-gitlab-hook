const fs = require('fs');
const hasNodeModule = fs.existsSync(__dirname + '/node_modules/git-hosting-webhooks/index.js');
const modulePath = hasNodeModule ? 'git-hosting-webhooks' : './index.js';
const webhooks = require(modulePath);
const nexecp = require('nexecp').exec;

const exec = (cmd, cwd) => {
  console.log(`exec ${cmd} from ${cwd}`)
  return nexecp(cmd, { cwd })
}

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

// https://stackoverflow.com/questions/1417957/show-just-the-current-branch-in-git
const getCurrentGitBranch = (cwd) => exec('git rev-parse --abbrev-ref HEAD', cwd)
  .then(({ stdout }) => stdout.trim())

const extractStdoutLines = trimStart => ({ stdout }) => stdout.split('\n')
  .map(l => l.substr(trimStart).trim()).filter(l => !! l)

const getLocalGitBranches = (cwd) => exec('git branch', cwd)
//  .then(({ stdout }) => stdout.split('\n'))
//    .then(lines => lines.map(l => l.substr(2).trim()).filter(l => !! l))
  .then(extractStdoutLines(2))

const hasPushedBranchLocally = (branch, cwd) => getLocalGitBranches(cwd)
  .then(branches => branches.includes(branch))

const isOnPushedBranch = (branch, cwd) => getCurrentGitBranch(cwd)
  .then(currentBranch => currentBranch === branch)

const gitCheckout = (branch, cwd) => exec(`git checkout ${branch}`, cwd)
const gitPull = cwd => exec('git pull', cwd)
const gitPullFirstIfNeeded = (branch, cwd) =>
  hasPushedBranchLocally(branch, cwd)
    .then(hasBranch => hasBranch ? Promise.resolve() : gitPull(cwd))

const gitSwitchBranchIfNeeded = (targetBranch, cwd) => shouldSwitch =>
  gitPullFirstIfNeeded(targetBranch, cwd)
    .then(() => gitCheckout(targetBranch, cwd))


const gitGetLastCommit = cwd => exec('git rev-parse HEAD', cwd)
  .then(({ stdout }) => stdout.trim())

const gitGetChangedFiles = (fromCommitHash, cwd) => exec(`git diff-tree --no-commit-id --name-only -r ${fromCommitHash}`, cwd)
  .then(extractStdoutLines(0))

const hasChangesIn = (files, folder) => files.some(f => f.startsWith(folder + '/'))
// const didPackageJsonChange = (files, folder) => files.some(f => f === `${folder}/package.json`)
const didPackageJsonChange = (files, folder) => {
  const didChange = files.some(f => f === `${folder}/package.json`)
  console.log('didPackageJsonChange', files, folder, `${folder}/package.json`, didChange)
  return didChange
}
const npmInstall = folder => exec('npm install', folder)

const npmInstallIfNeeded = (files, folder, cwd) => didPackageJsonChange(files, folder) ?
  npmInstall(`${cwd}/${folder}`) : Promise.resolve()

const handleChangesInBack = (files, cwd, backFolder, pm2name) => npmInstallIfNeeded(files, backFolder, cwd)
  .then(() => exec(`pm2 restart ${pm2name}`))

const handleChangesInBackIfNeeded = (files, cwd, backFolder, pm2name) => hasChangesIn(files, backFolder) ?
  handleChangesInBack(files, cwd, backFolder, pm2name) : Promise.resolve()


function pushHandler(data) {
  const { repos } = config;
  const { ref } = data;
  const pushedBranch = ref.split('/').pop();
  const localInstances = repos[data.repository.url];
  console.log('\n\n## pushHandler', data, 'local instances', localInstances, pushedBranch);
  if(localInstances === undefined) {
    console.log('no local instance array found, abort handler!');
    return;
  }

  localInstances.forEach(instance => {
    const { localFolder, pm2name, gitBranches, back, reactApps } = instance;
    console.log(instance);
    const pullCallbacks = getExecCallbacks('last git pull')
    const shouldCheckoutToBranch = typeof gitBranches.includes === 'function' && gitBranches.includes(pushedBranch);
    let lastCommitRef
    gitGetLastCommit(localFolder)
    .then(lastRef => {
      lastCommitRef = lastRef
    })
    .then(() => isOnPushedBranch(pushedBranch, localFolder))
    .then(isOnBranch => ! isOnBranch && shouldCheckoutToBranch)
    .then(gitSwitchBranchIfNeeded(pushedBranch, localFolder))
    .then(() => gitPull(localFolder))
//    .then(() => gitGetLastCommit(localFolder))
    .then(() => gitGetChangedFiles(lastCommitRef, localFolder))
    .then(changedFiles => {
      console.log(changedFiles)
      return changedFiles
    })
    .then(
      files => handleChangesInBackIfNeeded(files, localFolder, back, pm2name)
    )
//    const shouldCheckoutToBranch = typeof gitBranches.includes === 'function' && gitBranches.includes(pushedBranch);
//    const withCheckoutCmd = shouldCheckoutToBranch ? `&& git pull && git checkout ${pushedBranch}` : '';
//    const pullCmd = `cd ${localFolder} ${withCheckoutCmd} && git pull`;
//    console.log('full pull cmd', pullCmd);
//    const pullCallbacks = getExecCallbacks(pullCmd);
//    exec(pullCmd)
//    .then(pullCallbacks.out)
//    .catch(pullCallbacks.error)
//    .then(({ stdout, stderr }) => {
//      const pullOutput = extractGitPullOutput(stderr);
//    })
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
  'issue:created': issueHandler,
  'issue:updated': issueHandler,
  'repo:push': pushHandler,
  'ping': data => console.log('RECEIVED PING', data)
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
