(function(fcsc, fc, d3) {
    'use strict';
    fcsc.chartFramework = function() {
        var width = 500;
        var height = 300;
        var timeSeries = fc.chart.linearTimeSeries();
        var multi = fc.series.multi();
        var plugins = [];

        function chart(selection) {
            selection.each(function(d, i) {
                timeSeries.xDomain(fc.util.extent(d, 'date'))
                    .yDomain(fc.util.extent(d, ['open', 'close']));

                timeSeries.plotArea(multi);
                selection.call(timeSeries);

                for (var j = 0; j < plugins.length(); j++) {
                    selection.call(plugins[j], this);
                }
            });
            return chart;
        }

        chart.width = function(value) {
            if (!arguments.length) { return width; }
            width = value;
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

        chart.getVisibleData = function(data, dateExtent) {
            // Calculate visible data for main/volume charts given [startDate, endDate]
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
