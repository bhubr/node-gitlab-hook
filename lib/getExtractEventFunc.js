function getExtractEventFunc(str) {
  const camelized = str.replace(/(\:\w)/g, function(m){
    return m[1].toUpperCase();}
  );
  return 'extract' + camelized[0].toUpperCase() + camelized.substr(1);
}

module.exports = getExtractEventFunc;