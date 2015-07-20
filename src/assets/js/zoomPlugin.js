(function(fcsc, fc, d3) {
    'use strict';
    fcsc.zoomPlugin = function() {
        var zoomBehavior = d3.behavior.zoom();
        var dataExtent = []; // [min, max]
        function zoom(selection, chart) {
            zoomBehavior.x(chart.dateScale())
                //.y(chart.timeSeries().yDomain())
                .size([chart.width(), chart.height()])
                .on('zoom', function() {
                    // Set furthest left and right points you can pan
                    dataExtent = fc.util.extent(selection.data(), ['date']);
                    var tx = zoomBehavior.translate()[0];
                    var ty = zoomBehavior.translate()[1];

                    var min = chart.dateScale()(dataExtent[0]);
                    var max = chart.dateScale()(dataExtent[1]);

                    if (min >= 0) {
                        tx = Math.max(0, tx - min);
                    }
                    if ((max - chart.width()) <= 0) {
                        tx = Math.min(0, tx - (max - chart.width()));
                    }
                    zoomBehavior.translate([tx, ty]);

                    // Recalling chart draws the new view, this is a place-holder for drawing/two way binding
                    chart(selection);
                });
            selection.call(zoomBehavior);
            return zoom;
        }

        return zoom;
    };
})(fcsc, fc, d3);