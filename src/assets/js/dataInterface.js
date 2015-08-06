(function(sc) {
    'use strict';

    sc.data.dataInterface = function() {
        // In seconds - maybe take this out and have chart pass in a period whenever needed
        var period = 60 * 60 * 24; // might not have to be held
        var historicFeed = null;
        var OHLC = sc.data.OHLC(); 
        var live = false; // used to see if should append/combine last basket with live data
        var fetching = false;
        var dataInterface = {};
        
        dataInterface.getData = function(startDate, endDate, callback) {
            // round start/end dates?

            // Is it this class' responsibility to not make too many requests?? or is it the user's?
            if (fetching) {
                return;
            } else { fetching = true; }

            historicFeed.start(startDate)
                .end(endDate)
                .granularity(period);                
            historicFeed(function(err, newData) {
                // pass errors back to chart in callback
                fetching = false;
                if (!err) { 
                    // To order from oldest to newest - maybe not needed?
                    newData = newData.reverse();
                    
                    callback(newData);
                } else { console.log('Error getting data from historic feed: ' + err); }
            });
        };
        
        // could maybe combine live and liveFeed into one function?
        dataInterface.live = function(callback) {
            if (callback == null) {
                live = false; 
                return dataInterface;
            }
            live = true;
            OHLC(callback);
            return dataInterface;
        };

        // Getters/Setters (maybe some of these could be rebinds?)
        dataInterface.period = function(x) { // could potentially store period outside, in chart + pass it in? but do need to set period for live collection
            if (!arguments.length) { return period; }
            
            period = x;
            if (OHLC) {
                OHLC.period(x);
            }
            return dataInterface;
        };

        d3.rebind(dataInterface, OHLC, 'liveFeed', 'basket')
        
        /*dataInterface.liveFeed = function(feed) { 
            if (!arguments.length) { return OHLC.liveFeed(); }
            liveFeed = feed;
            liveFeed.period(period); 
            // pass the same callback for both feeds? -> save?
            
            d3.rebind(dataInterface, liveFeed, 'basket'); // dont think thisll work?
            return dataInterface;
       };*/

        dataInterface.historicFeed = function(feed) {
            if (!arguments.length) { return historicFeed; }
            historicFeed = feed;
            return dataInterface;
        };

        dataInterface.product = function(x) {
            if (!arguments.length) { return historicFeed.product(); } // or live feeds, whatever exists?? assign product whenever feed is inited
            historicFeed.product(x);
            OHLC.product(x);
            return dataInterface;
        };
        

        return dataInterface;
    };

})(sc);