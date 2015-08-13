(function(sc) {
    'use strict';

    sc.data.dataInterface = function() {
        var currData = [];
        var ohlc = sc.data.feed.coinbase.ohlcWebSocketAdaptor();
        var onReceivedBasket = function() {};
        var onOpen = function() {};
        var onClose = function() {};
        var onError = function() {};

        var dataInterface = {};

        dataInterface.goLive = function() {
            ohlc(function(event, latestBasket) {
                if (latestBasket) {
                    if (!currData.length) {
                        currData = [latestBasket];
                    } else if (currData[currData.length - 1].date.getTime() !== latestBasket.date.getTime()) {
                        currData.push(latestBasket);
                    } else {
                        currData[currData.length - 1] = latestBasket;
                    }
                    onReceivedBasket();
                }

                if (event.type === 'open') {
                    onOpen();
                } else if (event.type === 'close' && event.code === 1000) {
                    onClose();
                } else if (event) { onError(event); }

            });
            return dataInterface;
        };

        dataInterface.getData = function() {
            return currData;
        };

        dataInterface.onReceivedBasket = function(x) {
            if (!arguments.length) { return onReceivedBasket; }
            onReceivedBasket = x;
            return dataInterface;
        };

        dataInterface.onOpen = function(x) {
            if (!arguments.length) { return onOpen; }
            onOpen = x;
            return dataInterface;
        };

        dataInterface.onClose = function(x) {
            if (!arguments.length) { return onClose; }
            onClose = x;
            return dataInterface;
        };

        dataInterface.onError = function(x) {
            if (!arguments.length) { return onError; }
            onError = x;
            return dataInterface;
        };

        d3.rebind(dataInterface, ohlc, 'close', 'period', 'product');

        return dataInterface;
    };

})(sc);