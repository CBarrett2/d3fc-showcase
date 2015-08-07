(function(sc) {
    'use strict';

    sc.data.dataInterface = function() {
        // In seconds - maybe take this out and have chart pass in a period whenever needed
        // We could potentially hold period in chart, rather than dataInterface
        var period = 60 * 60 * 24;
        var historicFeed = null;
        var ohlc = sc.data.ohlc();
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

        // Could rebind as ohlc?
        dataInterface.live = function(callback) {
            ohlc(callback);
            return dataInterface;
        };

        dataInterface.period = function(x) {
            if (!arguments.length) { return period; }
            period = x;
            ohlc.period(x);
            return dataInterface;
        };

        d3.rebind(dataInterface, ohlc, 'liveFeed');

        dataInterface.historicFeed = function(x) {
            if (!arguments.length) { return historicFeed; }
            historicFeed = x;
            return dataInterface;
        };

        dataInterface.product = function(x) {
            if (!arguments.length) { return historicFeed.product(); }
            historicFeed.product(x);
            ohlc.product(x);
            return dataInterface;
        };


        return dataInterface;
    };

})(sc);