(function(d3, fc, sc) {
    'use strict';

    /*var fakeData = fc.data.random.financial()(1000);
    function fakeWebsocket() {
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
    }

    function fakeHistoric() {
        var data = fc.data.random.financial()(1000);
        var index = 0;



        var historic = function(cb) {
            var newData = data.slice(index, index + numberCandles);
            index += numberCandles;
            cb(null, newData);
        };

        historic.start = function(x) { return historic; };
        historic.end = function(x) { return historic; };
        historic.granularity = function(x) { return historic; };
        return historic;
    }

    describe('sc.data.dataInterface', function() {
        var dataInterface = sc.data.dataInterface()
            .historicFeed(fakeHistoric())
            .period(60 * 60 * 12);

        it('should return data from historic data source equal to numberCandles more past data', function() {
            var histData = [];
            dataInterface.getHistoricData(function(data) { histData = data; console.log(histData); }, 100);
            expect(histData.length).toEqual(100);
        });

    });*/

})(d3, fc, sc);