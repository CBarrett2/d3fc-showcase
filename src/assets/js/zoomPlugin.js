(function(fcsc, fc, d3) {
    'use strict';
    fcsc.zoomPlugin = function() {
        var zoomBehavior = d3.behavior.zoom();
        function zoom(selection, chart) {
            zoomBehavior.x(chart.dateScale())
                .on('zoom', function() {
                    // Recalling chart draws the new view, this is a place-holder for drawing/two way binding
                    chart(selection);
                });
            selection.call(zoomBehavior);
            return zoom;
        }

        // Perhaps should use d3.bind again
        zoom.scaleExtent = function(value) {
            if (!arguments.length) { return zoomBehavior.scaleExtent(); }
            zoomBehavior.scaleExtent(value);
            return zoom;
        };
        return zoom;
    };
})(fcsc, fc, d3);