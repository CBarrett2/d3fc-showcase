(function(sc) {
    'use strict';
    sc.data.feed.coinbase.ohlcWebSocketAdaptor = function(feed) {
        // Expects transactions with a price, volume and date and organizes them into candles of given periods
        // Re-call OHLC whenever you want to start collecting for a new period/product
        // In seconds
        var liveFeed = feed || sc.data.feed.coinbase.webSocket();

        function ohlc(cb, period) {
            var basket = null;
            liveFeed(function(err, datum) {
                if (datum) {
                    basket = updateBasket(basket, datum, period);
                }
                cb(err, basket);
            });
        }

        d3.rebind(ohlc, liveFeed, 'product', 'messageType', 'close');

        function updateBasket(basket, datum, period) {
            if (basket == null) {
                return createNewBasket(datum, datum.date);
            }
            var latestTime = datum.date.getTime();
            var startTime = basket.date.getTime();
            var msPeriod = period * 1000;
            if (latestTime > startTime + msPeriod) {
                basket = createNewBasket(datum, new Date(startTime + msPeriod));
            } else {
                // Update current basket
                basket.high = Math.max(basket.high, datum.price);
                basket.low = Math.min(basket.low, datum.price);
                basket.volume += datum.volume;
                basket.close = datum.price;
            }
            return basket;
        }

        function createNewBasket(datum, time) {
            return {
                date: time,
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
