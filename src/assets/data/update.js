(function(d3, fc) {
    'use strict';

    fc.data.update = function() {

        var generator = fc.data.coinbase();

        var updateInterval = 3000;
        var incr = 3;

        var updateChart = function(cb) {
            // update chart after specified interval
            setInterval(function() {
                update(cb);
            }, updateInterval);

            function update(cb) {
                //var currentStartDate = generator.start();
                var currentEndDate = generator.end();

                //var newStartDate = new Date(currentStartDate.setDate(currentStartDate.getDate() + incr));
                var newEndDate = new Date(currentEndDate.setDate(currentEndDate.getDate() + incr));

                //var newStartDate = new Date(currentStartDate.setHours(currentStartDate.getHours() + incr));
                //var newEndDate = new Date(currentEndDate.setHours(currentEndDate.getHours() + incr));
                //var newEndDate = new Date(currentEndDate.setMinutes(currentEndDate.getMinutes() + incr));

                //generator.start(newStartDate);
                generator.end(newEndDate);

                generator(cb);
            }
        };

        //var time; //whether using mins/hours/day/moth/etc.

        d3.rebind(updateChart, generator, 'start', 'end', 'granularity');
        return updateChart;
    };

})(d3, fc);