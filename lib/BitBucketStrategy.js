/**
 * Constructor
 */
function BitBucketStrategy(headers) {
  this.headers = headers;
  this.eventType = headers['x-event-key'];
}

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

BitBucketStrategy.prototype.getEventType = function() {
  return this.eventType;
  // var eventKeyHeader = this.headers['x-event-key'];
  // var bits = eventKeyHeader.split(':');
  // return {
  //   object: bits[0],
  //   action: bits[1]
  // };
}

module.exports = BitBucketStrategy;