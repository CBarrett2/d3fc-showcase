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
            if (cb) {
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
            // Restart liveFeed
            liveFeed.close();
            ohlc();
            currentBasket = null;
            return ohlc;
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
                currentBasket.high = Math.max(currentBasket.high, datum.price);
                currentBasket.low = Math.min(currentBasket.low, datum.price);
                currentBasket.volume += datum.volume;
                // Messages can arrive out of order, so in this case we might want to update the open
                if (latestTime < currentBasket.date.getTime()) {
                    currentBasket.open = datum.price;
                } else {
                    currentBasket.close = datum.price;
                }
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