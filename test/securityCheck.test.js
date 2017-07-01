const securityCheck   = require('../securityCheck');
const chai            = require('chai');
const assert          = chai.assert;

var githubIP = '192.30.252.40';
var bitbucketIP = '104.192.143.193';

describe('all tests', () => {

  it('check security with GitHub IP and config', done => {
  	var req = {
  		headers: {
  			'x-real-ip': githubIP
  		}
  	};
  	var passed = securityCheck(req, 'github', {});
    assert.ok(passed.success);
    assert.equal(passed.reason, undefined);
    done();
  });

  it('check security with BitBucket IP and config', done => {
    var req = {
      headers: {
        'x-real-ip': bitbucketIP
      }
    };
    var passed = securityCheck(req, 'bitbucket', {});
    assert.ok(passed.success);
    assert.equal(passed.reason, undefined);
    done();
  });

  it('check security with GitLab header and config, fail 1: token provided but not expected', done => {
    var req = {
      headers: {
        'x-gitlab-event': 'Push Hook',
        'x-gitlab-token': 'MyStr0ngS3cr3t'
      }
    };
    var passed = securityCheck(req, 'gitlab', {});
    assert.isNotOk(passed.success);
    assert.equal(passed.reason, 'Secret token set in GitLab but not expected');
    done();
  });

  it('check security with GitLab header and config, fail 2: token expected but not provided', done => {
    var req = {
      headers: {
        'x-gitlab-event': 'Push Hook'
      }
    };
    var passed = securityCheck(req, 'gitlab', { secretToken: 'MyStr0ngS3cr3t' });
    assert.isNotOk(passed.success);
    assert.equal(passed.reason, 'Secret token expected but not set in GitLab');
    done();
  });

  it('check security with GitLab header and config, fail 3: token mismatch', done => {
    var req = {
      headers: {
        'x-gitlab-event': 'Push Hook',
        'x-gitlab-token': 'MyProvidedS3cr3t'
      }
    };
    var passed = securityCheck(req, 'gitlab', { secretToken: 'MyExpectedS3cr3t' });
    assert.isNotOk(passed.success);
    assert.equal(passed.reason, 'Secret token does not match expected value (received: MyProvidedS3cr3t, expected: MyExpectedS3cr3t)');
    done();
  });

  it('check security with GitLab header and config, ok 1: no token expected nor provided', done => {
    var req = {
      headers: {
        'x-gitlab-event': 'Push Hook'
      }
    };
    var passed = securityCheck(req, 'gitlab', {});
    assert.ok(passed.success);
    assert.equal(passed.reason, undefined);
    done();
  });

  it('check security with GitLab header and config, ok 2: expected and provided token match', done => {
    var req = {
      headers: {
        'x-gitlab-event': 'Push Hook',
        'x-gitlab-token': 'MyStr0ngS3cr3t'
      }
    };
    var passed = securityCheck(req, 'gitlab', { secretToken: 'MyStr0ngS3cr3t' });
    assert.ok(passed.success);
    assert.equal(passed.reason, undefined);
    done();
  });
});
