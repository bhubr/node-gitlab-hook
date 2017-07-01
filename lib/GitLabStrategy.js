function GitLabStrategy() {
	
}

GitLabStrategy.prototype.securityCheck = function(headers, config) {
  if(config.secretToken === undefined && headers['x-gitlab-token'] === undefined) {
    return { success: true };
  }
  if(config.secretToken === undefined && headers['x-gitlab-token'] !== undefined) {
    return {
      success: false,
      reason: 'Secret token set in GitLab but not expected'
    }
  }
  else if(config.secretToken !== undefined && headers['x-gitlab-token'] === undefined) {
    return {
      success: false,
      reason: 'Secret token expected but not set in GitLab'
    }
  }
  else {
    var payload = {
      success: config.secretToken === headers['x-gitlab-token']
    };
    if(! payload.success) {
      payload.reason = 'Secret token does not match expected value (received: ' +
        headers['x-gitlab-token'] + ', expected: ' + config.secretToken + ')';
    }
    return payload;
  }
};

module.exports = GitLabStrategy;