(function(sc) {
    'use strict';
    sc.data.feed.coinbase.websocket = function() {
        // can get product list from /products
        var product = 'BTC-USD';
        var productList = [];
        var msgType = 'match';
        var coinbaseSocket = null;
        var callback = null; // not sure we want to be storing things like this?

        function websocket(cb) {
            var coinbaseSocket = new WebSocket('wss://ws-feed.exchange.coinbase.com');
            var msg = {
                type: 'subscribe',
                'product_id': product
            };

            callback = cb;

            coinbaseSocket.onopen = function() {
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
                    // Pass errors back also
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
                websocket(callback);
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
            // Maybe OHLC should store product/msgType and init liveFeed with these conditions when first set? 
            d3.rebind(OHLC, liveFeed, 'product', 'msgType', 'close');
            return OHLC;
        }
        
        function updateBasket(datum) {
            if (currentBasket == null) {
                createNewBasket(datum);
            }
            var latestTime = datum.date.getTime();
            var startTime = currentBasket.date.getTime();
            var msPeriod = period * 1000;
            if (latestTime > startTime + msPeriod) {
                // have OHLC round dates? or round dates outside of class?
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