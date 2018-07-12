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
    ping: {
      event: 'ping',
      funcName: 'getPingStatus'
    },
    issues: {
      edited: {
        event: 'issue:updated',
        funcName: 'extractIssue'
      },
      opened: {
        event: 'issue:created',
        funcName: 'extractIssue'
      }
    },
    pull_request: {
      opened: {
        event: 'pullrequest:created',
        funcName: 'extractPullRequest'
      }
    }
  }
  if(map[this.event] === undefined) {
    throw new Error('unhandled event: ' + this.event);
  }
  if(this.action === undefined) {
    return map[this.event];
  }
  else if(map[this.event][this.action] === undefined) {
      throw new Error('unhandled event action: ' + this.event + ':' + this.action);
  }
  return map[this.event][this.action];
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

GitHubStrategy.prototype.getPingStatus = function() {
  return this.data
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
    number,
    title,
    body: body.replace(/\r/g, ''),
    state,
    htmlUrl: html_url
  };
}

GitHubStrategy.prototype.getPullRequestData = function(pullRequest) {
  const { number, html_url, title, body, state, head, base } = pullRequest;
  return {
    number,
    title,
    body: body.replace(/\r/g, ''),
    state,
    htmlUrl: html_url,
    sourceBranch: head.ref,
    sourceRepo: this.getRepoData(head.repo),
    targetBranch: base.ref,
    targetRepo: this.getRepoData(base.repo)
  };
}

GitHubStrategy.prototype.extractRepoPush = function() {
  const { repository, ref } = this.data;
  return {
    repository: this.getRepoData(repository),
    ref
  };
}

GitHubStrategy.prototype.extractIssue = function() {
  const { repository, issue } = this.data;
  const repoData = this.getRepoData(repository);
  const issueData = this.getIssueData(issue);
  return {
    repository: repoData,
    issue: issueData
  };
}


GitHubStrategy.prototype.extractPullRequest = function() {
  const { repository, pull_request } = this.data;
  const repoData = this.getRepoData(repository);
  const pullRequestData = this.getPullRequestData(pull_request);
  return {
    repository: repoData,
    pullRequest: pullRequestData
  };
}

module.exports = GitHubStrategy;
