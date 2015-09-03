(function(d3, fc, sc) {
    'use strict';

    sc.chart.macdChart = function() {
        var dispatch = d3.dispatch('viewChange');

        var macdAlgorithm = fc.indicator.algorithm.macd();

        var macd = fc.indicator.renderer.macd();

        function macdChart(selection) {
            var data = selection.datum().data;
            var domain = selection.datum().domain;
            var currentBufferPeriod = selection.datum().displayBuffer ? selection.datum().period : 0;
            var paddedDomain = sc.util.paddedExtent(domain, currentBufferPeriod);

            macdAlgorithm(data);

            var maxYExtent = d3.max(data, function(d) {
                return Math.abs(d.macd.macd);
            });

            macd.xScale()
                .domain(paddedDomain)
                .range([0, parseInt(selection.style('width'), 10)]);
            macd.yScale()
                .domain([-maxYExtent, maxYExtent])
                .range([parseInt(selection.style('height'), 10), 0]);

            sc.util.applyZoom(selection, data, dispatch, domain);

            selection.datum(data)
                .call(macd);
        }

        d3.rebind(macdChart, dispatch, 'on');

        return macdChart;
    };

})(d3, fc, sc);