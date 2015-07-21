(function(d3, fc, fcsc) {
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
                    // Alter the default behavior if panning
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
})(d3, fc, fcsc);