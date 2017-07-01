const securityCheck   = require('../securityCheck');
const fs              = require('fs');    
const chai            = require('chai');
const assert          = chai.assert;

var githubIP = '192.30.252.40';
var bitbucketIP = '104.192.143.193';

describe('all tests', () => {

  // BitBucket
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

  // GitLab FAIL
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

  // GitLab OK
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


  // GitHub FAIL
  it('check security with GitHub IP and config, fail 1: token provided but not expected', done => {
    var req = {
      headers: {
        'x-real-ip': githubIP,
        'x-hub-signature': 'sha1=4375ecbfc42d1003ee873b6c73244254992711c7'
      }
    };
    var passed = securityCheck(req, 'github', {}, '');
    assert.isNotOk(passed.success);
    assert.equal(passed.reason, 'Secret token set in GitHub but not expected');
    done();
  });

  it('check security with GitHub IP and config, fail 2: token expected but not provided', done => {
    var req = {
      headers: {
        'x-real-ip': githubIP
      }
    };
    var passed = securityCheck(req, 'github', { secretToken: 'MyStr0ngS3cr3t' }, '');
    assert.isNotOk(passed.success);
    assert.equal(passed.reason, 'Secret token expected but not set in GitHub');
    done();
  });

  it('check security with GitHub IP and config, fail 3: signature mismatch', done => {
    var req = {
      headers: {
        'x-real-ip': githubIP,
        'x-hub-signature': 'sha1=4375ecbfc42d1003ee873b6c73244254992711c7'
      }
    };
    var passed = securityCheck(req, 'github', { secretToken: 'MyWr0ngS3cr3t' }, '');
    assert.isNotOk(passed.success);
    assert.equal(passed.reason, "Signatures don't match (received: sha1=4375ecbfc42d1003ee873b6c73244254992711c7, expected: sha1=b8415223675d3f0189fbb36fa637a32a971482e1)");
    done();
  });


  it('check security with GitHub IP and config, fail 4: passed body arg is not a string', done => {
    var req = {
      headers: {
        'x-real-ip': githubIP,
        'x-hub-signature': 'sha1=4375ecbfc42d1003ee873b6c73244254992711c7'
      }
    };
    var passed = securityCheck(req, 'github', { secretToken: 'MyWr0ngS3cr3t' }, { foo: 'bar' });
    assert.isNotOk(passed.success);
    assert.equal(passed.reason, 'body parameter should be a string');
    done();
  });


  // GitHub OK
  it('check security with GitHub IP and config, ok 1: no token expected nor provided', done => {
    var req = {
      headers: {
        'x-real-ip': githubIP
      }
    };
    var passed = securityCheck(req, 'github', {}, '');
    assert.ok(passed.success);
    assert.equal(passed.reason, undefined);
    done();
  });

  // GitHub OK
  it('check security with GitHub IP and config, ok 2: expected and provided signature match', done => {
    var req = {
      headers: {
        'x-real-ip': githubIP,
        'x-hub-signature': 'sha1=4375ecbfc42d1003ee873b6c73244254992711c7'
      }
    };

    var passed = securityCheck(req, 'github', { secretToken: 'MyStr0ngS3cr3t' }, '{"foo":"bar"}');
    assert.ok(passed.success);
    assert.equal(passed.reason, undefined);
    done();
  });


});
