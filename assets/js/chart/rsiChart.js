(function(sc) {
    'use strict';
    // Helper functions
    sc.chart.rsiChart = function() {
        var dispatch = d3.dispatch('viewChange');

        var rsiScale = d3.scale.linear()
            .domain([0, 100]);

        var rsi = fc.indicator.renderer.relativeStrengthIndex()
            .yScale(rsiScale);

        function rsiChart(selection) {
            var dataModel = selection.datum();

            rsi.xScale()
                .domain(dataModel.viewDomain)
                .range([0, selection.attr('width')]);
            rsi.yScale().range([parseInt(selection.style('height'), 10), 0]);

            /*rsi.mapping(function(series) {
                return dataModel.visibleData;
            });*/

            var zoom = d3.behavior.zoom();
            zoom.x(rsi.xScale())
                .on('zoom', function() {
                    sc.util.zoomControl(zoom, selection, dataModel.totalXExtent, rsi.xScale());
                    dispatch.viewChange(rsi.xScale().domain());
                });

            selection.call(zoom);
            selection.datum(dataModel.visibleData)
                .call(rsi);
        }

        d3.rebind(rsiChart, dispatch, 'on');

        return rsiChart;
    };

})(sc);