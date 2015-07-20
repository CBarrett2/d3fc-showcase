(function(fcsc, fc, d3) {
    'use strict';
    fcsc.zoomPlugin = function() {
        var zoomBehavior = d3.behavior.zoom();
        var dragBehavior = d3.behavior.drag();
        var lastX;//, lastY;
        function zoom(selection, chart) {
            zoomBehavior.x(chart.xScale())
                .on('zoomstart', function() {
                    lastX = d3.mouse(this)[0];
                })
                .on('zoom', function() {
                    var tx = d3.mouse(this)[0] - lastX;
                    var ty = zoomBehavior.translate()[1];
                    
                    lastX = d3.mouse(this)[0];

                    zoomBehavior.translate([tx, ty]);

                    // Recalling chart draws the new view, this is a place-holder for drawing/two way binding
                    //selection.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
                    chart(selection);
                })
                         
                
            selection.call(zoomBehavior);
            return zoom;
        }
        return zoom;
    };
})(fcsc, fc, d3);