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

    // Set SVGs & column padding
    var container = d3.select('#chart-example');

    var leftPadding = parseInt(container.select('.col-md-12').style('padding-left'), 10);
    var rightPadding = parseInt(container.select('.col-md-12').style('padding-right'), 10);

    var svgMain = container.select('svg.main');
    var svgRSI = container.select('svg.rsi');
    var svgNav = container.select('svg.nav');
    
    var targetWidth = width;
    svgMain.attr('width', targetWidth)
            .attr('height', mainAspect * targetWidth);
        svgRSI.attr('width', targetWidth)
            .attr('height', rsiAspect * targetWidth);
        svgNav.attr('width', targetWidth)
            .attr('height', navAspect * targetWidth);
        //rsi.yScale().range([rsiAspect * targetWidth, 0]);


    var mainAspect = 0.6;
    var rsiAspect = 0.3;
    var navAspect = 0.2;
    var heightWidthAspect = mainAspect + rsiAspect + navAspect;

    var data = fc.data.random.financial()(250);

    //var data = fc.data.random.financial()(250);
    //var stream = fc.data.stream();


    // Using golden ratio to make initial display area rectangle into the golden rectangle
    var goldenRatio = 1.618;

    var standardDateDisplay = [data[Math.floor((1 - navAspect * goldenRatio) * data.length)].date,
            data[data.length - 1].date];

    // Set Reset button event
    function resetToLive() {
        timeSeries.xDomain(standardDateDisplay);
        render();
    }

    container.select('#reset-button').on('click', resetToLive);

    // Create main chart and set how much data is initially viewed
    var timeSeries = fc.chart.linearTimeSeries()
        .xDomain(standardDateDisplay)
        .xTicks(6);

    var gridlines = fc.annotation.gridline()
        .yTicks(5)
        .xTicks(0);

    var startPriceLine = fc.annotation.line()
        .orient('horizontal')
        .value(function(d) { return d.open; })
        .label(function(d) { return 'OPEN'; });

    var endPriceLine = fc.annotation.line()
        .orient('horizontal')
        .value(function(d) { return d.close; })
        .label(function(d) { return 'CLOSE'; });

    var candlestick = fc.series.candlestick();

    // Create and apply the Moving Average
    var movingAverage = fc.indicator.algorithm.movingAverage();

    // Create a line that renders the result
    var ma = fc.series.line()
        .yValue(function(d) { return d.movingAverage; });

    var multi = fc.series.multi()
        .series([gridlines, candlestick, ma, startPriceLine, endPriceLine])
        .mapping(function(series) {
            switch (series) {
                case startPriceLine:
                    return [data[0]];
                case endPriceLine:
                    return [data[data.length - 1]];
                default:
                    return data;
            }
        });

    function zoomCall(zoom, data, scale) {
        return function() {
            var tx = zoom.translate()[0];
            var ty = zoom.translate()[1];

            var xExtent = fc.util.extent(data, ['date']);
            var min = scale(xExtent[0]);
            var max = scale(xExtent[1]);

            // Don't pan off sides
            var width = svgMain.attr('width');
            if (min > 0) {
                tx -= min;
            } else if (max - width < 0) {
                tx -= (max - width);
            }
            // If zooming, and about to pan off screen, do nothing
            if (zoom.scale() !== 1) {
                if ((min >= 0) && (max - width) <= 0) {
                    scale.domain(xExtent);
                    zoom.x(scale);
                    tx = scale(xExtent[0]);
                }
            }

            zoom.translate([tx, ty]);
            render();
        };
    }

    var mainChart = function(selection) {
        var data = selection.datum();
        
        movingAverage(data);

        // Scale y axis
        var yExtent = fc.util.extent(getVisibleData(data, timeSeries.xDomain()), ['low', 'high']);
        //var yExtent = fc.util.extent(data, ['low', 'high']);
        //console.log("yextent: " + yExtent);
        // Add 10% either side of extreme high/lows
        var variance = yExtent[1] - yExtent[0];
        yExtent[0] -= variance * 0.1;
        yExtent[1] += variance * 0.1;
        timeSeries.yDomain(yExtent);

        // Redraw
        timeSeries.plotArea(multi);
        selection.call(timeSeries);

        // Behaves oddly if not reinitialized every render
        var zoom = d3.behavior.zoom();
        zoom.x(timeSeries.xScale())
            .on('zoom', zoomCall(zoom, data, timeSeries.xScale()));

        selection.call(zoom);
    };

    // Create RSI chart
    var rsiScale = d3.scale.linear()
        .domain([0, 100]);

    var rsiAlgorithm = fc.indicator.algorithm.relativeStrengthIndex();

    var rsi = fc.indicator.renderer.relativeStrengthIndex()
        .yScale(rsiScale);

    var rsiChart = function(selection) {
        var data = selection.datum();
        rsi.xScale(timeSeries.xScale());
        rsiAlgorithm(data);
        // Important for initialization that this happens after timeSeries is called [or can call render() twice]
        var zoom = d3.behavior.zoom();
        zoom.x(timeSeries.xScale())
            .on('zoom', zoomCall(zoom, data, timeSeries.xScale()));
        selection.call(zoom);
        selection.call(rsi);
    };

    // Create navigation chart
    var navTimeSeries = fc.chart.linearTimeSeries()
        .yTicks(4);

    var area = fc.series.area()
        .yValue(function(d) { return d.open; });

    var line = fc.series.line()
        .yValue(function(d) { return d.open; });

    var brush = d3.svg.brush();
    var navMulti = fc.series.multi().series([area, line, brush]);

    var navChart = function(selection) {
        var data = selection.datum();
        
        var yExtent = fc.util.extent(data, ['low', 'high']);
        navTimeSeries.xDomain(fc.util.extent(data, 'date'))
            .yDomain(yExtent);
        
        
        brush.on('brush', function() {
                if (brush.extent()[0][0] - brush.extent()[1][0] !== 0) {
                    // Control the main chart's time series domain
                    timeSeries.xDomain([brush.extent()[0][0], brush.extent()[1][0]]);
                    render();
                }
            });

        // Allow to zoom using mouse, but disable panning
        var zoom = d3.behavior.zoom();
        zoom.x(timeSeries.xScale())
            .on('zoom', function() {
                if (zoom.scale() === 1) {
                    zoom.translate([0, 0]);
                } else {
                    // Usual behavior
                    zoomCall(zoom, data, timeSeries.xScale())();
                }
            });
        selection.call(zoom);

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

    //var oldData = [];
    function render(data) { // shouldn't have to call render(data) now in other calls. maybe seperate into a render and a updateData function
        if (data) {
            svgMain.datum(data);
            svgRSI.datum(data)
            svgNav.datum(data)
        }
        svgMain.call(mainChart);
        svgRSI.call(rsiChart);
        svgNav.call(navChart);
    }

    function resize() {
        var resetRowHeight = parseInt(container.select('#reset-row').style('height'), 10);

        var useableScreenWidth = window.innerWidth - (leftPadding + rightPadding);
        var useableScreenHeight = window.innerHeight - resetRowHeight;

        var targetWidth;
        if (useableScreenHeight < heightWidthAspect * useableScreenWidth) {
            targetWidth = useableScreenHeight / heightWidthAspect;
        } else {
            targetWidth = useableScreenWidth;
        }

        var xTicks = Math.floor(targetWidth / 80);
        navTimeSeries.xTicks(xTicks);

        svgMain.attr('width', targetWidth)
            .attr('height', mainAspect * targetWidth);
        svgRSI.attr('width', targetWidth)
            .attr('height', rsiAspect * targetWidth);
        svgNav.attr('width', targetWidth)
            .attr('height', navAspect * targetWidth);
        rsi.yScale().range([rsiAspect * targetWidth, 0]);
        render();
    }

    d3.select(window).on('resize', resize);
    
    //render([{date: new Date(1000)}]);
    resize();
    
    var feed = fc.data.feed.coinbase()
        .start(new Date(2015, 2, 1))
        .end(new Date(2015, 7, 22))
        .granularity(100000); // what is this?  

    //timeSeries.plotArea(multi); // initials. Add 'loading' text?
        
    
    feed(function(err, data){
        if(!err){
            console.log("Initial data loaded");
            // To order from oldest to newest
            data = data.reverse(); 
            // Initialize starting domain
            timeSeries.xDomain([data[Math.floor(data.length / 2)].date, data[Math.floor(data.length * 3 / 4)].date]); 
            render(data);
        } else { alert("Error getting data from coinbase"); }
    });

})(d3, fc);
