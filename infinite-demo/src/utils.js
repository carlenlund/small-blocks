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

exports.sampleNearestNeighbor2 = function(inArray, inStart, inEnd,
                                         outArray, outStart, outEnd) {
  var sampleWidth = (inEnd - inStart) / (outEnd - outStart);
  for (var i = outStart; i < outEnd; ++i) {
    if (sampleWidth === 2) {
      var index = inStart + 2 * i;
      if (inArray[index] === inArray[index + 1]) {
        outArray[i] = inArray[index];
      } else {
        // Important difference from sampleNearestNeighbor.
        outArray[i] = 0;
      }
    } else {
      outArray[i] = inArray[inStart + Math.floor(i * sampleWidth)];
    }
  }
};
