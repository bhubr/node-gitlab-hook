function BitBucketStrategy() {
	
}

BitBucketStrategy.prototype.securityCheck = function(headers, config) {
  return { success: true };
};

module.exports = BitBucketStrategy;