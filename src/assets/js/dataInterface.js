(function(sc) {
    'use strict';

    sc.data.dataInterface = function() {
        // In seconds - maybe take this out and have chart pass in a period whenever needed
        var period = 60 * 60 * 24;
        var historicFeed = fc.data.feed.coinbase();
        var ohlc = sc.data.feed.coinbase.ohlcWebSocketAdaptor();
        var n = 0;
        var dataInterface = {};

        dataInterface.getData = function(startDate, endDate, callback) {
            var id = ++n;
            historicFeed.start(startDate)
                .end(endDate)
                .granularity(period);
            historicFeed(function(err, newData) {
                if (id < n) { return; }
                if (!err) {
                    // To order from oldest to newest
                    newData = newData.reverse();
                    callback(null, newData);
                } else { callback(err, null); }
            });
        };

        d3.rebind(dataInterface, ohlc, 'close');

        dataInterface.invalidateCallback = function() {
            n++;
            return dataInterface;
        };

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