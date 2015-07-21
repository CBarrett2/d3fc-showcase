(function(d3, fc, fcsc) {
    'use strict';
    var width = 500;
    var height = 300;

    var container = d3.select('#chart-example');
    
    var svgMain = container.select('svg.main')
        .attr('viewBox', function() { return "0 0 " + width + " " + height; })
        .attr('width', width)
        .attr('height', height);
        
    /*var svgNav = container.select('svg.nav')
        .attr('viewBox', function() { return "0 0 " + width +  " " + (height/3); })
        .attr('width', width)
        .attr('height', height/3);*/

    var data = fc.data.random.financial()(1000);
    var visibleRange = [data[250].date, data[500].date] // arbitrary start
    
    // Create Main chart
    var candlestick = fc.series.candlestick();
    var gridlines = fc.annotation.gridline()
        .yTicks(5)
        .xTicks(0);

    var multi = fc.series.multi().series([candlestick, gridlines]);        
    var timeSeries = fc.chart.linearTimeSeries();
        
    timeSeries.xDomain(visibleRange);
    var yExtent = fc.util.extent(getVisibleData(data, timeSeries.xDomain()), ['low', 'high']);
    timeSeries.yDomain(yExtent); //xNice, yNice...
    var lastX = 0;
    var mainChart = function(selection) {
        data = selection.datum();
        
        // Scale y axis
        console.log(timeSeries.xDomain())
        var yExtent = fc.util.extent(getVisibleData(data, timeSeries.xDomain()), ['low', 'high']);
        timeSeries.yDomain(yExtent);
        
        
        
        var zoom = d3.behavior.zoom()
            .x(timeSeries.xScale())
            .on('zoomstart', function() {
                //lastX = d3.mouse(this)[0];
            })
            .on('zoom', function() {
                // Alter the default behavior if panning
                /*if (zoom.scale() === 1) {
                    var tx = d3.mouse(this)[0] - lastX;
                    var ty = zoom.translate()[1];

                    zoom.translate([tx, ty]);
                }
                lastX = d3.mouse(this)[0];*/
                render();
            });
        
        // Redraw
        timeSeries.plotArea(multi);
        selection.call(timeSeries);
        selection.call(zoom);
    }
    
    function render() {
        svgMain.datum(data)
            .call(mainChart);
    }
        
    render();
    render();
        
    // Create Nav chart    
    /*var area = fc.series.area()
        .yValue(function(d) { return d.open; });

    var line = fc.series.line()
        .yValue(function(d) { return d.open; });
    
    var navPlugin = fcsc.navbarPlugin(chartMain);
    var zoomPlugin2 = fcsc.zoomPlugin();
    
    var chartNav = fcsc.chartFramework()
        .series([line, area])
        .plugins([navPlugin]);

    // Set the initial scale. Perhaps this should be done by default if not set before chartFramwork is run for the first time (ie in chart() function)
    chartNav.xScale().domain([data[0].date, data[data.length-1].date]);
    
    var main = svgMain.datum(data);
    var nav = svgNav.datum(data);
        
    var update = function() {
        main.call(chartMain);
        nav.call(chartNav);
    }
    
    chartMain.setUpdate(update)
    chartNav.setUpdate(update)
    update();*/

    // Helper function
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
})(d3, fc, fcsc);