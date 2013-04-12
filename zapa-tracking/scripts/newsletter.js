var express = require('express');
var _ = require('underscore');
var util = require('util');


var cluster = require('./cluster')();

app = express();
app.configure(function() {
    app.use(express.favicon());
    app.use(express.basicAuth('zapa', 'By9mkSc7'));
    app.use(express.bodyParser())
    app.use(app.router);
});


/**
 * group and count records by datetime
 * @return [
        2013-02-19 05:00:00: 1,
        2013-02-19 06:00:00: 10,
        2013-02-19 07:00:00: 13
    ]
 */
function countVisitorsByTime(records) {
    var groupedByTime = {};
    var sorted = _.groupBy(_.sortBy(records, function(record) {
        return record.time;
    }), function(record) {
        var date = record.date;
        return date[0] + "-" + date[1] + "-" + date[2] + " " + date[3] + ":00:00";
    });

    _.each(sorted, function(records, datetime) {
        if (!groupedByTime[datetime]) groupedByTime[datetime] = 0;

        groupedByTime[datetime] += records.length;
    });

    return groupedByTime;
}

/**
 * count all visitors
 * @param {[
        2013-02-19 05:00:00: 1,
        2013-02-19 06:00:00: 10,
        2013-02-19 07:00:00: 13
    ]}
 *
 */
function countVisits(dateTimeRecords) {
    return _.reduce(_.values(dateTimeRecords), function(sum, value){ sum += value; return sum; }, 0);
}


/**
 * zachová pouze nejstarší hodnoty (první proklik)
 * Porovná už uložený záznam s novým
 * jestli nový záznam je starší, prohodí je
 * TODO: prověřit jestli funguje řádně
 *
 */
function flipIfOlder(newValue, storage) {
    var old = _.find(storage, function(value){
        return value.nid === newValue.nid;
    });

    //jestli je nová hodnota starší, vymění jí?
    if(old && newValue.time < old.time) {
        delete storage[storage.indexOf(old)];
        storage.push(newValue);
    }
}


//TODO lists
app.get('/newsletter/:type/:date/visitInTime', function(req, res) {

    //convert 2013-02-19 to 2013-19-2 
    //TODO couch fix
    var dates = req.params.date.replace(/\-0/g, '-').split('-');

    var date = [dates[0], dates[2], dates[1]].join('-');

    var query = req.params + '';
    var key = [req.params.type, date];
    var params = {
        startkey: key,
        endkey: key.concat([{}]),
        reduce: false,
        stale: 'update_after'
    };
    cluster.relax('stats', '_design/stats/_view/newsletter-visit', params, function(errors, responses, requests) {

        if (errors.length) return res.send(errors, 500);

        var stack = [];
        var responseFirst = [];
        var responseAll = [];

        //vybere první prokliky a roztřídí záznamy
        _.each(responses, function(row) {
            var nid = _.last(row.key);
            var value = row.value;
            value.nid = nid;
            value.city = row.key[2];
            value.time = parseInt(value.date.join('')); //for sort and grouping

            //předpokládá seřazené klíče podle času
            if (stack.indexOf(nid) === -1) {
                stack.push(nid);
                responseFirst.push(value);
            } else flipIfOlder(value, responseFirst);

            responseAll.push(value);
        })

        //rozpytvá záznamy pro jednotlivá města a zjistí první a celkové prokliky
        var cities = {};
        _.each(_.groupBy(responseFirst, "city"), function(records, city) {
            cities[city] = {
                firstVisit: countVisitorsByTime(records)
            };
            cities[city].uniqueVisits = countVisits(cities[city].firstVisit);
        });
        _.each(_.groupBy(responseAll, "city"), function(records, city) {
            if (!cities[city]) cities[city] = {};
            cities[city].allVisit = countVisitorsByTime(records);
        });


        //vrátí výsledek
        var firstVisit = countVisitorsByTime(responseFirst);
        var result = {
            meta: requests,
            data: {
                all: {
                    firstVisit: firstVisit,
                    allVisit: countVisitorsByTime(responseAll),
                    uniqueVisitors: countVisits(firstVisit)
                },
                cities: cities
            }
        };

        res.send(result);
    });

});

app.get('/__health', function(req, res, next) {
    //if(req.query.auth != 'xdds') return next();
    res.send({
        pid: process.pid,
        memory: process.memoryUsage(),
        uptime: process.uptime()
    })
})


process.on('uncaughtException', function(err) {
    console.error(err.stack);
});

app.listen(process.argv[2] || 3000, function() {
    util.log('server listen on ' + process.argv[2] || 3000);
});