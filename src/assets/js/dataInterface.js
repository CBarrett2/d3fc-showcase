(function(sc) {
    'use strict';

    sc.data.dataInterface = function() {
        // In seconds - maybe take this out and have chart pass in a period whenever needed
        // We could potentially hold period in chart, rather than dataInterface
        var period = 60 * 60 * 24;
        var historicFeed = null;
        var OHLC = sc.data.OHLC();
        var fetching = false;
        var dataInterface = {};

        dataInterface.getData = function(startDate, endDate, callback) {
            if (fetching) {
                return;
            } else { fetching = true; }

            historicFeed.start(startDate)
                .end(endDate)
                .granularity(period);
            historicFeed(function(err, newData) {
                fetching = false;
                if (!err) {
                    // To order from oldest to newest
                    newData = newData.reverse();
                    callback(null, newData);
                } else { callback(err, null); }
            });
        };

        dataInterface.live = function(callback) {
            OHLC(callback);
            return dataInterface;
        };

        dataInterface.period = function(x) {
            if (!arguments.length) { return period; }
            period = x;
            OHLC.period(x);
            return dataInterface;
        };

        d3.rebind(dataInterface, OHLC, 'liveFeed', 'basket');

        dataInterface.historicFeed = function(x) {
            if (!arguments.length) { return historicFeed; }
            historicFeed = x;
            return dataInterface;
        };

        dataInterface.product = function(x) {
            if (!arguments.length) { return historicFeed.product(); }
            historicFeed.product(x);
            OHLC.product(x);
            return dataInterface;
        };


        return dataInterface;
    };

})(sc);