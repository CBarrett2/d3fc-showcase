(function(sc) {
    'use strict';
    sc.data.basketCollector = function() {
        // Expects transactions with a price, volume and date and organizes them into candles of given periods
        var currentBaskets = {};
        var collectedData = {};
        var liveFeed = {};
        var basketCollector = {};
        var periods = [];

        basketCollector.watchPeriod = function(period) {
            if (periods.indexOf(period) === -1) {
                periods.push(period);
            }
            return basketCollector;
        };

        basketCollector.live = function(callback) {
            liveFeed(function(datum) {
                for (var i = 0; i < periods.length; i++) {
                    updateBasket(datum, periods[i]);
                }
                callback(datum);
            });
            return basketCollector;
        };

        basketCollector.liveFeed = function(feed) {
            // Maybe some of liveFeeds values should be auto-configured to match those of historic feed
            if (!arguments.length) { return liveFeed; }
            liveFeed = feed;
            return basketCollector;
        };

        basketCollector.product = function(product) {
            // perhaps pass to websocket product
            if (!arguments.length) { return liveFeed.product(); }
            if (liveFeed != null) {
                liveFeed.product(product);
            }
            currentBaskets = {};
            collectedData = {};
            periods = [];
            product = product;
            return basketCollector;
        };

        basketCollector.getBasket = function(period) { // necessary?
            return currentBaskets[period];
        };

        basketCollector.getData = function(period) {
            if (currentBaskets[period] == null) {
                return [];
            } else { return collectedData[period].concat(currentBaskets[period]); }
        };

        function updateBasket(datum, period) {
            if (currentBaskets[period] == null) {
                createNewBasket(datum, period);
                collectedData[period] = [];
            }

            var latestTime = datum.date.getTime();
            var startTime = currentBaskets[period].date.getTime();
            var msPeriod = period * 1000;
            if (latestTime > startTime + msPeriod) {
                // have basketCollector set dates properly based on rounding?
                collectedData[period] = collectedData[period].concat(currentBaskets[period]);
                createNewBasket(datum, period);
            } else {
                // Update current basket
                currentBaskets[period].close = datum.price;
                currentBaskets[period].high = Math.max(currentBaskets[period].high, datum.price);
                currentBaskets[period].low = Math.min(currentBaskets[period].low, datum.price);
                currentBaskets[period].volume += datum.volume;
            }
        }

        function createNewBasket(datum, period) {
            // We expect data in this format
            currentBaskets[period] = {
                date: datum.date,
                open: datum.price,
                close: datum.price,
                low: datum.price,
                high: datum.price,
                volume: datum.volume
            };
        }

        return basketCollector;
    };

    sc.data.dataInterface = function() {
        // In seconds - maybe take this out and have chart pass in a period whenever needed
        var currentPeriod = 60 * 60 * 24;
        var historicFeed = null;
        var fetching = false;
        var basketCollector = sc.data.basketCollector();
        var data = {}; // period : historic data
        var earliestDate = d3.time.month.offset(new Date(), -6); // 6 months ago
        var dataInterface = {};

        dataInterface.getCurrentData = function() {
            var latestData = basketCollector.getData(currentPeriod);
            /* any live data before the end of historic data should be discarded
            (? are we rounding? note when historic call was made?-> use this as the cutoff pt for live data?)

            what about doubled live data points in that block though?
            Have to assume both live+historic initialized @ same time - code in? */

            if (data[currentPeriod].length) {
                var lastHistoricDate = data[currentPeriod][data[currentPeriod].length - 1].date;
                var bisector = d3.bisector(function(d) { return d.date; });
                latestData = latestData.splice(bisector.left(latestData, lastHistoricDate), latestData.length);
            }

            var histData = data[currentPeriod];
            var combinedBasket = [];

            if (histData.length && latestData.length) {
                histData = histData.slice(0, data[currentPeriod].length - 1);
                combinedBasket = combineData(data[currentPeriod][data[currentPeriod].length - 1], latestData[0]);
                latestData = latestData.splice(1, latestData.length); // remove first data point
            }
            var currentData = histData.concat(combinedBasket).concat(latestData);
            return currentData;
        };

        function combineData(histBasket, liveBasket) {

            var basket = {
                date: histBasket.date,
                open: histBasket.open,
                volume: histBasket.volume
            };

            basket.close = liveBasket.close;
            basket.high = Math.max(histBasket.high, liveBasket.high);
            basket.low = Math.min(histBasket.low, liveBasket.low);
            basket.volume += liveBasket.volume;

            return basket;
        }

        // Also write similar function to get data between start/end date - maybe take out the fetch function
        dataInterface.getHistoricData = function(callback, numberCandles) {
            // This function gets another 'numberCandles' more historic data
            numberCandles = numberCandles || 100;

            var startDate = null;
            var endDate = null;
            if (data[currentPeriod].length === 0) {
                var currTime = (new Date()).getTime();
                // Convert period to ms + get numberCandles of data
                startDate = new Date(currTime - (currentPeriod * 1000 * numberCandles));
                endDate = new Date();
            } else {
                startDate = new Date(data[currentPeriod][0].date.getTime() - (currentPeriod * 1000 * numberCandles));
                endDate = data[currentPeriod][0].date;
            }

            if (startDate.getTime() < earliestDate.getTime()) {
                var currentData = dataInterface.getCurrentData();
                callback(currentData);
                return;
            }

            // Is it this class' responsibility to not make too many requests?? or is it the user's?
            if (fetching) {
                return;
            } else { fetching = true; }

            historicFeed.start(startDate)
                .end(endDate)
                .granularity(currentPeriod);
            historicFeed(function(err, newData) {
                fetching = false;
                if (!err) {
                    // To order from oldest to newest
                    newData = newData.reverse();

                    // Store the new data we got
                    data[currentPeriod] = newData.concat(data[currentPeriod]);

                    var currentData = dataInterface.getCurrentData();

                    // Return all data! can be sorted through by client
                    callback(currentData);
                } else { console.log('Error getting data from historic feed: ' + err); }
            });
        };

        // could maybe combine live and liveFeed into one function?
        dataInterface.live = function(callback) {
            // This initialized the live feed
            basketCollector.live(callback);
            return dataInterface;
        };

        // Getters/Setters
        dataInterface.period = function(period) {
            if (!arguments.length) { return currentPeriod; }
            currentPeriod = period;
            basketCollector.watchPeriod(currentPeriod);
            if (data[currentPeriod] == null) {
                data[currentPeriod] = [];
            }
            return dataInterface;
        };

        dataInterface.liveFeed = function(feed) {
            if (!arguments.length) { return basketCollector.liveFeed(); }
            basketCollector.liveFeed(feed);
            return dataInterface;
        };

        dataInterface.historicFeed = function(feed) {
            if (!arguments.length) { return historicFeed; }
            historicFeed = feed;
            return dataInterface;
        };

        dataInterface.product = function(product) {
            if (!arguments.length) { return product; }
            historicFeed.product(product);
            basketCollector.product(product);
            // Clear data cache
            data = {};
            dataInterface.period(currentPeriod); // set to watch current period
            basketCollector.watchPeriod(currentPeriod);
            return dataInterface;
        };

        return dataInterface;
    };

})(sc);