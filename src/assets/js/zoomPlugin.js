(function(fcsc, fc, d3) {
    'use strict';
    fcsc.zoomPlugin = function() {
        var zoomBehavior = d3.behavior.zoom();
        var lastX;
        function zoom(selection, chart) {
            zoomBehavior.x(chart.xScale())
                .on('zoomstart', function() {
                    lastX = d3.mouse(this)[0];
                })
                .on('zoom', function() {

                    if (zoomBehavior.scale() === 1) {
                        var tx = d3.mouse(this)[0] - lastX;
                        var ty = zoomBehavior.translate()[1];
                        zoomBehavior.translate([tx, ty]);
                    }
                    lastX = d3.mouse(this)[0];
                    // Recalling chart draws the new view, this is a place-holder for drawing/two way binding
                    chart(selection);
                });

            selection.call(zoomBehavior);
            return zoom;
        }
        return zoom;
    };
})(fcsc, fc, d3);