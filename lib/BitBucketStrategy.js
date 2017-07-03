const getExtractEventFunc = require('./getExtractEventFunc');

/**
 * Constructor
 */
function BitBucketStrategy(headers) {
  this.headers = headers;
  this.url = 'https://bitbucket.org/';
  // this.extractEvent();
  this.event = this.headers['x-event-key'];
}

// BitBucketStrategy.prototype.extractEvent = function() {
//   const eventKeyHeader = this.headers['x-event-key'];
//   const bits = eventKeyHeader.split(':');
//   this.eventType = bits[0];
//   this.action = bits[1];
// }

/**
 * Perform security check (none for BitBucket)
 */
BitBucketStrategy.prototype.securityCheck = function(config) {
  return { success: true };
};

/**
 * Populate with parsed body
 */
BitBucketStrategy.prototype.setData = function(data) {
  this.data = data;
}

BitBucketStrategy.prototype.getEventData = function() {
  const funcName = getExtractEventFunc(this.event);
  const data = this[funcName]();
  return {
    event: this.event,
    data
  };
}

BitBucketStrategy.prototype.extractRepoPush = function() {
  const { repository } = this.data;
  return {
    name: repository.name,
    fullName: repository.full_name,
    url: repository.links.html.href
  }
}

module.exports = BitBucketStrategy;