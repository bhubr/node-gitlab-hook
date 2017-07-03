var re = /^From (https:\/\/[\w-]+(\.[\w-]+)+([\w.,@?^=%&amp;:/~+#-]*[\w@?^=%&amp;/~+#-]))?\s+((\[new branch\]|[0-9a-f]+\.\.[0-9a-f]+)\s+([0-9a-zA-Z\_]+)\s+\->\s([0-9a-zA-Z\_]+)\/([0-9a-zA-Z\_]+))$/gm;

var gitPullOutput = 'From https://github.com/bhubr/test-webhook\n ' +
   '9a76574..6be2c7c  master     -> origin/master';

var matches = re.exec(gitPullOutput);
var bits = {
  repoUrl: matches[1],
  localBranch: matches[6],
  remoteName: matches[7],
  remoteBranch: matches[8]
};
console.log(gitPullOutput, matches);
console.log(bits);
