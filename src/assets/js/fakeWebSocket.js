(function(sc) {
    'use strict';
    sc.data.feed.coinbase.fakeWebSocket = function() {
        var callback;
        var msgType = 'match';
        var product = 'BTC-USD';
        var ticker = null;

        function rand(low, high) {
            return (Math.random() * (high - low)) + low;
        }

        function fakeWebSocket(cb) {
            callback = cb;

            var event = {
                type: 'open'
            };

            callback(event, null);

            // Send data out every second
            var n = 0;
            ticker = setInterval(function() {
                var datum = {
                    price: rand(200 + n, 210 + n),
                    volume: rand(1, 10),
                    date: new Date()
                };
                n++;
                callback(null, datum);
            }, 1500);
        }

        fakeWebSocket.close = function() {
            // Alternative to saving the callback, we could redefine this function inside fakeWebSocket(cb)
            if (ticker) {
                clearInterval(ticker);
                var event = {
                    type: 'close',
                    code: 1000
                };
                callback(event, null);
            }
            return fakeWebSocket;
        };

        fakeWebSocket.messageType = function(x) {
            if (!arguments.length) {
                return msgType;
            }
            msgType = x;
            return fakeWebSocket;
        };

        fakeWebSocket.product = function(x) {
            if (!arguments.length) {
                return product;
            }
            product = x;
            return fakeWebSocket;
        };

        return fakeWebSocket;
    };

})(sc);