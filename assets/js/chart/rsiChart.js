(function(sc) {
    'use strict';
    // Helper functions
    sc.chart.rsiChart = function() {
        var dispatch = d3.dispatch('viewChange');

        var rsiScale = d3.scale.linear()
            .domain([0, 100]);

        var rsiAlgorithm = fc.indicator.algorithm.relativeStrengthIndex();

        var rsi = fc.indicator.renderer.relativeStrengthIndex()
            .yScale(rsiScale);

        function rsiChart(selection, viewDomain) {
            rsi.xScale()
                .domain(viewDomain)
                .range([0, selection.attr('width')]);
            rsi.yScale().range([parseInt(selection.style('height'), 10), 0]);

            var zoom = d3.behavior.zoom();
            zoom.x(rsi.xScale())
                .on('zoom', function() {
                    sc.util.zoomControl(zoom, selection, selection.datum(), rsi.xScale());
                    dispatch.viewChange(rsi.xScale().domain());
                });
            selection.call(zoom);
            selection.call(rsi);
        }

        rsiChart.updateData = function(selection) {
            var data = selection.datum();

            rsiAlgorithm(data);
            //selection.datum(data);
            return rsiChart;
        };

        d3.rebind(rsiChart, dispatch, 'on');

        return rsiChart;
    };

})(sc);