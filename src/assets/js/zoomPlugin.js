(function(fcsc, fc, d3) {
    'use strict';
    fcsc.zoomPlugin = function() {
        function pan(selection, chart) {
            var zoom = d3.behavior.zoom()
                .x(chart.dateScale())
                //.scaleExtent(fc.util.extent(selection.data(), ['date']))
                .on('zoom', function() {
                    // Recalling chart draws the new view, this is a place-holder for drawing/two way binding
                    chart(selection);
                });
            selection.call(zoom);
            return pan;
        }
        return pan;
    };
})(fcsc, fc, d3);