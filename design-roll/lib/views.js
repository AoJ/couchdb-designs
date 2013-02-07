exports.lists = {
    test: function(head, req) {

        //http://d.n13.cz:9090/zapa-tracking-test/_design/roll/_list/test/newsletter-visit?group_level=2&keySlice=-1&y=nav%C5%A1t%C4%9Bvy&title=Po%C4%8Dty%20n%C3%A1v%C5%A1t%C4%9Bv%20z%20jednotliv%C3%BDch%20newsletter%C5%AF
        //http://d.n13.cz:9090/zapa-tracking-test/_design/roll/_list/test/newsletter-visit?startkey=[%22visitor%22,%221-2%22,%22a%22]&endkey[%22visitor%22,%221-2%22,%22a%22]&group_level=4&keySlice=-1&y=nav%C5%A1t%C4%9Bvy&title=Po%C4%8Dty%20n%C3%A1v%C5%A1t%C4%9Bv%20pro%20ur%C4%8Dit%C3%BD%20den%20podle%20m%C4%9Bst

        var handlebars = require('handlebars');
        var data = [];
        var row;

        var options = {
            labelY: req.query.y,
            title: req.query.title,
            keySlice: req.query.keySlice || -1,
            data: []
        }

        provides('html', function() {

            while (row = getRow()) {
                data.push({
                    value: row.value,
                    label: row.key.slice(options.keySlice)
                });
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
    }
}

exports.views = {
    "referer-visit": {
        map: function(doc) {
            if (!doc.type || doc.type.indexOf("/type/access") === -1) return;


            var referer = doc.data.request.params['referrerId'];
            if (!referer) return;

            //time
            var d = doc.time.replace(/[-TZ:.]/g, '-').split('-');
            var date = new Date(d[0], d[1] - 1, d[2], d[3], d[4]);
            date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
            var de = [date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getHours() /*, date.getMinutes()*/ ];
            for (var i = 0; i < de.length; i++) {
                de[i] = (de[i] < 10 ? '0' : '') + de[i];
            }

            //if(!(de[0] == "2013" && de[1] == "01")) return; //leden 2013
            var emitData = {
                _id: doc._id
            };

            var action = doc.data.request.presenter + ':' + doc.data.request.params['action'];
            var userAgent = doc.data.headers['user-agent'].replace('User-Agent: ', ''); //firefox kiks, hm nebo parsováni?
            var userAgentType = doc.data.headers.from ? doc.data.headers.from : userAgent.replace(/^([a-z-]+).*$/i, "$1");
            var isBot = doc.data.headers.from || ["facebookexternalhit", "Jakarta"].indexOf(userAgent) >= 0;

            emit([isBot ? 'bot' : 'visitor', referer].concat(de), emitData);


        },

        reduce: "_count"
    },


    /* ----------------------- NEWSLETTER VISIT ---------------------------------- */

    "newsletter-visit": {
        map: function(doc) {
            if (!doc.type || doc.type.indexOf("/type/access") === -1) return;

            //dealId
            var dealId = doc.data.request.params['deal-id'] || doc.data.request.params['order-did'];
            if (!dealId || dealId === "0") {
                return;
            }


            var newsletter = doc.data.request.params.utm_campaign;
            if (!newsletter || newsletter.indexOf('newsletter') == -1) return;

            var data = newsletter.split(' ');
            var c = {};
            for (var i = 0; i < data.length; i++) {
                var tmp = data[i].split(':');

                c[tmp[0]] = tmp[1];
            }
            if (!c.date || !c.type || !c.nid || !c.city) return;


            //time
            var d = doc.time.replace(/[-TZ:.]/g, '-').split('-');
            var date = new Date(d[0], d[1] - 1, d[2], d[3], d[4]);
            date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
            var de = [date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getHours() /*, date.getMinutes()*/ ];
            for (var i = 0; i < de.length; i++) {
                de[i] = (de[i] < 10 ? '0' : '') + de[i];
            }
            //if(!(de[0] == "2013" && de[1] == "01")) return; //leden 2013
            var emitData = {
                _id: doc._id
            };

            var action = doc.data.request.presenter + ':' + doc.data.request.params['action'];
            var userAgent = doc.data.headers['user-agent'].replace('User-Agent: ', ''); //firefox kiks, hm nebo parsováni?
            var userAgentType = doc.data.headers.from ? doc.data.headers.from : userAgent.replace(/^([a-z-]+).*$/i, "$1");
            var isBot = doc.data.headers.from || ["facebookexternalhit", "Jakarta"].indexOf(userAgent) >= 0;

            emit([isBot ? 'bot' : 'visitor', c.date, c.type, c.city, c.nid], emitData);

        },
        reduce: "_count"
    },


    /* ----------------------- DEAL VISIT ---------------------------------- */


    "deal-visit": {
        map: function(doc) {
            if (!doc.type || doc.type.indexOf("/type/access") === -1) return;

            //dealId
            var dealId = doc.data.request.params['deal-id'] || doc.data.request.params['order-did'];
            if (!dealId || dealId === "0") {
                return;
            }

            //time
            var d = doc.time.replace(/[-TZ:.]/g, '-').split('-');
            var date = new Date(d[0], d[1] - 1, d[2], d[3], d[4]);
            date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
            var de = [date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getHours() /*, date.getMinutes() */ ];
            for (var i = 0; i < de.length; i++) {
                de[i] = (de[i] < 10 ? '0' : '') + de[i];
            }
            //if(!(de[0] == "2013" && de[1] == "01")) return; //leden 2013
            var emitData = {
                _id: doc._id
            };

            var action = doc.data.request.presenter + ':' + doc.data.request.params['action'];
            var userAgent = doc.data.headers['user-agent'].replace('User-Agent: ', ''); //firefox kiks, hm nebo parsováni?
            var userAgentType = doc.data.headers.from ? doc.data.headers.from : userAgent.replace(/^([a-z-]+).*$/i, "$1");
            var isBot = doc.data.headers.from || ["facebookexternalhit", "Jakarta"].indexOf(userAgent) >= 0;

            var utmSource = doc.data.request.params['utm_source'] || null;
            var referrerId = doc.data.request.params['referrerId'] || null;
            emit([dealId, isBot ? 'bot' : 'visitor', action].concat(de), emitData);

            if (isBot && utmSource) emit([dealId, 'source', utmSource].concat(de), emitData);
            if (isBot && referrerId) emit([dealId, 'source', referrerId].concat(de), emitData);

        },
        reduce: "_count"
    },


    /* ----------------------- CAT IP ---------------------------------- */

    "cat-ip": {
        map: function(doc) {
            if (!doc.type || doc.type.indexOf("/type/access") === -1) return;

            //time
            var d = doc.time.replace(/[-TZ:.]/g, '-').split('-');
            var date = new Date(d[0], d[1] - 1, d[2], d[3], d[4]);
            date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
            var de = [date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getHours() /*, date.getMinutes()*/ ];
            for (var i = 0; i < de.length; i++) {
                de[i] = (de[i] < 10 ? '0' : '') + de[i];
            }
            //if(!(de[0] == "2013" && de[1] == "01")) return; //leden 2013
            var emitData = {
                _id: doc._id
            };

            //ip
            if (doc.data.request.ip) {
                emit([doc.data.request.ip].concat(de), emitData);
            }

            //cat
            var cat = doc.data.cat;
            if (!cat || ["undefined", ""].indexOf(cat) >= 0) cat = '[none]';
            if (cat == '[none]') return;
            emit([cat].concat(de), emitData);

        },
        reduce: "_count"
    },


    /* -----------------------TIME DURATION ---------------------------------- */


    "time": {
        map: function(doc) {
            if (!doc.type || doc.type.indexOf("/type/access") === -1) return;

            //time
            var d = doc.time.replace(/[-TZ:.]/g, '-').split('-');
            var date = new Date(d[0], d[1] - 1, d[2], d[3], d[4]);
            date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
            var de = [date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getHours(), date.getMinutes()];
            for (var i = 0; i < de.length; i++) {
                de[i] = (de[i] < 10 ? '0' : '') + de[i];
            }
            //if(!(de[0] == "2013" && de[1] == "01")) return; //leden 2013
            emit([doc.message].concat(de), parseInt(doc.duration, 10) * 10);
        },
        reduce: "_stats"
    }
}