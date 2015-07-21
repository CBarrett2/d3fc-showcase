(function(d3, fc, fcsc) {
    'use strict';
    fcsc.navbarPlugin = function(controlledChart) {
        var controlledChart = controlledChart;
        var brush = d3.svg.brush();
        
        function nav(selection, chart) {
            brush.extent(controlledChart.xScale().domain());
            brush.x(chart.xScale()) // maybe controlled chart?! OR, by scaling this domain (eg with pan/zoom) it will auto update the brush to correctly update the second chart
                .on('brush', function() {
                    if (brush.extent()[0] - brush.extent()[1] !== 0) { // what does this do?!
                        controlledChart.xScale().domain(brush.extent()); 
                        
                        // Update both charts, as they both have visual changes
                        //chart(selection); needed if not for meta-update
                        chart.update();
                        
                    }
                });
            selection.call(brush);
            selection.selectAll('rect.extent')
                .attr('height', chart.yScale().range()[0])
        }
        
        return nav;
    };
})(d3, fc, fcsc);