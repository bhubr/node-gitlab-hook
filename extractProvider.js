var ipRangeCheck = require("ip-range-check");

// per-provider IPs
var ipRanges = {
  // source: https://confluence.atlassian.com/bitbucket/what-are-the-bitbucket-cloud-ip-addresses-i-should-use-to-configure-my-corporate-firewall-343343385.html
  bitbucket: ['104.192.143.192/28', '104.192.143.208/28', '104.192.143.0/24', '34.198.203.127', '34.198.178.64'],
  // source: https://help.github.com/articles/github-s-ip-addresses/#service-hook-ip-addresses
  github: ['192.30.252.0/22', '85.199.108.0/22'],
}

/**
 * Get checker function
 */
function getCheckIp(provider) {
  return function(req) {
    const ip = req.headers['x-real-ip'] || req.ip || (req.socket && req.socket.remoteAddress) ||
      (req.socket && req.socket.socket && req.socket.socket.remoteAddress);
    var ipRangesForProvider = ipRanges[provider];
    for(var i = 0; i < ipRangesForProvider.length ; i++) {
      var range = ipRangesForProvider[i];
      if(ipRangeCheck(ip, range)) {
        return true;
      }
    }
    return false;
  }
}


var originatorCheckers = {
  bitbucket: getCheckIp('bitbucket'),
  github: getCheckIp('github'),
  gitlab: function(req) {
    console.log('gitlab orig check', req.headers);
    return req.headers['x-gitlab-event'] !== undefined;
  }
}

/**
 * Find provider from req headers and IP
 */
function extractProvider(req) {
  
  console.log('### checking originator', Object.keys(originatorCheckers));
  for(provider in originatorCheckers) {
    console.log('\n\n  # checking', provider, '=>', originatorCheckers[provider](req));
    if(originatorCheckers[provider](req)) {
      return provider;
    }
  }
}

module.exports = extractProvider;