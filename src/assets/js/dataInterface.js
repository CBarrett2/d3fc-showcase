(function(sc) {
    'use strict';
    sc.data.dataInterface = function() {
        var currentPeriod = 60 * 60 * 24; // In seconds
        var historicFeed = null;
        var liveFeed = null;
        var fetching = false;
        var currentBaskets = {}; // period : basket
        var data = {}; // period : historic data
        var earliestDate = d3.time.month.offset(new Date(), -6); // 6 months ago
        var dataInterface = {};

        dataInterface.getCurrentData = function() {
            // Add latest basket if we have it
            var currentData = null;
            if (data[currentPeriod] == null) {
                return data[currentPeriod];
            }
            if (currentBaskets[currentPeriod] != null) {
                currentData = data[currentPeriod].concat(currentBaskets[currentPeriod]);
            } else { currentData = data[currentPeriod]; }
            // Perhaps whoever gets this reference maybe might have the chance to alter data...
            return currentData;
        };

        dataInterface.getHistoricData = function(callback, numberCandles) {
            // This function gets another 'numberCandles' more historic data
            // Calls callback with all the data we have for the current period
            // Set default number of candles to 100
            numberCandles = numberCandles || 100;
            // Is it this class' responsibility to not make too many requests?? or is it the user's?
            if (fetching) {
                return;
            } else { fetching = true; }

            var startDate = null;
            var endDate = null;
            if (data[currentPeriod] == null) {
                data[currentPeriod] = [];
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

        dataInterface.live = function(callback) {
            // This initialized the live feed
            liveFeed(function(datum) {
                    updateAllBaskets(datum);
                    var currentData = dataInterface.getCurrentData();
                    callback(currentData);
                });
            return dataInterface;
        };

        // Getters/Setters
        dataInterface.period = function(period) {
            if (!arguments.length) { return currentPeriod; }
            currentPeriod = period;
            return dataInterface;
        };

        dataInterface.liveFeed = function(feed) {
            if (!arguments.length) { return liveFeed; }
            liveFeed = feed;
            return dataInterface;
        };

        dataInterface.historicFeed = function(feed) {
            if (!arguments.length) { return historicFeed; }
            historicFeed = feed;
            return dataInterface;
        };

        dataInterface.product = function(product) {
            if (!arguments.length) { return product; }
            if (liveFeed != null) {
                liveFeed.product(product);
            }
            historicFeed.product(product);
            // Clear data cache
            currentBaskets = {};
            data = {};
            return dataInterface;
        };

        // Helper functions
        function updateAllBaskets(datum) {
            /* Use the last data point of historic data as the first basket.
            Live data can only be streamed if some historic data has been fetched.
            Really, live feed should be initialized along with the initial historic fetch */
            if ((currentBaskets[currentPeriod] == null) && (data[currentPeriod] !== null)) {
                // Use the last historic data point
                currentBaskets[currentPeriod] = data[currentPeriod][data[currentPeriod].length - 1];
                // Remove data point from historic data
                data[currentPeriod] = data[currentPeriod].splice(0, data[currentPeriod].length - 1);
            }

            for (var period in currentBaskets) {
                if (currentBaskets.hasOwnProperty(period)) {
                    updateBasket(datum, period);
                }
            }
        }

        function updateBasket(datum, period) {
            var latestTime = datum.date.getTime();
            var startTime = currentBaskets[period].date.getTime();
            var msPeriod = period * 1000;
            if (latestTime > startTime + msPeriod) {
                data[period] = data[period].concat(currentBaskets[period]);
                createNewBasket(datum, period);
            } else {
                // Update current basket
                currentBaskets[period].close = datum.price;
                currentBaskets[period].high = Math.max(currentBaskets[period].high, datum.price);
                currentBaskets[period].low = Math.min(currentBaskets[period].min, datum.price);
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

        return dataInterface;
    };
})(sc);