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
			//	title: 'Hello, world!'
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
			//	title: 'Hello, world!'
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
			//	title: 'Hello, world!'
			//});
			return html;
		})
	}

};

exports.views = {

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

			// user agent & bot identification
			var userAgent = doc.data.headers['user-agent'].replace('User-Agent: ', ''); //firefox kiks, hm nebo parsováni?
			var userAgentType = doc.data.headers.from ? doc.data.headers.from : userAgent.replace(/^([a-z-]+).*$/i, "$1");
			var reg = new RegExp("(" + [
					  "GoogleBot"
					, "bingbot"
					, "facebookexternalhit"
					, "Jakarta"
					, "AhrefsBot" // fb9bd5e29069bc930450366e729cd471
					, "ia_archiver" // 780b34392f7545a2110665ae774c334c
					, "Sogou web spider" // fb9bd5e29069bc930450366e7290fc31
					, "Baiduspider" // fb9bd5e29069bc930450366e72b321e1
					, "Seznam screenshot-generator" // fb9bd5e29069bc930450366e72929bb2
					, "Yahoo! Slurp" // fb9bd5e29069bc930450366e729bb4c3
					, "SeznamBot" // 9659bb07d1fa75d92d40ba688260539d
					, "AdsBot-Google" // 780b34392f7545a2110665ae773e2f5b
					, "bitlybot" // 9c87b0733d22837b4b1c0699810741a0
					, "Feedfetcher-Google" // 9c87b0733d22837b4b1c06998160a13f
					, "magpie-crawler" // 8b2bae1a27aaaf3d7c3b451987946eb1
					, "Ezooms" // 9c87b0733d22837b4b1c069981b417c3
					, "ExB Language Crawler" // 8b2bae1a27aaaf3d7c3b451987438852
					, "TinEye-bot" // 780b34392f7545a2110665ae77177d77
					, "YandexBot" // fb9bd5e29069bc930450366e72aefa92
					, "Exabot" // 780b34392f7545a2110665ae77194faf
					, "spbot" // fb9bd5e29069bc930450366e7294d802
				].join("|") + ")", 'i');
			var botMatch = (doc.data.headers.from + userAgent).match(reg);
			var isBot = botMatch || doc.data.headers.from;
			var bot = botMatch ? botMatch.shift() : null;

			// utm
			var utmSource = doc.data.request.params['utm_source'] || null;
			var utmMedium = doc.data.request.params['utm_medium'] || null;
			var utmContent = doc.data.request.params['utm_content'] || null;

			// facebook
			var fbSource = doc.data.request.params['fb_source'] || null;

			// referrer domain at 2nd level, i.e. "xx.yy"
			var referrer = doc.data.headers.referer;
			var matches = (referrer) ? referrer.match(/^https?\:\/\/(([^\/]*\.)|)([^\/?#\.]+\.[^\/?#\.]+)(?:[\/?#]|$)/i) : null;
			var referrerDomain = (referrer && matches)? matches[3] : null;

			// referrer id
			var referrerId = doc.data.request.params['referrerId'] || null;

			// -- emit --

			// emit bot action
			if(isBot) emit([dealId, 'bot', action].concat(dateArr), emitData);

			// emit visitor action
			if(!isBot) emit([dealId, 'visitor', action].concat(dateArr), emitData);

			// emit visitor source
			if (!isBot){
				var source;
				if(utmSource && utmSource != 'affiliate') source = utmSource;
				else if(referrerDomain) source = referrerDomain;
				else if(utmMedium) source = utmMedium;
				else if(referrerId) source = referrerId;
				else if(utmContent) source = utmContent;
				else if(fbSource) source = 'facebook';

				if(source && source != 'zapakatel.cz' && source != 'zabagatel.sk') emit([dealId, 'source', source].concat(dateArr), emitData);
			}

			// emit name of bot
//			if(isBot) emit([dealId, 'botName', bot, action].concat(dateArr), emitData);

			// index pro zobrazeni utmSources+referrer v case
//			if (!isBot && utmSource) emit([utmSource, referrerDomain].concat(dateArr), emitData);

		},
		reduce: "_count"
	}

};