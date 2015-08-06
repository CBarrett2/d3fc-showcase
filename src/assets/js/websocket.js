(function(sc) {
    'use strict';
    sc.data.feed.coinbase.websocket = function() {
        var product = 'BTC-USD';
        var msgType = 'match';
        var coinbaseSocket = null;
        var callback = null; // not sure we want to be storing things like this?

        function websocket(cb) {
            coinbaseSocket = new WebSocket('wss://ws-feed.exchange.coinbase.com');
            var msg = {
                type: 'subscribe',
                'product_id': product
            };

            callback = cb;

            coinbaseSocket.onopen = function() {
                coinbaseSocket.send(JSON.stringify(msg));
            };

            coinbaseSocket.onmessage = function(event) {
                var messageData = JSON.parse(event.data);
                if (messageData.type === msgType) {
                    var datum = {};
                    datum.date = new Date(messageData.time);
                    datum.price = parseFloat(messageData.price);
                    datum.volume = parseFloat(messageData.size);
                    cb(null, datum);
                }
            };

            coinbaseSocket.onerror = function(err) {
                cb(err, null);
            };

            coinbaseSocket.onclose = function() {
                cb('close', null);
            };

        }

        websocket.close = function() {
            if (coinbaseSocket) {
                coinbaseSocket.close();
            }
        };

        websocket.msgType = function(x) {
            if (!arguments.length) { return msgType; }
            msgType = x;
            return websocket;
        };

        websocket.product = function(x) {
            if (!arguments.length) { return product; }
            product = x;
            if (coinbaseSocket) {
                coinbaseSocket.close();
                websocket(callback);
            }
            return websocket;
        };

        websocket.getProductList = function(cb) {
            d3.json('https://api.exchange.coinbase.com/products/', function(err, data) {
                // jscs:disable
                var productList = data.map(function(currValue) { return currValue.display_name; });
                // jscs:enable
                cb(productList);
            });
        };

        return websocket;
    };

    sc.data.OHLC = function() {
        // Expects transactions with a price, volume and date and organizes them into candles of given periods
        var currentBasket = null;
        var period = 60 * 60 * 24;
        var liveFeed = null;

        function OHLC(callback) {
            liveFeed(function(datum) {
                updateBasket(datum);
                callback(datum);
            });
        }

        OHLC.liveFeed = function(x) {
            if (!arguments.length) { return liveFeed; }
            liveFeed = x;
            currentBasket = null;
            // This requires liveFeed to be set up first, before changing prodcut/etc on liveFeed
            d3.rebind(OHLC, liveFeed, 'product', 'msgType', 'close');
            return OHLC;
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

        OHLC.period = function(x) {
            if (!arguments.length) { return period; }
            period = x;
            currentBasket = null;
            return OHLC;
        };

        OHLC.basket = function(x) {
            return currentBasket;
        };

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

        return OHLC;
    };


})(sc);