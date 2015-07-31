(function(sc) {
    'use strict';

    sc.data.feed.coinbase.websocket = function() {
        // can get product list from /products
        var product = 'BTC-USD';
        var products = [];
        d3.json('https://api.exchange.coinbase.com/products/', function(err, data) {
            for (var i = 0; i < data.length; i++) {
                // jscs:disable
                products.push(data[i].display_name);
                // jscs:enable
            }
        });

        function websocket(cb) {
            var coinbaseSocket = new WebSocket('wss://ws-feed.exchange.coinbase.com');
            var msg = {
                type: 'subscribe',
                // jscs:disable
                product_id: product
                // jscs:enable
            };

            coinbaseSocket.onopen = function() {
                // Send the msg object as a JSON-formatted string.
                coinbaseSocket.send(JSON.stringify(msg));
            };

            coinbaseSocket.onmessage = function(event) {
                var jMsg = JSON.parse(event.data);
                if (jMsg.type === 'match') {
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

            websocket.close = function() {
                coinbaseSocket.close();
            };

        }

        websocket.product = function(product) {
            if (!arguments.length) { return product; }
            product = product;
            return websocket;
        };

        websocket.getProductList = function() {
            return products;
        };

        return websocket;
    };

})(sc);