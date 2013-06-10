exports.lists = {
    test: function(head, req) {

        //http://d.n13.cz:9090/feed-watchman/_design/roll/_list/test/counts-by-deal?startkey=[%22berslevu%22,%222866%22]&endkey=[%22berslevu%22,%222866%22,{}]
        var handlebars = require('handlebars');
        var data = [];
        var row;
        var first;
        var last;

        var options = {
            labelY: req.query.y,
            title: req.query.title,
            keySlice: req.query.keySlice || -1,
            data: []
        }

        provides('html', function() {

            while (row = getRow()) {
                if (!first) {
                    first = row;
                    last = row
                }

                data.push({
                    value: row.value.total_price,
                    label: row.value.date.split(' ')[0]
                });
                last = row;
            }

            options.data = JSON.stringify(data);

            // handlebars.templates contains any templates loaded from the template directory in your
            // kanso.json, if you're not using the build-steps then this will not exist.
            var html = handlebars.templates['graph_columns.tpl'](options);

            // if you haven't loaded any templates, you can compile your own
            //var heading = handlebars.compile('<h1>{{title}}</h1>');
            //var h1 = heading({
            //    title: 'Hello, world!'
            //});
            return html;
        })
    },


    "deal-progress": function(head, req) {

        //http://d.n13.cz:9090/feed-watchman/_design/roll/_list/deal-progress/counts-by-deal?startkey=[%22berslevu%22,%222866%22]&endkey=[%22berslevu%22,%222866%22,{}]
        //http://d.n13.cz:9090/feed-watchman/_design/roll/_list/deal-progress/counts-by-deal?startkey=[%22berslevu%22,%223002%22]&endkey=[%22berslevu%22,%223002%22,{}]
        //http://couch.allin1.cz:9090/feed-watchman/_design/roll/_list/deal-progress/counts-by-deal?startkey=[%22berslevu%22,%222866%22]&endkey=[%22berslevu%22,%222866%22,{}]&stale=ok

        var handlebars = require('handlebars');
        var data = [];
        var data1 = [];
        var data2 = [];
        var row;
        var first;
        var last;

        var options = {
            labelY: req.query.y,
            title: req.query.title,
            keySlice: req.query.keySlice || -1,
            data1: [],
            data2: [],
            data: []
        }

        provides('html', function() {

            while (row = getRow()) {
                if (!first) {
                    first = row;
                    last = row
                }

                var date = row.value.date.split(' ');
                var hour = date[1].split(':')[0];

                //pošleme dál pouze data, kdy se něco změnilo
                if(last.value.total_price === row.value.total_price ) continue;

                data1.push({
                    value: row.value.total_price,
                    label: date[0]
                });
                data2.push({
                    value: row.value.customers,
                    label: date[0]
                });
                last = row;
            }

            options.data = JSON.stringify(data);
            options.data1 = JSON.stringify(data1);
            options.data2 = JSON.stringify(data2);

            // handlebars.templates contains any templates loaded from the template directory in your
            // kanso.json, if you're not using the build-steps then this will not exist.
            var html = handlebars.templates['graph_multilines.tpl'](options);

            // if you haven't loaded any templates, you can compile your own
            //var heading = handlebars.compile('<h1>{{title}}</h1>');
            //var h1 = heading({
            //    title: 'Hello, world!'
            //});
            return html;
        })
    },


    //todo
    "display-table": function(head, req) {

        //todo

        //http://d.n13.cz:9090/feed-watchman/_design/roll/_list/deal-progress/counts-by-deal?startkey=[%22berslevu%22,%222866%22]&endkey=[%22berslevu%22,%222866%22,{}]
        //http://d.n13.cz:9090/feed-watchman/_design/roll/_list/deal-progress/counts-by-deal?startkey=[%22berslevu%22,%223002%22]&endkey=[%22berslevu%22,%223002%22,{}]
        //http://couch.allin1.cz:9090/feed-watchman/_design/roll/_list/deal-progress/counts-by-deal?startkey=[%22berslevu%22,%222866%22]&endkey=[%22berslevu%22,%222866%22,{}]&stale=ok

        var handlebars = require('handlebars');
        var data = [];
        var row;

        var options = {
            title: req.query.title,
            data: []
        }

        provides('html', function() {

            while (row = getRow()) {
                
                //header
                if(data.length === 0) {
                    var columns = [];
                    for(var p = 0; p < row.key.length; p++) columns.push(p);
                    columns.push('value'); //vytvoří počet prvků podle počtu key
                    data.push('<tr><th>'+(columns.join('</th><th>'))+'</th></tr>');
                }

                data.push('<tr><td>'+(row.key.join('</td><td>'))+'</td><td>'+row.value+'</td></tr>');

                last = row;
            }

            options.data = data.join("\n");
            var html = handlebars.templates['table_simple.tpl'](options);

            return html;
        })
    },


    //todo
    "deal-table": function(head, req) {

        //todo

        //http://d.n13.cz:9090/feed-watchman/_design/roll/_list/deal-progress/counts-by-deal?startkey=[%22berslevu%22,%222866%22]&endkey=[%22berslevu%22,%222866%22,{}]
        //http://d.n13.cz:9090/feed-watchman/_design/roll/_list/deal-progress/counts-by-deal?startkey=[%22berslevu%22,%223002%22]&endkey=[%22berslevu%22,%223002%22,{}]
        //http://couch.allin1.cz:9090/feed-watchman/_design/roll/_list/deal-progress/counts-by-deal?startkey=[%22berslevu%22,%222866%22]&endkey=[%22berslevu%22,%222866%22,{}]&stale=ok

        var handlebars = require('handlebars');
        var data = [];
        var data1 = [];
        var data2 = [];
        var row;
        var first;
        var last;

        var options = {
            labelY: req.query.y,
            title: req.query.title,
            keySlice: req.query.keySlice || -1,
            all: req.query.all,
            data1: [],
            data2: [],
            data: []
        }

        provides('html', function() {

            data.push('<tr><th>Datum</th><th>Počet nakupujících</th><th>Celkem vybráno</th><th>Relativní počet kupujících</th><th>Relativně vybráno</th></tr>');
            while (row = getRow()) {
                if (!first) {
                    first = row;
                    last = row;
                }

                var date = row.value.date.split(' ');
                var hour = date[1].split(':')[0];

                //pošleme dál pouze data, kdy se něco změnilo
                //if(!options.all) if(last.value.total_price === row.value.total_price ) continue;

                var relativeCustomers = row.value.customers - first.value.customers;
                var relativePrice = row.value.total_price - first.value.total_price;

                data.push('<tr><td>'+([date[0] + ' ' + hour + ':00', row.value.customers, row.value.total_price, relativeCustomers, relativePrice].join('</td><td>'))+'</td></tr>');

                last = row;
            }

            options.data = data.join("\n");

            // handlebars.templates contains any templates loaded from the template directory in your
            // kanso.json, if you're not using the build-steps then this will not exist.
            var html = handlebars.templates['table_simple.tpl'](options);

            // if you haven't loaded any templates, you can compile your own
            //var heading = handlebars.compile('<h1>{{title}}</h1>');
            //var h1 = heading({
            //    title: 'Hello, world!'
            //});
            return html;
        })
    }
}

exports.views = {
    "counts-by-deal": {
        map: function(doc) {
            //if (doc.meta.name != 'berslevu') return;
            var regex = /^([0-9]{2,4})-([0-1][0-9])-([0-3][0-9]) (?:([0-2][0-9]):([0-5][0-9]):([0-5][0-9]))?$/;
            var parts = doc.meta.time.replace(regex, "$1 $2 $3 $4 $5 $6").split(' ');

            function getValue(value) {
                if(!!value.indexOf && value.length == 1) {
                    if(typeof value[0] == 'Object') return value;
                    else return value[0];
                }
                return value;
            }
            var deals = doc.DEAL || doc.SERVER.DEAL || [];


            for (var i = 0; i < deals.length; i++) {
                var deal = deals[i];
                var key = [doc.meta.name, getValue(deal.ID)];
                var docKey = key;

                var data = {
                    customers: parseInt(getValue(deal.CUSTOMERS), 10),
                    total_price: null,
                    final_price: parseFloat(getValue(deal.FINAL_PRICE), 10),
                    discount: parseFloat(getValue(deal.DISCOUNT), 10),
                    id: getValue(deal.ID),
                    date: doc.meta.time
                };
                data.total_price = data.customers * data.final_price;

                emit(key.concat(doc.meta.time), data);
            }


        }
    },

    "sum-for-deal": {
        map: function(doc) {
            //if (doc.meta.name != 'berslevu') return;
            var regex = /^([0-9]{2,4})-([0-1][0-9])-([0-3][0-9]) (?:([0-2][0-9]):([0-5][0-9]):([0-5][0-9]))?$/;
            var parts = doc.meta.time.replace(regex, "$1 $2 $3 $4 $5 $6").split(' ');


            function getValue(value) {
                if(!!value.indexOf && value.length == 1) {
                    if(typeof value[0] == 'Object') return value;
                    else return value[0];
                }
                return value;
            }
            var deals = doc.DEAL || doc.SERVER.DEAL || [];


            ["total", "customers"].forEach(function(type) {
                for (var i = 0; i < deals.length; i++) {
                    var deal = deals[i];
                    var key = [doc.meta.name, type, getValue(deal.ID)];
                    var docKey = key;

                    var data = {
                        customers: parseInt(getValue(deal.CUSTOMERS), 10),
                        total_price: null,
                        final_price: parseFloat(getValue(deal.FINAL_PRICE), 10),
                        discount: parseFloat(getValue(deal.DISCOUNT), 10),
                        id: getValue(deal.ID),
                        date: doc.meta.time
                    };
                    data.total_price = data.customers * data.final_price;
                    var value = null;
                    if(type == "total") value = data.total_price;
                    if(type == "customers") value = data.customers;

                    if(value || value === 0) emit(key.concat(doc.meta.time), value);

                    
                }
            })
        },
        reduce: "_stats"
    },

    "list-deals": {
        map: function (doc) {
            var regex = /^([0-9]{2,4})-([0-1][0-9])-([0-3][0-9]) (?:([0-2][0-9]):([0-5][0-9]):([0-5][0-9]))?$/;
            var parts = doc.meta.time.replace(regex, "$1 $2 $3 $4 $5 $6").split(' ');


            function getValue(value) {
                if(!!value.indexOf && value.length == 1) {
                    if(typeof value[0] == 'Object') return value;
                    else return value[0];
                }
                return value;
            }
            var deals = doc.DEAL || doc.SERVER.DEAL || [];

            //too much records
            return;

            for (var i = 0; i < deals.length; i++) {
                var deal = deals[i];
                var key = [doc.meta.name, getValue(deal.DEAL_START), getValue(deal.ID)];
                var docKey = key;

                var data = {
                    customers: parseInt(getValue(deal.CUSTOMERS), 10),
                    total_price: null,
                    final_price: parseFloat(getValue(deal.FINAL_PRICE), 10),
                    discount: parseFloat(getValue(deal.DISCOUNT), 10),
                    id: getValue(deal.ID),
                    date: doc.meta.time
                };
                data.total_price = data.customers * data.final_price;

                emit(key.concat([getValue(deal.TITLE), getValue(deal.URL)]), 1);
            }
        },
        reduce: "_count"
    }
}