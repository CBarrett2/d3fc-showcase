(function(d3, fc, sc) {
    'use strict';

    sc.chart.rsiChart = function() {
        var dispatch = d3.dispatch('viewChange');

        var rsiScale = d3.scale.linear()
            .domain([0, 100]);

        var rsiAlgorithm = fc.indicator.algorithm.relativeStrengthIndex();

        var rsi = fc.indicator.renderer.relativeStrengthIndex()
            .yScale(rsiScale);

        function rsiChart(selection) {
            var data = selection.datum().data;
            var domain = selection.datum().domain;

            var currentBufferPeriod = selection.datum().displayBuffer ? selection.datum().period : 0;
            var paddedDomain = sc.util.paddedExtent(domain, currentBufferPeriod);

            rsi.xScale()
                .domain(paddedDomain)
                .range([0, parseInt(selection.style('width'), 10)]);
            rsi.yScale().range([parseInt(selection.style('height'), 10), 0]);

            rsiAlgorithm(data);

            sc.util.applyZoom(selection, data, dispatch, domain);

            selection.datum(data)
                .call(rsi);
        }

        d3.rebind(rsiChart, dispatch, 'on');

        return rsiChart;
    };

})(d3, fc, sc);