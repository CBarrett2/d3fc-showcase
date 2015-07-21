(function(d3, fc, fcsc) {
    'use strict';
    var width = 500;
    var height = 300;

    var container = d3.select('#chart-example');
    
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

    // Our zoom plugin implements pan and zoom
    var zoomPlugin = fcsc.zoomPlugin();

    
    var chartMain = fcsc.chartFramework()
        .series([candlestick, gridlines])
        .plugins([zoomPlugin]);

    // Set the initial scale
    chartMain.xScale().domain([data[250].date, data[500].date]);

    
        
    // Create Nav chart    
    var area = fc.series.area()
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
    update();

})(d3, fc, fcsc);