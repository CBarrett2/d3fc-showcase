(function(fcsc, fc, d3) {
    'use strict';
    fcsc.chartFramework = function() {
        var width = 500;
        var height = 300;
        var timeSeries = fc.chart.linearTimeSeries();
        var multi = fc.series.multi();
        var plugins = [];
        /*var dateScale = timeSeries.xScale()
            .range([0, width]);*/

        function chart(selection) {
            selection.each(function(d, i) {
                // Y-axis automatically scales
                var yExtent = fc.util.extent(chart.getVisibleData(d, timeSeries.xScale().domain()), ['low', 'high']);
                // Add say 20% on either side of extent
                //timeSeries.xDomain(dateScale.domain())
                    //.yDomain(fc.util.extent(d, ['open', 'close'])); non y-scaling
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
})(fcsc, fc, d3);
