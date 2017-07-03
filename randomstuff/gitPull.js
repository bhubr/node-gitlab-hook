function extractGitPullOutput(gitPullOutput) {
  const re = /^From (https:\/\/[\w-]+(\.[\w-]+)+([\w.,@?^=%&amp;:/~+#-]*[\w@?^=%&amp;/~+#-]))?\n\s*(\[new branch\]|[0-9a-f]+\.\.[0-9a-f]+)\s+([0-9a-zA-Z\-\_]+)\s+\->\s([0-9a-zA-Z\_\-]+)\/([0-9a-zA-Z\_\-]+)$/gm;
  const matches = re.exec(gitPullOutput);
  console.log(matches);
  return matches ? {
    repoUrl: matches[1],
    localBranch: matches[5],
    remoteName: matches[6],
    remoteBranch: matches[7]
  } : matches;
}
// var gitPullOutput = 'From https://github.com/bhubr/test-webhook\n ' +
//    '9a76574..6be2c7c  master     -> origin/master';
var gitPullOutput = 'From https://github.com/bhubr/node-github-gitlab-bitbucket-hook\n' +
   '40a5043..151d7ac  6-git-pull-output -> origin/6-git-pull-output';

console.log('git pull output\n', gitPullOutput, extractGitPullOutput(gitPullOutput));
