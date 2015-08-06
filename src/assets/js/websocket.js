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

            coinbaseSocket.onerror = function(event) {
                cb(event, null);
            };

            coinbaseSocket.onclose = function(event) {
                cb(event, null);
            };

        }

        websocket.close = function() {
            if (coinbaseSocket) {
                if (coinbaseSocket.readyState === 1) {
                    coinbaseSocket.close();
                }
            }
        };

        websocket.msgType = function(x) {
            if (!arguments.length) {
                return msgType;
            }
            msgType = x;
            return websocket;
        };

        websocket.product = function(x) {
            if (!arguments.length) {
                return product;
            }
            product = x;
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

})(sc);