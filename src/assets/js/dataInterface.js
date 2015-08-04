(function(sc) {
    'use strict';
    sc.data.basketCollector = function() {
        // Expects transactions with a price, volume and date and organizes them into candles of given periods
        var currentBaskets = {};
        var collectedData = {};
        var liveFeed = {};
        var basketCollector = {};

        basketCollector.init = function(latestBasket, period) {
            if (currentBaskets[period] == null) {
                // Use the last historic data point
                collectedData[period] = [];
                currentBaskets[period] = latestBasket;
            }
            return basketCollector;
        };

        basketCollector.live = function(callback) {
            liveFeed(function(datum) {
                for (var period in currentBaskets) {
                    if (currentBaskets.hasOwnProperty(period)) {
                        updateBasket(datum, period);
                    }
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
            if (!arguments.length) { return liveFeed.product(); } // perhaps pass to websocket product
            if (liveFeed != null) {
                liveFeed.product(product);
            }
            currentBaskets = {};
            collectedData = {};
            product = product;
            return basketCollector;
        };

        basketCollector.getBasket = function(period) { // maybe could have getter/setter rather than this + init
            return currentBaskets[period];
        };

        // would be nice to get collectedData[period] = [] defined whenever currentBaskets defined
        basketCollector.getData = function(period) {
            if (collectedData[period]) {
                return collectedData[period].concat(currentBaskets[period]);
            } else { return currentBaskets[period]; }
        };

        function updateBasket(datum, period) {
            var latestTime = datum.date.getTime();
            var startTime = currentBaskets[period].date.getTime();
            var msPeriod = period * 1000;
            if (latestTime > startTime + msPeriod) {
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
        var currentPeriod = 60 * 60 * 24; // In seconds
        var historicFeed = null;
        var fetching = false;
        var basketCollector = sc.data.basketCollector();
        var data = {}; // period : historic data
        var earliestDate = d3.time.month.offset(new Date(), -6); // 6 months ago
        var dataInterface = {};

        dataInterface.getCurrentData = function() {
            if (data[currentPeriod] == null) {
                return null;
            }
            var latestData = basketCollector.getData(currentPeriod);
            var currentData = data[currentPeriod]
            if (latestData) {
                currentData = currentData.concat(latestData);
            }
            return currentData;
        };

        dataInterface.getHistoricData = function(callback, numberCandles) {
            // This function gets another 'numberCandles' more historic data
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

                    // move to when period changed?
                    var latestBasket = basketCollector.getBasket(currentPeriod);
                    if (latestBasket == null) {
                        latestBasket = data[currentPeriod][data[currentPeriod].length - 1];
                        basketCollector.init(latestBasket, currentPeriod);
                        data[currentPeriod] = data[currentPeriod].slice(0, data[currentPeriod].length - 1);
                    }

                    var currentData = dataInterface.getCurrentData();

                    // Return all data! can be sorted through by client
                    callback(currentData);
                } else { console.log('Error getting data from historic feed: ' + err); }
            });
        };

        dataInterface.live = function(callback) {
            // This initialized the live feed
            basketCollector.live(callback);
            return dataInterface;
        };

        // Getters/Setters
        dataInterface.period = function(period) {
            if (!arguments.length) { return currentPeriod; }
            currentPeriod = period;
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
            return dataInterface;
        };

        return dataInterface;
    };

})(sc);