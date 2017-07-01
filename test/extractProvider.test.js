const extractProvider = require('../extractProvider');
const chai            = require('chai');
const assert          = chai.assert;

var githubIP = '192.30.252.40';
var bitbucketIP = '104.192.143.193';

describe('all tests', () => {

  it('check originator with GitHub IP', done => {
  	var req = {
  		headers: {
  			'x-real-ip': githubIP
  		}
  	};
  	var provider = extractProvider(req);
    assert.equal(provider, 'github');
    done();
  });

  it('check originator with BitBucket IP', done => {
    var req = {
      headers: {
        'x-real-ip': bitbucketIP
      }
    };
    var provider = extractProvider(req);
    assert.equal(provider, 'bitbucket');
    done();
  });

  it('check originator with GitLab header', done => {
    var req = {
      headers: {
        'x-gitlab-event': 'Push Hook'
      }
    };
    var provider = extractProvider(req);
    assert.equal(provider, 'gitlab');
    done();
  });
});
