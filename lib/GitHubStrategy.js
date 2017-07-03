const crypto = require('crypto');
const getExtractEventFunc = require('./getExtractEventFunc');

/**
 * Constructor
 */
function GitHubStrategy(headers) {
  this.headers = headers;
  this.event = headers['x-github-event'];
}

/**
 * Perform security check (check against x-hub-signature header)
 */
GitHubStrategy.prototype.securityCheck = function(config, body) {
  // console.log('## headers for GitHub', this.headers);
  var providedSignature = this.headers['x-hub-signature'];
  if(typeof body !== 'string') {
    return { success: false, reason: 'body parameter should be a string' }
  };
  if(config.secretToken === undefined && providedSignature === undefined) {
    return { success: true };
  }
  if(config.secretToken === undefined && providedSignature !== undefined) {
    return {
      success: false,
      reason: 'Secret token set in GitHub but not expected'
    }
  }
  else if(config.secretToken !== undefined && providedSignature === undefined) {
    return {
      success: false,
      reason: 'Secret token expected but not set in GitHub'
    }
  }
  else {
    // console.log('## github body', body);
    var key = config.secretToken;
    var expectedSignature = 'sha1=' + crypto.createHmac('sha1', key).update(body).digest('hex');
    console.log('## github signatures (provided/expected)', providedSignature, expectedSignature);
    var payload = {
      success: providedSignature === expectedSignature
    };
    if(! payload.success) {
      payload.reason = "Signatures don't match (received: " +
        providedSignature + ', expected: ' + expectedSignature + ')';
    }
    return payload;
  }
};

/**
 * Populate with parsed body
 */
GitHubStrategy.prototype.setData = function(data) {
  this.data = data;
  this.action = data.action;
}

/**
 * Map GitHub event to BitBucket event name
 */
GitHubStrategy.prototype.mapAction = function() {
  const map = {
    push: {
      event: 'repo:push',
      funcName: 'extractRepoPush'
    },
    issues: {
      edited: {
        event: 'issued:edited',
        funcName: 'extractIssueModified'
      }
    }
  }
  if(map[this.event] === undefined) {
    throw new Error('unhandled event: ' + this.event);
  }
  if(this.action === undefined) {
    return map[this.event];
  }
  else {
    if(map[this.event][this.action] === undefined) {
      throw new Error('unhandled event action: ' + this.event + ':' + this.action);
    }
  }
}

GitHubStrategy.prototype.getEventData = function() {
  const { event, funcName } = this.mapAction();
  // const funcName = getExtractEventFunc(event);
  const data = this[funcName]();
  return {
    event,
    data
  };
}

GitHubStrategy.prototype.getRepoData = function(repository) {
  return {
    name: repository.name,
    fullName: repository.full_name,
    url: repository.html_url
  }
}

GitHubStrategy.prototype.getIssueData = function(issue) {
  const { number, html_url, title, body, state } = issue;
  return {
    number, title, body, state, htmlUrl: html_url
  }
}

GitHubStrategy.prototype.extractRepoPush = function() {
  const { repository } = this.data;
  return this.getRepoData(repository);
}

GitHubStrategy.prototype.extractIssueModified = function() {
  const { repository, issue } = this.data;
  const repoData = this.getRepoData(repository);
  const issueData = this.getIssueData(issue);
  return {
    repository: repoData,
    issue: issueData
  };
}

module.exports = GitHubStrategy;