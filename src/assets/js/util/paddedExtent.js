(function(d3, fc) {
    'use strict';
    sc.util.paddedExtent = function(extent, period) {
        // Adds a buffer of period to either side of data
        // Create new variable so we don't change the argument
        var paddedExtent = [extent[0], extent[1]];

        paddedExtent[0] = d3.time.second.offset(new Date(extent[0]), -period);
        paddedExtent[1] = d3.time.second.offset(new Date(extent[1]), +period);

        return paddedExtent;
    };
})(d3, fc);