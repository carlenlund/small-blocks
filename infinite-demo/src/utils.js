exports.modulo = function(x, n) {
  return ((x % n) + n ) % n;
};

exports.sampleNearestNeighbor = function(inArray, inStart, inEnd,
                                         outArray, outStart, outEnd) {
  var sampleWidth = (inEnd - inStart) / (outEnd - outStart);
  for (var i = outStart; i < outEnd; ++i) {
    outArray[i] = inArray[inStart + Math.floor(i * sampleWidth)];
  }
};
