(function(sc) {
    'use strict';

    sc.data.feed.coinbase.websocket = function() {
        // can get product list from /products
        var product = 'BTC-USD';
        var productList = [];
        var msgType = 'received';
        var coinbaseSocket = null;
        var callback = null;

        function websocket(cb) {
            var coinbaseSocket = new WebSocket('wss://ws-feed.exchange.coinbase.com');
            var msg = {
                type: 'subscribe',
                'product_id': product
            };

            callback = cb;

            coinbaseSocket.onopen = function() {
                // Send the msg object as a JSON-formatted string.
                coinbaseSocket.send(JSON.stringify(msg));
            };

            coinbaseSocket.onmessage = function(event) {
                var jMsg = JSON.parse(event.data);
                if (jMsg.type === msgType) {
                    var datum = {};
                    datum.date = new Date(jMsg.time);
                    datum.price = parseFloat(jMsg.price);
                    datum.volume = parseFloat(jMsg.size);
                    console.log(datum);
                    cb(datum);
                }

            };

            coinbaseSocket.onerror = function(err) {
                console.log('Error loading data from coinbase websocket: ' + err);
            };

        }

        websocket.close = function() {
            if (coinbaseSocket) {
                coinbaseSocket.close();
            }
        };

        websocket.msgType = function(msgType) {
            if (!arguments.length) { return msgType; }
            msgType = msgType;
            return websocket;
        };

        websocket.product = function(product) {
            if (!arguments.length) { return product; }
            product = product;
            if (coinbaseSocket) {
                coinbaseSocket.close();
                coinbaseSocket(callback);
            }
            return websocket;
        };

        websocket.getProductList = function(cb) {
            if (productList) { cb(productList); }
            d3.json('https://api.exchange.coinbase.com/products/', function(err, data) {
                // jscs:disable
                productList = data.map(function(currValue) { return currValue.display_name; });
                // jscs:enable
                cb(productList);
            });
        };

        return websocket;
    };

})(sc);