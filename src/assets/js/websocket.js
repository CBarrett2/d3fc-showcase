(function(sc) {
    'use strict';
    sc.data.feed.coinbase.websocket = function() {
        var product = 'BTC-USD';
        var msgType = 'match';
        var coinbaseSocket = null;

        function websocket(cb) {
            coinbaseSocket = new WebSocket('wss://ws-feed.exchange.coinbase.com');
            var msg = {
                type: 'subscribe',
                'product_id': product
            };

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
            if (coinbaseSocket && coinbaseSocket.readyState === 1) {
                coinbaseSocket.close();
            }
            return websocket;
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
                // jscs:disable requireCamelCaseOrUpperCaseIdentifiers
                var productList = data.map(function(product) { return product.display_name; });
                // jscs:enable requireCamelCaseOrUpperCaseIdentifiers
                cb(err, productList);
            });
            return websocket;
        };

        return websocket;
    };

})(sc);