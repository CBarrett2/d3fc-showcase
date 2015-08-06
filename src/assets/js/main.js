(function(d3, fc, sc) {
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

    function padExtent(extent) {
        /* Applies the fc.util.extent function to find the extent of dates,
        but adds a buffer of one day to either side */
        var period = dataInterface.period();

        extent[0] = d3.time.second.offset(new Date(extent[0]), -period);
        extent[1] = d3.time.second.offset(new Date(extent[1]), +period);

        return extent;
    }

    function combineData(histBasket, liveBasket) {
        // check they have overlapping dates?
        var basket = {
            date: histBasket.date,
            open: histBasket.open,
            volume: histBasket.volume
        };

        basket.close = liveBasket.close;
        basket.high = Math.max(histBasket.high, liveBasket.high);
        basket.low = Math.min(histBasket.low, liveBasket.low);
        basket.volume += liveBasket.volume;

        return basket;
    }

    function candlesDate(n, period) {
        var end = new Date();
        // n candles into the past
        var start = new Date(end.getTime() - (n * 1000 * dataInterface.period()));
        return [start, end];
    }

    // Set SVGs & column padding
    var container = d3.select('#chart-example');

    var leftPadding = parseInt(container.select('.col-md-12').style('padding-left'), 10);
    var rightPadding = parseInt(container.select('.col-md-12').style('padding-right'), 10);

    var svgMain = container.select('svg.main');
    var svgRSI = container.select('svg.rsi');
    var svgNav = container.select('svg.nav');

    var mainAspect = 0.6;
    var rsiAspect = 0.3;
    var navAspect = 0.2;
    var heightWidthAspect = mainAspect + rsiAspect + navAspect;

    // Period is defined in seconds
    var dataInterface = sc.data.dataInterface()
        .liveFeed(sc.data.feed.coinbase.websocket())
        .historicFeed(fc.data.feed.coinbase())
        .period(60 * 60 * 12)
        .product('BTC-USD');

    var currData = [];

    function renderCallback(err, data) {
        if (!err) {
            updateData(data);
            resetToLive();
            render();
        } else { console.log('Error: ' + err); }
    }

    d3.select('#period-selection')
        .on('change', function() {
            var period = parseInt(d3.select(this).property('value'));
            dataInterface.period(period);
            currData = [];
            render(); // render loading screen
            var dates = candlesDate(199, dataInterface.period());
            dataInterface.getData(dates[0], dates[1], renderCallback);
        });

    d3.select('#product-selection')
        .on('change', function() {
            var product = d3.select(this).property('value');
            // Would be nice to base this selection off the products list
            dataInterface.product(product);
            currData = [];
            render(); // render loading screen
            var dates = candlesDate(199, dataInterface.period());
            dataInterface.getData(dates[0], dates[1], renderCallback);
        });

    // Set Reset button event
    function resetToLive() {
        var goldenRatio = 1.618;
        if (currData.length) { // probably necessary?
            var standardDateDisplay = [currData[Math.floor((1 - navAspect * goldenRatio) * currData.length)].date,
                currData[currData.length - 1].date];
            standardDateDisplay = padExtent(standardDateDisplay);
            timeSeries.xDomain(standardDateDisplay);
        }
    }

    container.select('#reset-button').on('click', function() {
        if (!currData.length) { return; }
        resetToLive();
        render();
    });

    // Create main chart
    var timeSeries = fc.chart.linearTimeSeries()
        .xTicks(6);

    var gridlines = fc.annotation.gridline()
        .yTicks(5)
        .xTicks(0);

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
        .series([gridlines, candlestick, ma, endPriceLine]);


    function zoomCall(zoom, data, scale) {
        return function() {
            var tx = zoom.translate()[0];
            var ty = zoom.translate()[1];

            var xExtent = padExtent(fc.util.extent(data, ['date']));
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

        // Scale y axis
        var yExtent = fc.util.extent(getVisibleData(data, timeSeries.xDomain()), ['low', 'high']);

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

    var volumeScale = d3.scale.linear();

    var volume = fc.series.bar()
        .yValue(function(d) { return d.volume; });

    var rsiChart = function(selection) {
        var data = selection.datum();
        rsi.xScale(timeSeries.xScale());

        volume.xScale(timeSeries.xScale());

        // Important for initialization that this happens after timeSeries is called [or can call render() twice]
        var zoom = d3.behavior.zoom();
        zoom.x(timeSeries.xScale())
            .on('zoom', zoomCall(zoom, data, timeSeries.xScale()));
        selection.call(zoom);
        selection.call(rsi);
        selection.call(volume);
    };

    // Create navigation chart
    var navTimeSeries = fc.chart.linearTimeSeries()
        .yTicks(4);

    var area = fc.series.area()
        .yValue(function(d) { return d.open; });

    var line = fc.series.line()
        .yValue(function(d) { return d.open; });

    var brush = d3.svg.brush();
    var navMulti = fc.series.multi()
        .series([area, line, brush]);

    var navChart = function(selection) {
        var data = selection.datum();

        var yExtent = fc.util.extent(data, ['low', 'high']);
        var xExtent = padExtent(fc.util.extent(data, ['date']));
        navTimeSeries.xDomain(xExtent)
            .yDomain(yExtent);

        brush.x(navTimeSeries.xScale())// ??
            .on('brush', function() {
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

        // Allow to zoom using mouse, but disable panning
        var zoom = d3.behavior.zoom();
        zoom.x(timeSeries.xScale())
            .on('zoom', function() {
                if (zoom.scale() === 1) { // might want to load data if zooming further out
                    zoom.translate([0, 0]);
                } else {
                    // Usual behavior
                    zoomCall(zoom, data, timeSeries.xScale())();
                }
            });
        selection.call(zoom);

        navTimeSeries.plotArea(navMulti);
        selection.call(navTimeSeries);
    };

    // Later this can hold all the functions that req updating with data (eg moving average)
    function updateData(data) {
        currData = data;

        movingAverage(data);
        rsiAlgorithm(data);

        var volumeExtent = fc.util.extent(data, ['volume']);
        volumeScale.domain([0, volumeExtent[1]]);
        volume.yScale(volumeScale);

        multi.mapping(function(series) {
            if (series === endPriceLine) {
                return [data[data.length - 1]];
            } else { return data; }
        });

        svgMain.datum(data);
        svgRSI.datum(data);
        svgNav.datum(data);
    }

    function render() {
        // If loading
        if (!currData.length) {
            svgMain.selectAll('*').remove();
            //svgMain.append('text')
            //    .text('loading...');
            svgRSI.selectAll('*').remove();
            svgNav.selectAll('*').remove();

            return;

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
        volume.yScale().range([rsiAspect * targetWidth, rsiAspect * targetWidth / 2]);

        render();
    }

    d3.select(window).on('resize', resize);

    // Initialize
    var dates = candlesDate(199, dataInterface.period());
    dataInterface.getData(dates[0], dates[1], function(err, data) {
        renderCallback(err, data);
        resize();
        // Once initial historic data is loaded, start streaming live data
        dataInterface.live(function(event, datum) {
            if (!event) {
                var latestBasket = dataInterface.basket();
                if (currData.length && latestBasket) {
                    var lastDatum = currData[currData.length - 1];
                    if (lastDatum.date.getTime() + (dataInterface.period() * 1000) >= latestBasket.date.getTime()) {
                        currData[currData.length - 1] = combineData(lastDatum, latestBasket);
                    } else { currData.push(latestBasket); }
                    updateData(currData);
                    render();
                }
            } else if (event.code === 1000) {
                // I don't think there's any need for a message
                // console.log('Websocket closing');
            } else { console.log('Error loading data from coinbase websocket: ' + event); }
        });
    });



})(d3, fc, sc);
