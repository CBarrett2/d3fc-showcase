(function(sc) {
    'use strict';
    // Helper functions
    sc.chart.navChart = function() {
        var dispatch = d3.dispatch('viewChange');

        var navTimeSeries = fc.chart.linearTimeSeries()
            .yTicks(0);

        var area = fc.series.area()
            .yValue(function(d) { return d.open; });

        var line = fc.series.line()
            .yValue(function(d) { return d.open; });

        var brush = d3.svg.brush()
            .on('brush', function() {
                if (brush.extent()[0][0] - brush.extent()[1][0] !== 0) {
                    // Control the shared view scale's domain
                    dispatch.viewChange([brush.extent()[0][0], brush.extent()[1][0]]);
                }
            });

        var navMulti = fc.series.multi().series([area, line, brush]);

        var viewScale = fc.scale.dateTime();
        var zoom = d3.behavior.zoom();

        function navChart(selection, viewDomain) {
            viewScale.domain(viewDomain)
                .range([0, selection.attr('width')]);

            zoom.x(viewScale);

            brush.extent([
                [viewScale.domain()[0], navTimeSeries.yDomain()[0]],
                [viewScale.domain()[1], navTimeSeries.yDomain()[1]]
            ]);

            navTimeSeries.plotArea(navMulti);
            selection.call(navTimeSeries);
        }

        navChart.updateData = function(selection) {
            var data = selection.datum();
            var yExtent = fc.util.extent(sc.util.filterDataInDateRange(data,
                fc.util.extent(data, 'date')), ['low', 'high']);

            navTimeSeries.xDomain(fc.util.extent(data, 'date'))
                .yDomain(yExtent);

            // Allow to zoom using mouse, but disable panning
            zoom.on('zoom', function() {
                    if (zoom.scale() === 1) {
                        zoom.translate([0, 0]);
                    } else {
                        // Usual behavior
                        sc.util.zoomControl(zoom, selection, data, viewScale);
                        dispatch.viewChange(viewScale.domain());
                    }
                });
            selection.call(zoom);
            return navChart;
        };

        d3.rebind(navChart, dispatch, 'on');

        return navChart;
    };

})(sc);