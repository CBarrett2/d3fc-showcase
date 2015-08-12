(function(d3, fc, sc) {
    'use strict';

    // Set SVGs & column padding
    var container = d3.select('#chart-example');

    var svgMain = container.select('svg.main');
    var svgRSI = container.select('svg.rsi');
    var svgNav = container.select('svg.nav');

    function calculateDimensions() {
        var leftPadding = parseInt(container.select('.col-md-12').style('padding-left'), 10);
        var rightPadding = parseInt(container.select('.col-md-12').style('padding-right'), 10);

        var headRowHeight = parseInt(container.select('#head-row').style('height'), 10);
        var navHeight = parseInt(svgNav.style('height'), 10);

        var useableScreenWidth = parseInt(container.style('width'), 10) - (leftPadding + rightPadding);
        var useableScreenHeight = window.innerHeight - headRowHeight - navHeight -
            2 * fc.chart.linearTimeSeries().xAxisHeight();

        var targetWidth = useableScreenWidth;
        var targetHeight = useableScreenHeight;

        var mainHeightRatio = 0.6;
        var rsiHeightRatio = 0.3;
        var totalHeightRatio = mainHeightRatio + rsiHeightRatio;

        svgMain.attr('width', targetWidth)
            .attr('height', mainHeightRatio * targetHeight / totalHeightRatio);
        svgRSI.attr('width', targetWidth)
            .attr('height', rsiHeightRatio * targetHeight / totalHeightRatio);
        svgNav.attr('width', targetWidth)
            .attr('height', navHeightRatio * targetHeight / totalHeightRatio);
    }

    var candlestick = fc.series.candlestick();
    var ohlc = fc.series.ohlc();
    var point = fc.series.point();
    var line = fc.series.line();
    var area = fc.series.area();

    var currentSeries = candlestick;

    calculateDimensions();

    function changeSeries(seriesTypeString) {
        switch (seriesTypeString) {
            case 'ohlc':
                currentSeries = ohlc;
                break;
            case 'candlestick':
                currentSeries = candlestick;
                break;
            case 'line':
                currentSeries = line;
                break;
            case 'point':
                currentSeries = point;
                break;
            case 'area':
                currentSeries = area;
                break;
            default:
                currentSeries = candlestick;
                break;
        }
        multi.series([gridlines, ma, currentSeries, closeAxisAnnotation]);
        render();
    }

    d3.select('#series-buttons')
        .selectAll('.btn')
        .on('click', function() {
            var seriesTypeString = d3.select(this)
                .select('input')
                .node()
                .value;
            changeSeries(seriesTypeString);
        });

    var ohlcConverter = sc.data.feed.coinbase.ohlcWebSocketAdaptor();
    // Default to generated data
    var currData = fc.data.random.financial()(250);

    function liveCallback(event, latestBasket) {
        if (!event && latestBasket) {
            if (!currData.length) {
                currData = [latestBasket];
                resetToLive();
                hideOrShowChartsAndSetLoadingText(false);
            } else if (currData[currData.length - 1].date.getTime() !== latestBasket.date.getTime()) {
                currData.push(latestBasket);
            } else {
                currData[currData.length - 1] = latestBasket;
            }
            render();
        } else if (event.type === 'open') {
            // On successful open
            hideOrShowChartsAndSetLoadingText(true, 'Connected, waiting for data...');
        } else if (event.type === 'close' && event.code === 1000) {
            // No need for a message on successful close
        } else {
            hideOrShowChartsAndSetLoadingText(true, 'Error loading data from coinbase websocket: ' +
                event.type + ' ' + event.code);
        }
    }

    function resetToLive() {
        // Using golden ratio to make initial display area rectangle into the golden rectangle
        if (!currData.length) {
            return;
        }
        var goldenRatio = 1.618;
        var navAspect = parseInt(svgNav.attr('height'), 10) / parseInt(svgNav.attr('width'), 10);
        var standardDateDisplay = [currData[Math.floor((1 - navAspect * goldenRatio) * currData.length)].date,
                currData[currData.length - 1].date];
        timeSeries.xDomain(standardDateDisplay);
        render();
    }

    function toggleLiveFeedUI(visible) {
        var visibility = (visible === true) ? 'visible' : 'hidden';
        d3.select('#period-span').style('visibility', visibility);
        d3.select('#product-span').style('visibility', visibility);
    }

    d3.select('#type-selection')
        .on('change', function() {
            var type = d3.select(this).property('value');
            if (type === 'live') {
                toggleLiveFeedUI(true);
                currData = [];
                hideOrShowChartsAndSetLoadingText(true, 'Connecting to websocket...');
                render();
                ohlcConverter(liveCallback);
            } else if (type === 'fake') {
                toggleLiveFeedUI(false);
                ohlcConverter.close();
                hideOrShowChartsAndSetLoadingText(false);
                currData = fc.data.random.financial()(250);
                // No need for loading text as this will be instant
                resetToLive();
                render();
            }
        });

    d3.select('#period-selection')
        .on('change', function() {
            var period = parseInt(d3.select(this).property('value'));
            ohlcConverter.period(period);
            currData = [];
            hideOrShowChartsAndSetLoadingText(true, 'Connecting to websocket...');
            render();
            ohlcConverter(liveCallback);
        });

    d3.select('#product-selection')
        .on('change', function() {
            var product = d3.select(this).property('value');
            ohlcConverter.product(product);
            currData = [];
            hideOrShowChartsAndSetLoadingText(true, 'Connecting to websocket...');
            render();
            ohlcConverter(liveCallback);
        });

    // Create main chart and set how much data is initially viewed
    var timeSeries = fc.chart.linearTimeSeries()
        .xTicks(6);

    var gridlines = fc.annotation.gridline()
        .yTicks(5)
        .xTicks(0);

    // Create and apply the Moving Average
    var movingAverage = fc.indicator.algorithm.movingAverage();

    // Create a line that renders the result
    var ma = fc.series.line()
        .decorate(function(selection) {
            selection.enter()
                .classed('ma', true);
        })
        .yValue(function(d) { return d.movingAverage; });

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
        .series([gridlines, ma, currentSeries, closeAxisAnnotation])
        .key(function(series, index) {
            switch (series) {
                case line:
                    return index;
                default:
                    return series;
            }
        });

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

        multi.mapping(function(series) {
            switch (series) {
                case closeAxisAnnotation:
                    return [data[data.length - 1]];
                default:
                    return data;
            }
        });

        // Scale y axis
        var yExtent = fc.util.extent(sc.util.filterDataInDateRange(data, timeSeries.xDomain()), ['low', 'high']);
        // Add 10% either side of extreme high/lows
        var variance = yExtent[1] - yExtent[0];
        if (variance === 0) {
            // Bit of a hack to get single-value candlesticks to show nicely.
            // Shouldn't be needed when historic data integrated
            variance = 1;
        }
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
        rsi.yScale().range([parseInt(svgRSI.style('height'), 10), 0]);
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
        .xDomain(fc.util.extent(data, 'date'))
        .yTicks(0);

    area = fc.series.area()
        .yValue(function(d) { return d.open; });

    line.yValue(function(d) { return d.open; })

    var brush = d3.svg.brush();
    var navMulti = fc.series.multi().series([area, line, brush]);

    var navChart = function(selection) {
        var data = selection.datum();

        var xExtent = fc.util.extent(data, 'date');
        var yExtent = fc.util.extent(getVisibleData(data, fc.util.extent(data, 'date')), ['low', 'high']);
        navTimeSeries.xDomain(xExtent)
            .yDomain(yExtent);
        area.y0Value(yExtent[0]);

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

    function hideOrShowChartsAndSetLoadingText(hidden, text) {
        function setLoadingText(text) {
            if (text) {
                d3.select('#loading-text')
                    .text(text);
            }
        }

        function toggleVisibility(hidden) {
            var visibility = (hidden === false) ? 'visible' : 'hidden';
            var textVisibility = (hidden === false) ? 'hidden' : 'visible';

            var type = d3.select('#type-selection').property('value');

            if (type === 'live') {
                svgRSI.style('visibility', 'hidden');
                svgNav.style('visibility', 'hidden');
            } else {
                svgRSI.style('visibility', visibility);
                svgNav.style('visibility', visibility);
            }

            svgMain.style('visibility', visibility);
            d3.select('#loading-text')
                .style('visibility', textVisibility);

        }

        toggleVisibility(hidden);
        setLoadingText(text);
    }

    function render() {
        if (!currData.length) {
            return;
        }

        svgMain.datum(currData)
            .call(mainChart);

        svgRSI.datum(currData)
            .call(rsiChart);

        svgNav.datum(currData)
            .call(navChart);
    }

    function resize() {
        calculateDimensions();
        render();
    }

    d3.select('#period-span').style('visibility', 'hidden');
    d3.select('#product-span').style('visibility', 'hidden');
    d3.select('#loading-text')
        .style('visibility', 'hidden');

    calculateDimensions();

    container.select('#reset-button').on('click', resetToLive);
    d3.select(window).on('resize', resize);
    resize();
    resetToLive();

})(d3, fc, sc);
