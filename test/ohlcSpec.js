(function(d3, fc, sc) {
    'use strict';

    describe('sc.data.feed.coinbase.ohlcWebSocketAdaptor', function() {
        var ohlc;

        beforeEach(function() {
            ohlc = sc.data.feed.coinbase.ohlcWebSocketAdaptor();
        });

        it('should have a working getter/setter for period', function() {
            ohlc.period(60 * 60 * 24);
            expect(ohlc.period()).toEqual(60 * 60 * 24);
        });
    });

})(d3, fc, sc);