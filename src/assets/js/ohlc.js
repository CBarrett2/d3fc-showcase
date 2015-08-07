(function(sc) {
    'use strict';
    sc.data.ohlc = function() {
        // Expects transactions with a price, volume and date and organizes them into candles of given periods
        // Re-call OHLC whenever you want to start collecting for a new period/product
        // In seconds
        var period = 60 * 60 * 24;
        var liveFeed = sc.data.feed.coinbase.websocket();

        function ohlc(cb) {
            liveFeed.close();
            var currentBasket = null;
            liveFeed(function(err, datum) {
                if (datum) {
                    currentBasket = updateBasket(currentBasket, datum);
                }
                cb(err, currentBasket);
            });
        }

        ohlc.period = function(x) {
            if (!arguments.length) {
                return period;
            }
            period = x;
            return ohlc;
        };

        d3.rebind(ohlc, liveFeed, 'product');

        function updateBasket(basket, datum) {
            if (basket == null) {
                basket = createNewBasket(datum);
            }
            var latestTime = datum.date.getTime();
            var startTime = basket.date.getTime();
            var msPeriod = period * 1000;
            if (latestTime > startTime + msPeriod) {
                basket = createNewBasket(datum);
            } else {
                // Update current basket
                basket.high = Math.max(basket.high, datum.price);
                basket.low = Math.min(basket.low, datum.price);
                basket.volume += datum.volume;
                // Messages can arrive out of order, so in this case we might want to update the open
                if (latestTime < basket.date.getTime()) {
                    basket.open = datum.price;
                } else {
                    basket.close = datum.price;
                }
            }
            return basket;
        }

        function createNewBasket(datum) {
            return {
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