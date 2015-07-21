(function(d3, fc, fcsc) {
    'use strict';
    var width = 500;
    var height = 300;

    var container = d3.select('#chart-example');
    
    // Set SVGs
    var svgMain = container.select('svg.main')
        .attr('viewBox', function() { return "0 0 " + width + " " + height; })
        .attr('width', width)
        .attr('height', height);
        
    var svgNav = container.select('svg.nav')
        .attr('viewBox', function() { return "0 0 " + width +  " " + (height/3); })
        .attr('width', width)
        .attr('height', height/3);

    var data = fc.data.random.financial()(1000);
    
    
    // Create Main chart
    var candlestick = fc.series.candlestick();
    var gridlines = fc.annotation.gridline()
        .yTicks(5)
        .xTicks(0);

    var multi = fc.series.multi().series([candlestick, gridlines]);        
    var timeSeries = fc.chart.linearTimeSeries();
       
    // Set initial domain
    var visibleRange = [data[250].date, data[500].date]
    timeSeries.xDomain(visibleRange);

    var mainChart = function(selection) {
        data = selection.datum();
        
        // Scale y axis
        var yExtent = fc.util.extent(getVisibleData(data, timeSeries.xDomain()), ['low', 'high']);
        timeSeries.yDomain(yExtent);
        
        var zoom = d3.behavior.zoom()
            .x(timeSeries.xScale())
            .on('zoom', function() {
                render();
            });
        
        // Redraw
        timeSeries.plotArea(multi);
        selection.call(timeSeries);
        selection.call(zoom);
    }
    
    
        
    // Create Nav chart    
    var area = fc.series.area()
        .yValue(function(d) { return d.open; });

    var line = fc.series.line()
        .yValue(function(d) { return d.open; });
    
    var multi2 = fc.series.multi().series([area, line]);        
    var timeSeries2 = fc.chart.linearTimeSeries();
    
    // Set the initial scale
    timeSeries2.xDomain([data[0].date, data[data.length-1].date]);
    var yExtent = fc.util.extent(getVisibleData(data, timeSeries2.xDomain()), ['low', 'high']);
    timeSeries2.yDomain(yExtent);
    
    var navChart = function(selection){
        data = selection.datum();
        
        //var brush = d3.svg.brush();
        //brush.extent(timeSeries.xScale()) // ?
        
        /*brush.x(timeSeries2.xScale()) // maybe controlled chart?! OR, by scaling this domain (eg with pan/zoom) it will auto update the brush to correctly update the second chart
            .on('brush', function() {
                if (brush.extent()[0] - brush.extent()[1] !== 0) { // what does this do?!
                    // Control the main chart's time series domain
                    timeSeries.xDomain(brush.extent()); 
                    render();
                }
            });
            
        selection.selectAll('rect.extent')
            .attr('height', timeSeries2.yScale().range()[0])/
        */
        /*var zoom = d3.behavior.zoom()
            .x(timeSeries2.xScale())
            .on('zoom', function() {
                render();
            });*/
            
        timeSeries2.plotArea(multi2);
        selection.call(timeSeries2);
        //selection.call(brush);
        //selection.call(zoom);
    }
    
    function render() {
        svgMain.datum(data)
            .call(mainChart);
        
        svgNav.datum(data)
            .call(navChart);
    }
        
    render();
    render();
    
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