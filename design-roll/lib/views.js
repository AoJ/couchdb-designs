exports.lists = {

	/* ----------------------- GRAPH COLUMNS ---------------------------------- */

    columns: function(head, req) {

        //http://d.n13.cz:9090/zapa-tracking-test/_design/roll/_list/columns/newsletter-visit?group_level=2&keySlice=-1&y=nav%C5%A1t%C4%9Bvy&title=Po%C4%8Dty%20n%C3%A1v%C5%A1t%C4%9Bv%20z%20jednotliv%C3%BDch%20newsletter%C5%AF
        //http://d.n13.cz:9090/zapa-tracking-test/_design/roll/_list/columns/newsletter-visit?startkey=[%22visitor%22,%221-2%22,%22a%22]&endkey[%22visitor%22,%221-2%22,%22a%22]&group_level=4&keySlice=-1&y=nav%C5%A1t%C4%9Bvy&title=Po%C4%8Dty%20n%C3%A1v%C5%A1t%C4%9Bv%20pro%20ur%C4%8Dit%C3%BD%20den%20podle%20m%C4%9Bst

        var handlebars = require('handlebars');
        var data = [];
        var row;

        var options = {
            labelY: req.query.y,
            title: req.query.title,
            keySlice: req.query.keySlice || -1,
            data: []
        };

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
    },

	/* ----------------------- GRAPH PIE ---------------------------------- */

	pie: function(head, req) {

		//http://d.n13.cz:9090/zapa-tracking/_design/roll/_list/pie/component-duration?group_level=1

		var handlebars = require('handlebars');
		var data = [];
		var row;

		var options = {
			title: req.query.title,
			keySlice: req.query.keySlice || -1,
			data: []
		};

		provides('html', function() {

			while (row = getRow()) {
				data.push({
					name: row.key.slice(options.keySlice),
					value: row.value.sum ? row.value.sum / row.value.count : row.value
				});
			}

			options.data = JSON.stringify(data);

			// handlebars.templates contains any templates loaded from the template directory in your
			// kanso.json, if you're not using the build-steps then this will not exist.
			var html = handlebars.templates['graph_pie.tpl'](options);

			// if you haven't loaded any templates, you can compile your own
			//var heading = handlebars.compile('<h1>{{title}}</h1>');
			//var h1 = heading({
			//    title: 'Hello, world!'
			//});
			return html;
		})
	},

	/* ----------------------- GRAPH MULTISERIES ---------------------------------- */

	multiseries: function(head, req) {

		//http://d.n13.cz:9090/zapa-tracking/_design/roll/_list/multiseries/component-duration?group_level=4
		var _ = require('underscore')._;

		var handlebars = require('handlebars');
		var data = {};
		var row;

		var options = {
			title: req.query.title,
			keySlice: req.query.keySlice || -1,
			data: []
		};

		provides('html', function() {

			while (row = getRow()) {
				var date = row.key.slice(-3).join(''); //20130109
				var component = row.key[0]; //component render X
				var value = row.value.sum;

				if(!data[date]) data[date] = {'date': date};
				data[date][component] = value;
			}


			options.data = JSON.stringify(_.values(data));

			// handlebars.templates contains any templates loaded from the template directory in your
			// kanso.json, if you're not using the build-steps then this will not exist.
			var html = handlebars.templates['graph_multiseries.tpl'](options);

			// if you haven't loaded any templates, you can compile your own
			//var heading = handlebars.compile('<h1>{{title}}</h1>');
			//var h1 = heading({
			//    title: 'Hello, world!'
			//});
			return html;
		})
	}

};

exports.views = {

	/* ----------------------- REFERRER VISIT ---------------------------------- */

    "referrer-visit": {
        map: function(doc) {
            if (!doc.type || doc.type.indexOf("/type/access") === -1) return;

			// referrer
            var referrerId = doc.data.request.params['referrerId'];
            if (!referrerId) {
				emit(['noReferrerId']);
				return;
			}

            // time
            var d = doc.time.replace(/[-TZ:.]/g, '-').split('-');
            var date = new Date(d[0], d[1] - 1, d[2], d[3], d[4]);
            date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
            var dateArr = [date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getHours() /*, date.getMinutes()*/ ];
            for (var t = 0; i < dateArr.length; t++) {
                dateArr[t] = (dateArr[t] < 10 ? '0' : '') + dateArr[t];
            }
            //if(!(de[0] == "2013" && de[1] == "01")) return; //leden 2013

			// emitData
			var emitData = 1;

			// presenter:action
            var action = doc.data.request.presenter + ':' + doc.data.request.params['action'];

			// user agent
            var userAgent = doc.data.headers['user-agent'].replace('User-Agent: ', ''); //firefox kiks, hm nebo parsováni?

			// user agent type
            var userAgentType = doc.data.headers.from ? doc.data.headers.from : userAgent.replace(/^([a-z-]+).*$/i, "$1");

			// bot ?
            var isBot = doc.data.headers.from || ["facebookexternalhit", "Jakarta"].indexOf(userAgent) >= 0;


			// emit
            emit([isBot ? 'bot' : 'visitor', referrerId].concat(dateArr), emitData);

        },

        reduce: "_count"
    },


    /* ----------------------- NEWSLETTER VISIT ---------------------------------- */

    "newsletter-visit": {
        map: function(doc) {
            if (!doc.type || doc.type.indexOf("/type/access") === -1) return;

			// newsletter
            var utm_campaign = doc.data.request.params.utm_campaign;
            if (!utm_campaign || utm_campaign.indexOf('newsletter') == -1) return;
            var data = utm_campaign.split(' ');
            var newsletter = {};
            for (var n = 0; n < data.length; n++) {
                var tmp = data[n].split(':');

                newsletter[tmp[0]] = tmp[1];
            }
            if (!newsletter.date || !newsletter.type || !newsletter.nid || !newsletter.city) return;


            // time
            var d = doc.time.replace(/[-TZ:.]/g, '-').split('-');
            var date = new Date(d[0], d[1] - 1, d[2], d[3], d[4]);
            date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
            var dateArr = [date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getHours() /*, date.getMinutes()*/ ];
            for (var t = 0; t < dateArr.length; t++) {
                dateArr[t] = (dateArr[t] < 10 ? '0' : '') + dateArr[t];
            }
            //if(!(de[0] == "2013" && de[1] == "01")) return; //leden 2013

			// emitData
            var emitData = 1;

			// presenter:action
            var action = doc.data.request.presenter + ':' + doc.data.request.params['action'];

			// user agent
            var userAgent = doc.data.headers['user-agent'].replace('User-Agent: ', ''); //firefox kiks, hm nebo parsováni?

			// user agent type
            var userAgentType = doc.data.headers.from ? doc.data.headers.from : userAgent.replace(/^([a-z-]+).*$/i, "$1");

			// bot ?
            var isBot = doc.data.headers.from || ["facebookexternalhit", "Jakarta"].indexOf(userAgent) >= 0;

			// header referer
			var referer = doc.data.headers.referer;


			// emit
            emit([isBot ? 'bot' : 'visitor', newsletter.date, newsletter.type, newsletter.city, newsletter.nid], emitData);
            if(!isBot) emit(['referer', referer, newsletter.date, newsletter.type, newsletter.city, newsletter.nid], emitData);

        },
        reduce: "_count"
    },


    /* ----------------------- DEAL VISIT ---------------------------------- */

    "deal-visit": {
        map: function(doc) {
            if (!doc.type || doc.type.indexOf("/type/access") === -1) return;

            // dealId
            var dealId = doc.data.request.params['deal-id'] || doc.data.request.params['order-did'];
            if (!dealId || dealId === "0") {
                return;
            }

            // time
            var d = doc.time.replace(/[-TZ:.]/g, '-').split('-');
            var date = new Date(d[0], d[1] - 1, d[2], d[3], d[4]);
            date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
            var dateArr = [date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getHours() /*, date.getMinutes() */ ];
            for (var t = 0; t < dateArr.length; t++) {
                dateArr[t] = (dateArr[t] < 10 ? '0' : '') + dateArr[t];
            }
            //if(!(de[0] == "2013" && de[1] == "01")) return; //leden 2013

			// emitData
            var emitData = 1;

			// presenter:action
            var action = doc.data.request.presenter + ':' + doc.data.request.params['action'];

			// user agent
            var userAgent = doc.data.headers['user-agent'].replace('User-Agent: ', ''); //firefox kiks, hm nebo parsováni?

			// user agent type
            var userAgentType = doc.data.headers.from ? doc.data.headers.from : userAgent.replace(/^([a-z-]+).*$/i, "$1");

			// bot ?
            var isBot = doc.data.headers.from || ["facebookexternalhit", "Jakarta"].indexOf(userAgent) >= 0;

			// utm source
            var utmSource = doc.data.request.params['utm_source'] || null;

			// referrer id
            var referrerId = doc.data.request.params['referrerId'] || null;

			// emit
            emit([dealId, isBot ? 'bot' : 'visitor', action].concat(dateArr), emitData);
            if (isBot && utmSource) emit([dealId, 'source', utmSource].concat(dateArr), emitData);
            if (isBot && referrerId) emit([dealId, 'source', referrerId].concat(dateArr), emitData);

        },
        reduce: "_count"
    },


    /* ----------------------- CAT IP ---------------------------------- */

    "cat-ip": {
        map: function(doc) {
            if (!doc.type || doc.type.indexOf("/type/access") === -1) return;

            // time
            var d = doc.time.replace(/[-TZ:.]/g, '-').split('-');
            var date = new Date(d[0], d[1] - 1, d[2], d[3], d[4]);
            date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
            var dateArr = [date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getHours() /*, date.getMinutes()*/ ];
            for (var t = 0; t < dateArr.length; t++) {
                dateArr[t] = (dateArr[t] < 10 ? '0' : '') + dateArr[t];
            }
            //if(!(de[0] == "2013" && de[1] == "01")) return; //leden 2013

			// emitData
            var emitData = 1;

            // ip
            if (doc.data.request.ip) {
                emit([doc.data.request.ip].concat(dateArr), emitData);
            }

            // cat
            var cat = doc.data.cat;
            if (!cat || ["undefined", ""].indexOf(cat) >= 0) cat = '[none]';
            if (cat == '[none]') return;

			// emit
            emit([cat].concat(dateArr), emitData);

        },
        reduce: "_count"
    },


    /* -----------------------TIME DURATION ---------------------------------- */

    "time": {
        map: function(doc) {
            if (!doc.type || doc.type.indexOf("/type/access") === -1) return;

            // time
            var d = doc.time.replace(/[-TZ:.]/g, '-').split('-');
            var date = new Date(d[0], d[1] - 1, d[2], d[3], d[4]);
            date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
            var dateArr = [date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getHours(), date.getMinutes()];
            for (var t = 0; t < dateArr.length; t++) {
                dateArr[t] = (dateArr[t] < 10 ? '0' : '') + dateArr[t];
            }
            //if(!(de[0] == "2013" && de[1] == "01")) return; //leden 2013

			// emit
            emit([doc.message].concat(dateArr), parseInt(doc.duration, 10) * 10);
        },
        reduce: "_stats"
    },


	/* ----------------------- component duration ---------------------------------- */

	"component-duration": {
		map: function(doc) {
			if (!doc.type || doc.type.indexOf("/type/access") === -1) return;

			if (!doc.data || !doc.data.duration) return;

			// time
			var d = doc.time.replace(/[-TZ:.]/g, '-').split('-');
			var date = new Date(d[0], d[1] - 1, d[2], d[3], d[4]);
			date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
			var dateArr = [date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getHours(), date.getMinutes()];
			for (var t = 0; t < dateArr.length; t++) {
				dateArr[t] = (dateArr[t] < 10 ? '0' : '') + dateArr[t];
			}

			// emit durations
			var duration = doc.data.duration;
			var dur, fl;
			for (var j = 0; j < duration.length; j++) {
				dur = duration[j];
				if(!dur.name || !dur.time) return;
				fl = parseInt((dur.time*1000).toFixed(3));
				emit([dur.name].concat(dateArr), fl);
			}
		},
		reduce: "_stats"
	},


	/* ----------------------- agent ---------------------------------- */

	"agent": {
		map: function(doc) {
			if (!doc.type || doc.type.indexOf("/type/access") === -1) return;

			// emitData
			var emitData = 1;

			// time
			var d = doc.time.replace(/[-TZ:.]/g, '-').split('-');
			var date = new Date(d[0], d[1] - 1, d[2], d[3], d[4]);
			date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
			var dateArr = [date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getHours() /*, date.getMinutes()*/ ];
			for (var t = 0; t < dateArr.length; t++) {
				dateArr[t] = (dateArr[t] < 10 ? '0' : '') + dateArr[t];
			}

			// user agent
			var userAgent = doc.data.headers['user-agent'].replace('User-Agent: ', ''); //firefox kiks, hm nebo parsováni?

			// user agent type
			var userAgentType = doc.data.headers.from ? doc.data.headers.from : userAgent.replace(/^([a-z-]+).*$/i, "$1");

			// bot ?
			var isBot = doc.data.headers.from || ["facebookexternalhit", "Jakarta"].indexOf(userAgent) >= 0;


			// emit
			emit([isBot ? 'bot' : 'visitor', userAgentType, userAgent].concat(dateArr), emitData);

		},
		reduce: "_stats"
	}

};