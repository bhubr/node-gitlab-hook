const strategies        = require('../lib/strategies');
const BitBucketStrategy = require('../lib/BitBucketStrategy');
const GitHubStrategy    = require('../lib/GitHubStrategy');
const GitLabStrategy    = require('../lib/GitLabStrategy');
const chai              = require('chai');
const assert            = chai.assert;

var githubIP = '192.30.252.40';
var bitbucketIP = '104.192.143.193';

describe('all tests', () => {


  it('check originator with GitHub IP', done => {
    var req = {
      headers: {
        'x-real-ip': githubIP
      }
    };
    var provider = strategies.extract(req);
    assert.equal(provider, 'github');
    var strategy = strategies.factory(provider);
    assert.ok(strategy instanceof GitHubStrategy, 'strategy should be an instance of GitHubStrategy');
    done();
  });

  it('check originator with BitBucket IP', done => {
    var req = {
      headers: {
        'x-real-ip': bitbucketIP
      }
    };
    var provider = strategies.extract(req);
    assert.equal(provider, 'bitbucket');
    var strategy = strategies.factory(provider);
    assert.ok(strategy instanceof BitBucketStrategy, 'strategy should be an instance of BitBucketStrategy');
    done();
  });

  it('check originator with GitLab header', done => {
    var req = {
      headers: {
        'x-gitlab-event': 'Push Hook'
      }
    };
    var provider = strategies.extract(req);
    assert.equal(provider, 'gitlab');
    var strategy = strategies.factory(provider);
    assert.ok(strategy instanceof GitLabStrategy, 'strategy should be an instance of GitLabStrategy');
    done();
  });
});
