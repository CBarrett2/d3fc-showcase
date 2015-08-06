(function(sc) {
    'use strict';
    sc.data.ohlc = function() {
        // Expects transactions with a price, volume and date and organizes them into candles of given periods
        var currentBasket = null;
        // In seconds
        var period = 60 * 60 * 24;
        var liveFeed = sc.data.feed.coinbase.websocket();
        var callback = function(event, datum) { return; };

        function ohlc(cb) {
            if (arguments.length) {
                callback = cb;
            }
            liveFeed(function(err, datum) {
                if (datum) {
                    updateBasket(datum);
                }
                callback(err, datum);
            });
        }

        ohlc.liveFeed = function(x) {
            if (!arguments.length) {
                return liveFeed;
            }
            liveFeed = x;
            currentBasket = null;
            return ohlc;
        };

        ohlc.product = function(x) {
            if (!arguments.length) {
                return liveFeed.product();
            }
            liveFeed.product(x);
            liveFeed.close();
            ohlc();
            currentBasket = null;
        };

        ohlc.period = function(x) {
            if (!arguments.length) {
                return period;
            }
            period = x;
            currentBasket = null;
            return ohlc;
        };

        ohlc.basket = function() {
            return currentBasket;
        };

        function updateBasket(datum) {
            if (currentBasket == null) {
                createNewBasket(datum);
            }
            var latestTime = datum.date.getTime();
            var startTime = currentBasket.date.getTime();
            var msPeriod = period * 1000;
            if (latestTime > startTime + msPeriod) {
                createNewBasket(datum);
            } else {
                // Update current basket
                currentBasket.close = datum.price;
                currentBasket.high = Math.max(currentBasket.high, datum.price);
                currentBasket.low = Math.min(currentBasket.low, datum.price);
                currentBasket.volume += datum.volume;
            }
        }

        function createNewBasket(datum) {
            currentBasket = {
                date: datum.date,
                open: datum.price,
                close: datum.price,
                low: datum.price,
                high: datum.price,
                volume: datum.volume
            };
        }

        return ohlc;
    };
})(sc);