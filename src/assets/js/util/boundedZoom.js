(function(d3, fc, sc) {
    'use strict';
    sc.util.boundedZoom = function(selection, dispatch) {
        var collisionScale = fc.scale.dateTime()
            .domain(selection.datum().domain)
            .range([0, parseInt(selection.attr('width'), 10)]);
        var zoom = d3.behavior.zoom();
        zoom.x(collisionScale)
            .on('zoom', function() {
                sc.util.zoomControl(zoom, selection, selection.datum().data, collisionScale);
                dispatch.viewChange(collisionScale.domain());
            });

        selection.call(zoom);
    };
})(d3, fc, sc);