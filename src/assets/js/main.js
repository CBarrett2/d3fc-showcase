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
        
        // Redraw
        timeSeries.plotArea(multi);
        selection.call(timeSeries);
        
        // Important for initialization that this happens after timeSeries is called [or can call render() twice]
        var zoom = d3.behavior.zoom()
            .x(timeSeries.xScale())
            .on('zoom', function() {
                render();
            });
        selection.call(zoom);
    }
    
    // Create Nav chart    
    var area = fc.series.area()
        .yValue(function(d) { return d.open; })
        //.y0Value() set properly

    var line = fc.series.line()
        .yValue(function(d) { return d.open; });
    
    var navMulti = fc.series.multi().series([area, line]);        
    var navTimeSeries = fc.chart.linearTimeSeries();
    
    // Set the initial scale
    navTimeSeries.xDomain([data[0].date, data[data.length-1].date]);
    var yExtent = fc.util.extent(getVisibleData(data, navTimeSeries.xDomain()), ['low', 'high']);
    navTimeSeries.yDomain(yExtent);
    
    var navChart = function(selection){
        data = selection.datum();
        
        /*var zoom = d3.behavior.zoom()
            .x(navTimeSeries.xScale())
            .on('zoom', function() {
                render();
            });*/
            
        navTimeSeries.plotArea(navMulti);
        selection.call(navTimeSeries);
        
        var brush = d3.svg.brush(); // Brush doesnt draw initially unless render called twice
        brush.x(navTimeSeries.xScale())
            .on('brushstart', function() {
                
                //if (brush.extent()[0] - brush.extent()[1] !== 0) { 
                    // Control the main chart's time series domain
                    
                // check if on brush or outside
                    
                var x = d3.mouse(this)[0];
                var left = navTimeSeries.xScale()(brush.extent()[0]);
                var right = navTimeSeries.xScale()(brush.extent()[1]);
                
                if ((x < left) || (x > right)) {
                    // If outside the brush, redraw it at new date
                    console.log("outside")
                    var newDate = navTimeSeries.xScale().invert(x);
                    var secondDate = navTimeSeries.xScale().invert(x+5);
                    brush.extent([newDate, newDate]);
                    console.log(brush.extent())
                    //d3.event.stopPropogation();
                    //timeSeries.xDomain(brush.extent()); should be done on 'brush'
                    //render();
                }
                //
                
                //}
            })
            .on('brush', function() {
                if (brush.extent()[0] - brush.extent()[1] !== 0) { 
                    // Control the main chart's time series domain
                    timeSeries.xDomain(brush.extent()); 
                    render();
                }
            });
            
        //selection.selectAll('rect.extent')
        //    .attr('height', navTimeSeries.yScale().range()[0]);
            
        brush.extent(timeSeries.xDomain());
        
        selection.call(brush).selectAll('rect')
            .attr('height', navTimeSeries.yScale().range()[0]);;
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