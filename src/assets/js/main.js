(function(d3, fc) {
    'use strict';
    function getVisibleData(data, dateExtent) {
        // Calculate visible data, given [startDate, endDate]
        var bisector = d3.bisector(function(d) { return d.date; });
        var visibleData = data.slice(
        // Pad and clamp the bisector values to ensure extents can be calculated
            Math.max(0, bisector.left(data, dateExtent[0]) - 1),
            Math.min(bisector.right(data, dateExtent[1]) + 1, data.length)
        );
        return visibleData;
    }

    var width = 500;
    var height = 300;
    var rsiHeight = height / 2;
    var navHeight = height / 3;


    // Set SVGs
    var container = d3.select('#chart-example');
    var svgMain = container.select('svg.main')
        .attr('viewBox', function() { return '0 0 ' + width + ' ' + height; })
        .attr('width', width)
        .attr('height', height);

    var svgRSI = container.select('svg.rsi')
        .attr('viewBox', function() { return '0 0 ' + width + ' ' + rsiHeight; })
        .attr('width', width)
        .attr('height', rsiHeight);

    var svgNav = container.select('svg.nav')
        .attr('viewBox', function() { return '0 0 ' + width + ' ' + navHeight; })
        .attr('width', width)
        .attr('height', navHeight);

    var data = fc.data.random.financial()(250);

    // Create main chart and set how much data is initially viewed
    var timeSeries = fc.chart.linearTimeSeries()
        .xDomain([data[Math.floor(data.length / 2)].date, data[Math.floor(data.length * 3 / 4)].date]);

    var candlestick = fc.series.candlestick();
    var gridlines = fc.annotation.gridline()
        .yTicks(5)
        .xTicks(0);

    // Create and apply the Moving Average
    var movingAverage = fc.indicator.algorithm.movingAverage();

    // Create a line that renders the result
    var ma = fc.series.line()
        .yValue(function(d) { return d.movingAverage; });

    var multi = fc.series.multi().series([candlestick, gridlines, ma]);




    var mainChart = function(selection) {
        data = selection.datum();
        movingAverage(data);

        // Scale y axis
        var yExtent = fc.util.extent(getVisibleData(data, timeSeries.xDomain()), ['low', 'high']);
        timeSeries.yDomain(yExtent);

        // Redraw
        timeSeries.plotArea(multi);
        selection.call(timeSeries);

        // Behaves oddly if not reinitialized every render
        var zoom = d3.behavior.zoom()
            .x(timeSeries.xScale())
            .on('zoom', function() {
                render();
            });

        selection.call(zoom);
    };

    // Create RSI chart
    var rsiScale = d3.scale.linear()
        .domain([0, 100])
        .range([rsiHeight, 0]);
    var rsiAlgorithm = fc.indicator.algorithm.relativeStrengthIndex();

    var rsi = fc.indicator.renderer.relativeStrengthIndex()
        .xScale(timeSeries.xScale())
        .yScale(rsiScale);

    var rsiChart = function(selection) {
        data = selection.datum();
        rsiAlgorithm(data);

        // Important for initialization that this happens after timeSeries is called [or can call render() twice]
        var zoom = d3.behavior.zoom()
            .x(timeSeries.xScale())
            .on('zoom', function() {
                render();
            });
        selection.call(zoom);
        selection.call(rsi);
    };

    // Create navigation chart
    var yExtent = fc.util.extent(getVisibleData(data, fc.util.extent(data, 'date')), ['low', 'high']);
    var navTimeSeries = fc.chart.linearTimeSeries()
        .xDomain(fc.util.extent(data, 'date'))
        .yDomain(yExtent)
        .yTicks(5);

    var area = fc.series.area()
        .yValue(function(d) { return d.open; })
        .y0Value(yExtent[0]);

    var line = fc.series.line()
        .yValue(function(d) { return d.open; });

    var brush = d3.svg.brush();
    var navMulti = fc.series.multi().series([area, line, brush]);
    var navChart = function(selection) {
        data = selection.datum();

        brush.on('brush', function() {
                if (brush.extent()[0][0] - brush.extent()[1][0] !== 0) {
                    // Control the main chart's time series domain
                    timeSeries.xDomain([brush.extent()[0][0], brush.extent()[1][0]]);
                    render();
                }
            });

        navMulti.mapping(function(series) {
                if (series === brush) {
                    brush.extent([
                        [timeSeries.xDomain()[0], navTimeSeries.yDomain()[0]],
                        [timeSeries.xDomain()[1], navTimeSeries.yDomain()[1]]
                    ]);
                }
                return data;
            });

        navTimeSeries.plotArea(navMulti);
        selection.call(navTimeSeries);
    };

    function render() {
        svgMain.datum(data)
            .call(mainChart);

        svgRSI.datum(data)
            .call(rsiChart);

        svgNav.datum(data)
            .call(navChart);
    }
    //render();
    render();

})(d3, fc);
