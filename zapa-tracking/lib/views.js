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
            //  title: 'Hello, world!'
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
            //  title: 'Hello, world!'
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

                if (!data[date]) data[date] = {
                    'date': date
                };
                data[date][component] = value;
            }


            options.data = JSON.stringify(_.values(data));

            // handlebars.templates contains any templates loaded from the template directory in your
            // kanso.json, if you're not using the build-steps then this will not exist.
            var html = handlebars.templates['graph_multiseries.tpl'](options);

            // if you haven't loaded any templates, you can compile your own
            //var heading = handlebars.compile('<h1>{{title}}</h1>');
            //var h1 = heading({
            //  title: 'Hello, world!'
            //});
            return html;
        })
    },

    newsletter: function(head, req) {
        var count = 0;
        while (row = getRow()) {
            count++;
        }
        return '' + count;
    },

};

exports.views = {

    /* ----------------------- REFERRER VISIT ---------------------------------- */

    "referrer-visit": {
        map: function(doc) {
            if (!doc.type || doc.type.indexOf("/type/access") === -1) return;

            //uplatnito blacklist
            if(doc.ip === '81.91.92.26') return;


            var referer = doc.data.request.params['referrerId'];
            if (!referer) return;

            // time
            var d = doc.time.replace(/[-TZ:.]/g, '-').split('-');
            var date = new Date(d[0], d[1] - 1, d[2], d[3], d[4]);
            date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
            var de = [date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getHours() /*, date.getMinutes() */ ];
            for (var t = 0; t < de.length; t++) {
                de[t] = (de[t] < 10 ? '0' : '') + de[t];
            }

            // emitData
            var emitData = null;

            // presenter:action
            var action = doc.data.request.presenter + ':' + doc.data.request.params['action'];
            var userAgent = doc.data.headers['user-agent'].replace('User-Agent: ', ''); //firefox kiks, hm nebo parsováni?
            var userAgentType = doc.data.headers.from ? doc.data.headers.from : userAgent.replace(/^([a-z-]+).*$/i, "$1");
            var referrerId = doc.data.request.params['referrerId'] || null;
            var isBot = false;


            var headers = ["GoogleBot", "bingbot", "facebookexternalhit", "Jakarta", "AhrefsBot" // fb9bd5e29069bc930450366e729cd471
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
            , "MJ12bot" // 52f56722ed8098110aaf36fb02b61dba
            ];


            var botMatch = false;
            for (var j = 0; j < headers.length && botMatch === false; j++) {
                if (userAgent.indexOf(headers[j]) >= 0) botMatch = headers[j];
            }
            isBot = doc.data.headers.from || botMatch;

            //ignore bots
            if(isBot) return;

            emit([isBot ? 'bot' : 'visitor', referer].concat(de), emitData);


        },

        reduce: "_count"
    },




    /* ----------------------- EMAILLING ---------------------------------- */

    "emailling": {
        map: function(doc) {
            if (!doc.type || doc.type.indexOf("/type/access") === -1) return;

            //uplatnito blacklist
            if(doc.ip === '81.91.92.26') return;


            //open track
            var isOpen = (doc.message == 'Newsletter:view [GET]');
            var isDirectEmail = doc.data.request.params['utm_medium'] == 'remarketing_email';
            var campaign = doc.data.request.params['utm_campaign'];
            var content = doc.data.request.params['utm_content'];

            //http://www.zapakatel.cz/s/10363/?
            //utm_source=zapakatel
            //&utm_medium=remarketing_email
            //&utm_campaign=serrano_gornitzki
            //&utm_content=sunka_serrano+nid:848459+email:25eb098ffbe0c0f6cdcc536caffaacba

            if(!isDirectEmail) return;

            //content split
            var data = content.split(' ');
            var params = {};
            for (var n = 0; n < data.length; n++) {
                var tmp = data[n].split(':');

                params[tmp[0]] = tmp[1];
            }

            if (!params.nid) return;


            // time
            var d = doc.time.replace(/[-TZ:.]/g, '-').split('-');
            var date = new Date(d[0], d[1] - 1, d[2], d[3], d[4]);
            date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
            var de = [date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getHours() /*, date.getMinutes() */ ];
            for (var t = 0; t < de.length; t++) {
                de[t] = (de[t] < 10 ? '0' : '') + de[t];
            }

            // presenter:action
            var action = doc.data.request.presenter + ':' + doc.data.request.params['action'];
            var userAgent = doc.data.headers['user-agent'].replace('User-Agent: ', ''); //firefox kiks, hm nebo parsováni?
            var userAgentType = doc.data.headers.from ? doc.data.headers.from : userAgent.replace(/^([a-z-]+).*$/i, "$1");
            var referrerId = doc.data.request.params['referrerId'] || null;
            var isBot = false;


            var headers = ["GoogleBot", "bingbot", "facebookexternalhit", "Jakarta", "AhrefsBot" // fb9bd5e29069bc930450366e729cd471
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
            , "MJ12bot" // 52f56722ed8098110aaf36fb02b61dba
            ];


            var botMatch = false;
            for (var j = 0; j < headers.length && botMatch === false; j++) {
                if (userAgent.indexOf(headers[j]) >= 0) botMatch = headers[j];
            }
            isBot = doc.data.headers.from || botMatch;

            // referrer domain at 2nd level, i.e. "xx.yy"
            var referrer = doc.data.headers.referer;
            var matches = referrer ? referrer.match(/^https?\:\/\/(([^\/]*\.)|)([^\/?#\.]+\.[^\/?#\.]+)(?:[\/?#]|$)/i) : null;
            var referrerDomain = (referrer && matches) ? matches[3] : null;

            var type = 'visitor';
            if (isBot) type = 'bot';
            else if (isOpen) type = 'open';


            //ignore bots
            if(isBot) return;

            // emitData
            var emitData = {
                userAgent: userAgent,
                referrerDomain: referrerDomain,
                date: de
            };

            // emit
            emit([type, campaign, params.nid, parseInt(de.join(''))], emitData);
            if (!isBot && referrerDomain) emit(['referer', type, referrerDomain, campaign, newsletter.nid], emitData);

        },
        reduce: "_count"
    },


    /* ----------------------- NEWSLETTER VISIT ---------------------------------- */

    "newsletter-visit": {
        map: function(doc) {
            if (!doc.type || doc.type.indexOf("/type/access") === -1) return;

            //uplatnito blacklist
            if(doc.ip === '81.91.92.26') return;


            //open track
            var isOpen = doc.message == 'Newsletter:view [GET]';

            //dealId
            var dealId = doc.data.request.params['deal-id'] || doc.data.request.params['order-did'];
            if (!isOpen && (!dealId || dealId === "0")) {
                return;
            }


            try {
                var isNewsletter = doc.data.request.params.utm_campaign;
            } catch (e) {
                return;
            }

            if (!isNewsletter || isNewsletter.indexOf('newsletter') == -1) return;

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
            var de = [date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getHours() /*, date.getMinutes() */ ];
            for (var t = 0; t < de.length; t++) {
                de[t] = (de[t] < 10 ? '0' : '') + de[t];
            }

            // presenter:action
            var action = doc.data.request.presenter + ':' + doc.data.request.params['action'];
            var userAgent = doc.data.headers['user-agent'].replace('User-Agent: ', ''); //firefox kiks, hm nebo parsováni?
            var userAgentType = doc.data.headers.from ? doc.data.headers.from : userAgent.replace(/^([a-z-]+).*$/i, "$1");
            var referrerId = doc.data.request.params['referrerId'] || null;
            var isBot = false;


            var headers = ["GoogleBot", "bingbot", "facebookexternalhit", "Jakarta", "AhrefsBot" // fb9bd5e29069bc930450366e729cd471
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
            , "MJ12bot" // 52f56722ed8098110aaf36fb02b61dba
            ];


            var botMatch = false;
            for (var j = 0; j < headers.length && botMatch === false; j++) {
                if (userAgent.indexOf(headers[j]) >= 0) botMatch = headers[j];
            }
            isBot = doc.data.headers.from || botMatch;

            // referrer domain at 2nd level, i.e. "xx.yy"
            var referrer = doc.data.headers.referer;
            var matches = referrer ? referrer.match(/^https?\:\/\/(([^\/]*\.)|)([^\/?#\.]+\.[^\/?#\.]+)(?:[\/?#]|$)/i) : null;
            var referrerDomain = (referrer && matches) ? matches[3] : null;

            var type = 'visitor';
            if (isBot) type = 'bot';
            else if (isOpen) type = 'open';


            //ignore bots
            if(isBot) return;

            // emitData
            var emitData = {
                userAgent: userAgent,
                referrerDomain: referrerDomain,
                date: de
            };

            // emit
            emit([type, de[0] + '-' + newsletter.date, newsletter.city, newsletter.nid, parseInt(de.join(''))], emitData);
            if (!isBot && referrerDomain) emit(['referer', type, referrerDomain, de[0] + '-' + newsletter.date, newsletter.city, newsletter.nid], emitData);

        },
        reduce: "_count"
    },


    /* ----------------------- DEAL VISIT ---------------------------------- */

    "deal-visit": {
        map: function(doc) {
            if (!doc.type || doc.type.indexOf("/type/access") === -1) return;

            //uplatnito blacklist
            if(doc.ip === '81.91.92.26') return;

            // dealId
            var dealId = doc.data.request.params['deal-id'] || doc.data.request.params['order-did'];
            if (!dealId || dealId === "0") {
                return;
            }

            // time
            var d = doc.time.replace(/[-TZ:.]/g, '-').split('-');
            var date = new Date(d[0], d[1] - 1, d[2], d[3], d[4]);
            date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
            var de = [date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getHours() /*, date.getMinutes() */ ];
            for (var t = 0; t < de.length; t++) {
                de[t] = (de[t] < 10 ? '0' : '') + de[t];
            }

            // emitData
            var emitData = null;

            // presenter:action
            var action = doc.data.request.presenter + ':' + doc.data.request.params['action'];
            var userAgent = doc.data.headers['user-agent'].replace('User-Agent: ', ''); //firefox kiks, hm nebo parsováni?
            var userAgentType = doc.data.headers.from ? doc.data.headers.from : userAgent.replace(/^([a-z-]+).*$/i, "$1");
            var referrerId = doc.data.request.params['referrerId'] || null;
            var isBot = false;


            var headers = ["GoogleBot", "bingbot", "facebookexternalhit", "Jakarta", "AhrefsBot" // fb9bd5e29069bc930450366e729cd471
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
            , "MJ12bot" // 52f56722ed8098110aaf36fb02b61dba
            ];


            var botMatch = false;
            for (var j = 0; j < headers.length && botMatch === false; j++) {
                if (userAgent.indexOf(headers[j]) >= 0) botMatch = headers[j];
            }
            isBot = doc.data.headers.from || botMatch;

            // utm
            var utmSource = doc.data.request.params['utm_source'] || null;
            var utmMedium = doc.data.request.params['utm_medium'] || null;
            var utmContent = doc.data.request.params['utm_content'] || null;

            // facebook
            var fbSource = doc.data.request.params['fb_source'] || null;

            // referrer domain at 2nd level, i.e. "xx.yy"
            var referrer = doc.data.headers.referer;
            var matches = referrer ? referrer.match(/^https?\:\/\/(([^\/]*\.)|)([^\/?#\.]+\.[^\/?#\.]+)(?:[\/?#]|$)/i) : null; //WTF, TODO rewrite and commment it
            var referrerDomain = (referrer && matches) ? matches[3] : null;


            // referrer id
            var referrerId = doc.data.request.params['referrerId'] || null;

            //ignore bots
            if(isBot) return;

            // -- emit --
            // emit bot action
            if (isBot) emit([dealId, 'bot', action].concat(de), emitData);

            // emit visitor action
            if (!isBot) emit([dealId, 'visitor', action].concat(de), emitData);

            // emit visitor source
            if (!isBot) {
                var source;
                var localPage;
                if (utmSource && utmSource != 'affiliate') source = utmSource;
                else if (referrerDomain) source = referrerDomain;
                else if (utmMedium) source = utmMedium;
                else if (referrerId) source = referrerId;
                else if (utmContent) source = utmContent;
                else if (fbSource) source = 'facebook';

                if (source) {
                    var type = ['zapakatel.cz', 'zabagatel.sk'].indexOf(source) >= 0 ? 'inter' : 'source';

                    if(type == 'inter') {
                        var typeId = null;


                        var refererDeal = referrer.match(/.*detail\/id\-([0-9]+)\-\-.*/i);
                        var refererCategory = referrer.match(/.*kategorie\/([a-z-]+).*/i);
                        var refererTag = referrer.match(/.*tag\/([a-z-]+).*/i);

                        if(refererDeal) {
                            localPage = 'detail';
                            typeId = refererDeal[1];
                        }
                        if(refererCategory) {
                            localPage = 'category';
                            typeId = refererCategory[1];
                        }
                        if(refererTag) {
                            localPage = 'tag';
                            typeId = refererTag[1];
                        }

                        if(localPage) {
                            emitData = { from: localPage, id: typeId };
                        }
                    }

                    if(localPage) emit([dealId, type, action, source, localPage].concat(de), emitData);
                    else emit([dealId, type, action, source].concat(de), emitData);
                }
            }
        },
        reduce: "_count"
    },


    /* ----------------------- ALL VISIT of zapakatel ---------------------------------- */
    "all-visit": {
        map: function(doc) {
            if (!doc.type || doc.type.indexOf("/type/access") === -1) return;

            //uplatnito blacklist
            if(doc.ip === '81.91.92.26') return;

            // time
            var d = doc.time.replace(/[-TZ:.]/g, '-').split('-');
            var date = new Date(d[0], d[1] - 1, d[2], d[3], d[4]);
            date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
            var de = [date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getHours() /*, date.getMinutes() */ ];
            for (var t = 0; t < de.length; t++) {
                de[t] = (de[t] < 10 ? '0' : '') + de[t];
            }

            // emitData
            var emitData = null;

            // presenter:action
            var action = doc.data.request.presenter + ':' + doc.data.request.params['action'];
            var userAgent = doc.data.headers['user-agent'].replace('User-Agent: ', ''); //firefox kiks, hm nebo parsováni?
            var userAgentType = doc.data.headers.from ? doc.data.headers.from : userAgent.replace(/^([a-z-]+).*$/i, "$1");
            var referrerId = doc.data.request.params['referrerId'] || null;
            var isBot = false;


            var headers = ["GoogleBot", "bingbot", "facebookexternalhit", "Jakarta", "AhrefsBot" // fb9bd5e29069bc930450366e729cd471
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
            , "MJ12bot" // 52f56722ed8098110aaf36fb02b61dba
            ];


            var botMatch = false;
            for (var j = 0; j < headers.length && botMatch === false; j++) {
                if (userAgent.indexOf(headers[j]) >= 0) botMatch = headers[j];
            }
            isBot = doc.data.headers.from || botMatch;

            // utm
            var utmSource = doc.data.request.params['utm_source'] || null;
            var utmMedium = doc.data.request.params['utm_medium'] || null;
            var utmContent = doc.data.request.params['utm_content'] || null;

            // facebook
            var fbSource = doc.data.request.params['fb_source'] || null;

            // referrer domain at 2nd level, i.e. "xx.yy"
            var referrer = doc.data.headers.referer;
            var matches = referrer ? referrer.match(/^https?\:\/\/(([^\/]*\.)|)([^\/?#\.]+\.[^\/?#\.]+)(?:[\/?#]|$)/i) : null; //WTF, TODO rewrite and commment it
            var referrerDomain = (referrer && matches) ? matches[3] : null;


            // referrer id
            var referrerId = doc.data.request.params['referrerId'] || null;

            //ignore bots
            if(isBot) return;

            // ignore other than detail, default and category
            if (['Site:detail', 'Site:default', 'Site:category'].indexOf(action) === -1) return;

            // -- emit --
            // emit bot action
            if (isBot) emit(['bot', action].concat(de), emitData);

            // emit visitor action
            if (!isBot) emit(['visitor', action].concat(de), emitData);

            // emit visitor source
            if (!isBot) {
                var source;
                var localPage;
                if (utmSource && utmSource != 'affiliate') source = utmSource;
                else if (referrerDomain) source = referrerDomain;
                else if (utmMedium) source = utmMedium;
                else if (referrerId) source = referrerId;
                else if (utmContent) source = utmContent;
                else if (fbSource) source = 'facebook';

                if (source) {
                    var type = ['zapakatel.cz', 'zabagatel.sk'].indexOf(source) >= 0 ? 'inter' : 'source';

                    if(type == 'inter') {
                        var typeId = null;


                        var refererDeal = referrer.match(/.*detail\/id\-([0-9]+)\-\-.*/i);
                        var refererCategory = referrer.match(/.*kategorie\/([a-z-]+).*/i);
                        var refererTag = referrer.match(/.*tag\/([a-z-]+).*/i);

                        if(refererDeal) {
                            localPage = 'detail';
                            typeId = refererDeal[1];
                        }
                        if(refererCategory) {
                            localPage = 'category';
                            typeId = refererCategory[1];
                        }
                        if(refererTag) {
                            localPage = 'tag';
                            typeId = refererTag[1];
                        }

                        if(localPage) {
                            emitData = { from: localPage, id: typeId };
                        }
                    }

                    if(localPage) emit([type, action, source, localPage].concat(de), emitData);
                    else emit([type, action, source].concat(de), emitData);
                }
            }
        },
        reduce: "_count"
    },


    /* ----------------------- CAT IP ---------------------------------- */

    "cat-ip": {
        map: function(doc) {
            if (!doc.type || doc.type.indexOf("/type/access") === -1) return;

            //uplatnito blacklist
            if(doc.ip === '81.91.92.26') return;

            // time
            var d = doc.time.replace(/[-TZ:.]/g, '-').split('-');
            var date = new Date(d[0], d[1] - 1, d[2], d[3], d[4]);
            date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
            var de = [date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getHours() /*, date.getMinutes() */ ];
            for (var t = 0; t < de.length; t++) {
                de[t] = (de[t] < 10 ? '0' : '') + de[t];
            }

            // emitData
            var emitData = null;

            // presenter:action
            var action = doc.data.request.presenter + ':' + doc.data.request.params['action'];
            var userAgent = doc.data.headers['user-agent'].replace('User-Agent: ', ''); //firefox kiks, hm nebo parsováni?
            var userAgentType = doc.data.headers.from ? doc.data.headers.from : userAgent.replace(/^([a-z-]+).*$/i, "$1");
            var referrerId = doc.data.request.params['referrerId'] || null;
            var isBot = false;


            var headers = ["GoogleBot", "bingbot", "facebookexternalhit", "Jakarta", "AhrefsBot" // fb9bd5e29069bc930450366e729cd471
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
            , "MJ12bot" // 52f56722ed8098110aaf36fb02b61dba
            ];


            var botMatch = false;
            for (var j = 0; j < headers.length && botMatch === false; j++) {
                if (userAgent.indexOf(headers[j]) >= 0) botMatch = headers[j];
            }
            isBot = doc.data.headers.from || botMatch;

            // utm
            var utmSource = doc.data.request.params['utm_source'] || null;
            var utmMedium = doc.data.request.params['utm_medium'] || null;
            var utmContent = doc.data.request.params['utm_content'] || null;

            // facebook
            var fbSource = doc.data.request.params['fb_source'] || null;

            // referrer domain at 2nd level, i.e. "xx.yy"
            var referrer = doc.data.headers.referer;
            var matches = referrer ? referrer.match(/^https?\:\/\/(([^\/]*\.)|)([^\/?#\.]+\.[^\/?#\.]+)(?:[\/?#]|$)/i) : null;
            var referrerDomain = (referrer && matches) ? matches[3] : null;

            // referrer id
            var referrerId = doc.data.request.params['referrerId'] || null;


            // emit visitor source
            var source;
            if (utmSource && utmSource != 'affiliate') source = utmSource;
            else if (referrerDomain) source = referrerDomain;
            else if (utmMedium) source = utmMedium;
            else if (referrerId) source = referrerId;
            else if (utmContent) source = utmContent;
            else if (fbSource) source = 'facebook';

            var type = ['zapakatel.cz', 'zabagatel.sk'].indexOf(source) >= 0 ? 'inter' : 'source';
            if (type === 'inter') source = null;

            //parse query
            var search;
            if (referrer) {
                var queries = referrer.split('?')[1];
                if (queries) {
                    var pairs = queries.split('&');
                    for (var k = 0; k < pairs.length; k++) {
                        var values = pairs[k].split('=');
                        if (values[0] === 'q') search = decodeURIComponent(values[1]).replace(/\ /gi, "+");
                    }
                }

            }


            var place = doc.message;
            var placeArray = [];
            var dealId = doc.data.request.params['deal-id'] || doc.data.request.params['order-did'];
            if (!dealId && place.indexOf('Deal:') > -1) {
                dealId = doc.data.request.params['id'];
            }
            if (dealId) place += ', ' + dealId;
            if (doc.data.request.params['href']) place += ', target ' + doc.data.request.params['href']

            if (source) place += ', from ' + source;
            if (search) place += ' (' + search + ')';
            emitData = isBot ? null : [date.getTime() / 1000, place];

            // cat
            var cat = doc.data.cat;
            if (!cat || ["undefined", ""].indexOf(cat) >= 0) cat = '[none]';

            // ip
            if (doc.data.request.ip) {
                emit([doc.data.request.ip, isBot ? 'b' : 'v'].concat(isBot ? null : cat), emitData);
            }

            // emit
            if (!isBot && cat) emit([cat, isBot ? 'b' : 'v'].concat(doc.data.request.ip), emitData);


        },
        reduce: "_count"
    },


    /* -----------------------TIME DURATION ---------------------------------- */

    "time": {
        map: function(doc) {
            if (!doc.type || doc.type.indexOf("/type/access") === -1) return;

            //uplatnito blacklist
            if(doc.ip === '81.91.92.26') return;

            // time
            var d = doc.time.replace(/[-TZ:.]/g, '-').split('-');
            var date = new Date(d[0], d[1] - 1, d[2], d[3], d[4]);
            date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
            var de = [date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getHours(), date.getMinutes()];
            for (var t = 0; t < de.length; t++) {
                de[t] = (de[t] < 10 ? '0' : '') + de[t];
            }

            var action = doc.data.request.presenter + ':' + doc.data.request.params['action'];

            // emit
            emit([action].concat(de), parseInt(doc.duration, 10));
        },
        reduce: "_stats"
    },


    /* ----------------------- component duration ---------------------------------- */

/*"component-duration": {
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
                if (!dur.name || !dur.time) return;
                fl = parseInt((dur.time * 1000).toFixed(3));
                emit([dur.name].concat(dateArr), fl);
            }
        },
        reduce: "_stats"
    },*/


    /* ----------------------- agent ---------------------------------- */

/*"agent": {
        map: function(doc) {
            if (!doc.type || doc.type.indexOf("/type/access") === -1) return;

            // emitData
            var emitData = 1;

            // time
            var d = doc.time.replace(/[-TZ:.]/g, '-').split('-');
            var date = new Date(d[0], d[1] - 1, d[2], d[3], d[4]);
            date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
            var dateArr = [date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getHours(), pdate.getMinutes() ];
            for (var t = 0; t < dateArr.length; t++) {
                dateArr[t] = (dateArr[t] < 10 ? '0' : '') + dateArr[t];
            }

            // user agent & bot identification
            var userAgent = doc.data.headers['user-agent'].replace('User-Agent: ', ''); //firefox kiks, hm nebo parsováni?
            var userAgentType = doc.data.headers.from ? doc.data.headers.from : userAgent.replace(/^([a-z-]+).*$/i, "$1");
            var reg = new RegExp("(" + ["GoogleBot", "bingbot", "facebookexternalhit", "Jakarta", "AhrefsBot" // fb9bd5e29069bc930450366e729cd471
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
            , "MJ12bot" // 52f56722ed8098110aaf36fb02b61dba
            ].join("|") + ")", 'i');
            var botMatch = (doc.data.headers.from + userAgent).match(reg);
            var isBot = botMatch || doc.data.headers.from;
            var bot = botMatch ? botMatch.shift() : null;


            // emit
            emit([isBot ? 'bot' : 'visitor', userAgentType, userAgent].concat(dateArr), emitData);

        },
        reduce: "_stats"
    }*/

};
