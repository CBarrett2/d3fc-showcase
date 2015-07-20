(function(d3, fc) {
    'use strict';
    var width = 500;
    var height = 300;

    var svg = d3.select('#chart-example')
        .append('svg')
        .attr('width', width)
        .attr('height', height);

    var data = fc.dataGenerator()(5000);

    var area = fc.series.area()
        .yValue(function(d) { return d.open; })
        .y0Value(0);

    var line = fc.series.line()
        .yValue(function(d) { return d.open; });

    var gridlines = fc.annotation.gridline()
        .yTicks(5)
        .xTicks(0);

    // Our zoom plugin implements pan and zoom
    var zoomPlugin = fcsc.zoomPlugin();

    var chart = fcsc.chartFramework()
        .width(width)
        .height(height)
        .series([line, area, gridlines])
        .plugins([zoomPlugin]);

    // Set the initial scale
    chart.dateScale().domain([data[250].date, data[500].date]);

    svg.datum(data)
        .call(chart);

})(d3, fc);