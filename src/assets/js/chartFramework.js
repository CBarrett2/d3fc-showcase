(function(d3, fc, fcsc) {
    'use strict';
    fcsc.chartFramework = function() {
        var timeSeries = fc.chart.linearTimeSeries();
        var multi = fc.series.multi();
        var plugins = [];

        function chart(selection) {
            selection.each(function(d, i) {
                // Y-axis automatically scales
                var yExtent = fc.util.extent(chart.getVisibleData(d, timeSeries.xScale().domain()), ['low', 'high']);

                timeSeries.yDomain(yExtent);
                timeSeries.plotArea(multi);
                selection.call(timeSeries);

                for (var j = 0; j < plugins.length; j++) {
                    selection.call(plugins[j], chart);
                }
            });
            return chart;
        }

        chart.plugins = function(value) {
            if (!arguments.length) { return plugins; }
            plugins = value;
            return chart;
        };

        d3.rebind(chart, multi, 'series');
        d3.rebind(chart, timeSeries, 'xScale');

        chart.getVisibleData = function(data, dateExtent) {
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
})(d3, fc, fcsc);
