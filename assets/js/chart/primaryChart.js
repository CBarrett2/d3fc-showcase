(function(sc) {
    'use strict';
    // Helper functions
    function calculateCloseAxisTagPath(width, height) {
        var h2 = height / 2;
        return [
            [0, 0],
            [h2, -h2],
            [width, -h2],
            [width, h2],
            [h2, h2],
            [0, 0]
        ];
    }

    function positionCloseAxis(sel) {
        sel.enter()
            .select('.right-handle')
            .insert('path', ':first-child')
            .attr('transform', 'translate(' + -40 + ', 0)')
            .attr('d', d3.svg.area()(calculateCloseAxisTagPath(40, 14)));

        sel.select('text')
            .attr('transform', 'translate(' + (-2) + ', ' + 2 + ')')
            .attr('x', 0)
            .attr('y', 0);
    }

    sc.chart.primaryChart = function() {
        var dispatch = d3.dispatch('viewChange');

        var timeSeries = fc.chart.linearTimeSeries()
            .xTicks(6);

        var gridlines = fc.annotation.gridline()
            .yTicks(5)
            .xTicks(0);

        var priceFormat = d3.format('.2f');

        var closeAxisAnnotation = fc.annotation.line()
            .orient('horizontal')
            .value(function(d) { return d.close; })
            .label(function(d) { return priceFormat(d.close); })
            .decorate(function(sel) {
                positionCloseAxis(sel);
                sel.enter().classed('close', true);
            });

        var multi = fc.series.multi()
            .series([gridlines, closeAxisAnnotation])
            .key(function(series, index) {
                if (series.isLine) {
                    return index;
                }
                return series;
            });

        function primaryChart(selection) {
            var dataModel = selection.datum();
            timeSeries.xDomain(dataModel.viewDomain);

            multi.mapping(function(series) {
                switch (series) {
                    case closeAxisAnnotation:
                        return [dataModel.data[dataModel.data.length - 1]];
                    default:
                        return dataModel.visibleData;
                }
            });

            // Scale y axis
            var yExtent = fc.util.extent(dataModel.visibleData, ['low', 'high']);
            timeSeries.yDomain(yExtent);

            // Redraw
            timeSeries.plotArea(multi);
            selection.call(timeSeries);

            // Behaves oddly if not reinitialized every render
            var zoom = d3.behavior.zoom();
            zoom.x(timeSeries.xScale())
                .on('zoom', function() {
                    sc.util.zoomControl(zoom, selection, dataModel.totalXExtent, timeSeries.xScale());
                    dispatch.viewChange(timeSeries.xDomain());
                });

            selection.call(zoom);
        }

        d3.rebind(primaryChart, dispatch, 'on');

        primaryChart.changeSeries = function(series, indicator) {
            if (indicator == null) {
                multi.series([gridlines, series, closeAxisAnnotation]);
            } else {
                multi.series([gridlines, indicator, series, closeAxisAnnotation]);
            }
            return primaryChart;
        };

        primaryChart.changeIndicator = function(indicator, series) {
            if (indicator == null) {
                multi.series([gridlines, series, closeAxisAnnotation]);
            } else {
                multi.series([gridlines, indicator, series, closeAxisAnnotation]);
            }
            return primaryChart;

        };

        return primaryChart;
    };
})(sc);