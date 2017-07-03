const BitBucketStrategy = require('../lib/BitBucketStrategy');
const chai              = require('chai');
const assert            = chai.assert;
const tools             = require('./tools');

const bitbucketIP = '104.192.143.193';

describe('BitBucketStrategy tests', () => {

  it('check originator with BitBucket IP', done => {
    const headers = {
      'x-real-ip': bitbucketIP,
      'x-event-key': 'repo:push'
    };
    const strategy = new BitBucketStrategy(headers);
    const payload = tools.getSamplePayload('bitbucket', 'repo-push');
    strategy.setData(payload);
    const eventData = strategy.getEventData();
    const repoUrl = 'https://bitbucket.org/bhubr/test-webhook';
    assert.equal(eventData.event, 'repo:push', "Event should be 'repo:push'");
    assert.equal(eventData.data.name, 'test-webhook', "Repo name should be 'test-webhook'");
    assert.equal(eventData.data.fullName, 'bhubr/test-webhook', "Repo name should be 'bhubr/test-webhook'");
    assert.equal(eventData.data.url, repoUrl, "Repo url should be '" + repoUrl + "'");
    done();
  });

});