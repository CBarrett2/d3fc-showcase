(function(d3, fc, sc) {
    'use strict';

    describe('sc.data.feed.coinbase.ohlcWebSocketAdaptor', function() {
        function testFeed() {
            var callback;
            function feed(cb) {
                callback = cb;
            }

            feed.sendDatum = function(datum) {
                callback(null, datum);
            };

            feed.sendEvent = function(x) {
                var event = {type: x};
                callback(event, null);
            };

            return feed;
        }

        beforeEach(function() {
            this.testFeed = testFeed();
            this.ohlc = sc.data.feed.coinbase.ohlcWebSocketAdaptor(this.testFeed);
        });

        it('when an event is triggered in the live feed, it should be passed to the callback', function() {
            var eventType;
            this.ohlc(function(event, basket) {
                eventType = event.type;
            });

            this.testFeed.sendEvent('open');
            expect(eventType).toEqual('open');
        });

        it('should initialize a new basket when the first datum is pushed by live feed', function() {
            var currBasket;
            this.ohlc(function(event, basket) {
                currBasket = basket;
            });

            var datum = {
                price: 10,
                volume: 1,
                date: new Date(1000)
            };

            var expectedBasket = {
                date: new Date(1000),
                open: 10,
                high: 10,
                low: 10,
                close: 10,
                volume: 1
            };

            this.testFeed.sendDatum(datum);
            expect(currBasket).toEqual(expectedBasket);
        });

        it('should update the basket returned to callback as new data are pushed', function() {
            var currBasket;
            this.ohlc(function(event, basket) {
                currBasket = basket;
            }, 60 * 60 * 24);

            var datum1 = {
                price: 10,
                volume: 1,
                date: new Date(1000)
            };

            var datum2 = {
                price: 15,
                volume: 1,
                date: new Date(2000)
            };

            var datum3 = {
                price: 5,
                volume: 2,
                date: new Date(3000)
            };

            var expectedBasket = {
                date: new Date(1000),
                open: 10,
                high: 15,
                low: 5,
                close: 5,
                volume: 4
            };

            this.testFeed.sendDatum(datum1);
            this.testFeed.sendDatum(datum2);
            this.testFeed.sendDatum(datum3);
            expect(currBasket).toEqual(expectedBasket);
        });

        it('should create a new basket when the first datum is pushed after the period has expired ' +
           'which has a time of oldTime + period', function() {
            var currBasket;

            this.ohlc(function(event, basket) {
                currBasket = basket;
            }, 60 * 60 * 24);

            var datum1 = {
                price: 10,
                volume: 1,
                date: new Date(1000)
            };

            var datum2 = {
                price: 15,
                volume: 1,
                date: new Date(1001 + (60 * 60 * 24 * 1000))
            };

            var expectedBasket = {
                // New basket is created at oldTime + period, not at the time of the first datum sent
                date: new Date(1000 + (60 * 60 * 24 * 1000)),
                open: 15,
                high: 15,
                low: 15,
                close: 15,
                volume: 1
            };

            this.testFeed.sendDatum(datum1);
            this.testFeed.sendDatum(datum2);
            expect(currBasket).toEqual(expectedBasket);
        });
    });
})(d3, fc, sc);