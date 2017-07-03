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

var gitPullOutput = 'From https://github.com/bhubr/test-webhook\n ' +
   '9a76574..6be2c7c  master     -> origin/master';

console.log(extractGitPullOutput(gitPullOutput));
