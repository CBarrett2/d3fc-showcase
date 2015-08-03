(function(d3, fc, sc) {
    'use strict';

    //var fakeData = fc.data.random.financial()(1000);
    /*function fakeWebsocket() {
        var data = fakeData.splice(900, 1000);
        var index = 0;
        return function(cb) {
            setInterval(function() {
                if (index >= data.length) {
                    return;
                }
                cb(data[index]);
                index++;
            }, 100);
        }
    }*/
    var currDate = new Date();
    // A year's worth of data, with a period of 12 hours day
    var fakeData = fc.data.random.financial()
            .stepsPerDay(2)
            .startDate(new Date(currDate.getTime() - (1000 * 60 * 60 * 24 * 7 * 25)))(25 * 7 * 2);
    fakeData = fakeData.reverse();

    function fakeHistoric() {
        var data = fakeData;
        var index = 0;
        var start = null;
        var end = null;
        var granularity = null;

        var historic = function(cb) {
            var numberCandles = Math.floor((end.getTime() - start.getTime()) / (granularity * 1000));
            var newData = data.slice(index, index + numberCandles);
            index += numberCandles;
            cb(null, newData);
        };

        historic.start = function(x) {
            if (!arguments.length) { return start; }
            start = x;
            return historic;
        };
        historic.end = function(x) {
            if (!arguments.length) { return end; }
            end = x;
            return historic;
        };

        historic.granularity = function(x) {
            if (!arguments.length) { return granularity; }
            granularity = x;
            return historic;
        };

        return historic;
    }

    /*var fakeLiveData = [];
    function fakeLive() {
        var data = fakeLiveData;
        var live = function(cb) {};
        return live;
    }*/

    describe('sc.data.dataInterface', function() {
        var dataInterface = sc.data.dataInterface()
            .historicFeed(fakeHistoric())
            .period(60 * 60 * 12);
        var histData = [];

        it('should call the callback with numberCandles past data on first call', function() {
            // these affect other tests, should they be outside? or should I pull this out into a beforeEachSpec thing?
            dataInterface.getHistoricData(function(data) {
                histData = data;
            }, 100);

            expect(histData.length).toEqual(100);
        });

        it('should call the callback with numberCandles extra data on subsequent calls', function() {
            dataInterface.getHistoricData(function(data) {
                histData = data;
            }, 50);

            expect(histData.length).toEqual(100 + 50);
        });

        it('should organize data from earliest to latest', function() {
            expect(histData[0].date.getTime()).toBeLessThan(histData[histData.length - 1].date.getTime());
        });

        it('should then give access to all stored data', function() {
            var currData = dataInterface.getCurrentData();
            expect(currData.length).toEqual(100 + 50);
        });

        it('should be able to get data from multiple periods', function() {
            dataInterface.period(60 * 60 * 24)
                .getHistoricData(function(data) {
                    histData = data;
                }, 50);
            expect(histData.length).toEqual(50);
        });

        it('should cache data from past periods', function() {
            dataInterface.period(60 * 60 * 12);
            histData = dataInterface.getCurrentData();
            expect(histData.length).toEqual(100 + 50);
        });

        //var dataInterface.liveFeed(fakeLive());
        //var liveData = [];

        // live data?

    });

})(d3, fc, sc);