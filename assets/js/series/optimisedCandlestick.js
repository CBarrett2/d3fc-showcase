(function(d3, fc, sc) {
    'use strict';
    sc.series.optimisedCandlestick = function() {
        var xScale = fc.scale.dateTime();
        var yScale = d3.scale.linear();

        var candlestick = fc.svg.candlestick()
            .x(function(d) { return xScale(d.date); })
            .open(function(d) { return yScale(d.open); })
            .high(function(d) { return yScale(d.high); })
            .low(function(d) { return yScale(d.low); })
            .close(function(d) { return yScale(d.close); })
            .width(5);

        var upDataJoin = fc.util.dataJoin()
            .selector('path.up')
            .element('path')
            .attrs({'class': 'up'});

        var downDataJoin = fc.util.dataJoin()
            .selector('path.down')
            .element('path')
            .attrs({'class': 'down'});

        var optimisedCandlestick = function(selection) {
            selection.each(function(data) {
                var upData = data.filter(function(d) { return d.open < d.close; });
                var downData = data.filter(function(d) { return d.open >= d.close; });

                upDataJoin(this, [upData])
                    .attr('d', candlestick);

                downDataJoin(this, [downData])
                    .attr('d', candlestick);
            });
        };

        optimisedCandlestick.xScale = function(x) {
            if (!arguments.length) {
                return xScale;
            }
            xScale = x;
            return optimisedCandlestick;
        };
        optimisedCandlestick.yScale = function(x) {
            if (!arguments.length) {
                return yScale;
            }
            yScale = x;
            return optimisedCandlestick;
        };

        return optimisedCandlestick;
    };
})(d3, fc, sc);