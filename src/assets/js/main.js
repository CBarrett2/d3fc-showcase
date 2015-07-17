(function(d3, fc) {
    'use strict';
    var width = 500;
    var height = 300;

    var svg = d3.select('#chart-example')
        .append('svg')
        .attr('width', width)
        .attr('height', height);

    var data = fc.dataGenerator()(1000);

    var area = fc.series.area()
        .yValue(function(d) { return d.open; })
        .y0Value(0);

    var line = fc.series.line()
        .yValue(function(d) { return d.open; });

    var gridlines = fc.annotation.gridline()
        .yTicks(5)
        .xTicks(0);

    var chart = fcsc.chartFramework()
        .width(width)
        .height(height)
        .series([line, area, gridlines]);

    // Pass visible data
    svg.datum(data)
        .call(chart);

})(d3, fc);