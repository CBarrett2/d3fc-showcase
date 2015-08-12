(function(d3, fc, sc) {
    'use strict';

    describe('sc.data.feed.coinbase.ohlcWebSocketAdaptor', function() {
        function testFeed() {
            var data = fc.data.random.financial()(10);
            var index = 0;
            var callback;
            function feed(cb) {
                callback = cb;
            }

            feed.sendDatum = function() {
                callback(null, data[index]);
                index++;
            };

            feed.sendEvent = function(x) {
                // Not sure if this should be less prescriptive about the type of event sent?
                // Although this is probably the expected interface?
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
        
        it('should callback when events are triggered in the live feed', function() {
            var feed = testFeed();
            ohlc.liveFeed(feed);
            var eventType = '';
            ohlc(function(event, basket) {
                eventType = event.type;
            });
            
            feed.sendEvent('open');
            expect(eventType).toEqual('open');
        });
        
        
    });

})(d3, fc, sc);