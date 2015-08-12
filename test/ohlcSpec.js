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

        var ohlc;

        beforeEach(function() {
            ohlc = sc.data.feed.coinbase.ohlcWebSocketAdaptor();
        });

        it('should have a working getter/setter for period', function() {
            ohlc.period(60 * 60 * 24);
            expect(ohlc.period()).toEqual(60 * 60 * 24);
        });

        it('should have working getter/setter for liveFeed', function() {
            var feed = testFeed();
            ohlc.liveFeed(feed);
            expect(ohlc.liveFeed()).toEqual(feed);
        });

        it('should pass events to callback when one is triggered in the live feed', function() {
            var feed = testFeed();
            ohlc.liveFeed(feed);
            var eventType = '';
            ohlc(function(event, basket) {
                eventType = event.type;
            });

            feed.sendEvent('open');
            expect(eventType).toEqual('open');
        });

        it('should pass the latest basket of data collected to callback' +
            'whenever a new datum is pushed by the live feed', function() {
            var feed = testFeed();
            ohlc.liveFeed(feed);
            var called = false;
            ohlc(function(event, basket) {
                called = true;
            });

            var datum = {
                price: 10,
                volume: 1,
                date: new Date(1000)
            };

            feed.sendDatum(datum);
            expect(called).toBeTruthy();
        });

        it('should initialize a new basket when the first datum is pushed by live feed', function() {
            var feed = testFeed();
            ohlc.liveFeed(feed);
            var currBasket = {};
            ohlc(function(event, basket) {
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

            feed.sendDatum(datum);
            expect(currBasket).toEqual(expectedBasket);
        });

        it('should update the basket returned to callback as new data are pushed', function() {
            var feed = testFeed();
            ohlc.liveFeed(feed);
            ohlc.period(60 * 60 * 24);
            var currBasket = {};

            ohlc(function(event, basket) {
                currBasket = basket;
            });

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

            feed.sendDatum(datum1);
            feed.sendDatum(datum2);
            feed.sendDatum(datum3);
            expect(currBasket).toEqual(expectedBasket);
        });

        it('should create a new basket when the first datum is pushed after the', function() {
            var feed = testFeed();
            ohlc.liveFeed(feed);
            ohlc.period(60 * 60 * 24);
            var currBasket = {};

            ohlc(function(event, basket) {
                currBasket = basket;
            });

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

            feed.sendDatum(datum1);
            feed.sendDatum(datum2);
            expect(currBasket).toEqual(expectedBasket);
        });
    });
})(d3, fc, sc);