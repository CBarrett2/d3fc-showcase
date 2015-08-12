(function(d3, fc) {
    'use strict';
    sc.util.padExtent = function(extent, period) {
        // Adds a buffer of period to either side of data
        extent[0] = d3.time.second.offset(new Date(extent[0]), -period);
        extent[1] = d3.time.second.offset(new Date(extent[1]), +period);

        return extent;
    };
})(d3, fc);