(function(fcsc, fc, d3) {
    'use strict';
    fcsc.chartFramework = function() {
        var width = 500;
        var height = 300;
        var timeSeries = fc.chart.linearTimeSeries();
        var multi = fc.series.multi();
        var plugins = [];
        var dateScale = fc.scale.dateTime()
            .range([0, width]);
        var scaleExtent = [];

        function chart(selection) {
            selection.each(function(d, i) {
                scaleExtent = fc.util.extent(d, ['date']);

                // Y-axis automatically scales
                timeSeries.xDomain(dateScale.domain())
                    .yDomain(fc.util.extent(d, ['open', 'close']));

                timeSeries.plotArea(multi);
                selection.call(timeSeries);

                for (var j = 0; j < plugins.length; j++) {
                    selection.call(plugins[j], chart);
                }
            });
            return chart;
        }

        chart.scaleExtent = function(value) {
            if (!arguments.length) { return scaleExtent; }
            scaleExtent = value;
            return chart;
        };

        chart.dateScale = function(value) {
            if (!arguments.length) { return dateScale; }
            dateScale = value;
            return chart;
        };

        // Perhaps this should be done using d3.rebind
        chart.initDomain = function(value) {
            if (!arguments.length) { return dateScale.domain(); }
            dateScale.domain(value);
            return chart;
        };

        chart.width = function(value) {
            if (!arguments.length) { return width; }
            width = value;
            dateScale.range([0, width]);
            return chart;
        };

        chart.height = function(value) {
            if (!arguments.length) { return height; }
            height = value;
            return chart;
        };

        chart.plugins = function(value) {
            if (!arguments.length) { return plugins; }
            plugins = value;
            return chart;
        };

        d3.rebind(chart, multi, 'series');

        chart.getVisibleData = function(data, dateExtent) { // currently unused
            // Calculate visible data, given [startDate, endDate]
            var bisector = d3.bisector(function(d) { return d.date; });
            var visibleData = data.slice(
            // Pad and clamp the bisector values to ensure extents can be calculated
                Math.max(0, bisector.left(data, dateExtent[0]) - 1),
                Math.min(bisector.right(data, dateExtent[1]) + 1, data.length)
            );
            return visibleData;
        };
        return chart;
    };
})(fcsc, fc, d3);
