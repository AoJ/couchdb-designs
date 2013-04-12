var nano = require('nano');
var _ = require('underscore');
var each = require('each');

var auth = 'zapa:59QDnxudRxFp';


var defaultMap = {
    stats: [{
        server: 'http://'+auth+'@itchy.allin1.cz:9090',
        db: 'zapa-tracking-2013-january',
        design: 'stats'
    }, {
        server: 'http://'+auth+'@itchy.allin1.cz:9090',
        db: 'zapa-tracking-2013-february',
        design: 'stats'
    }, {
        server: 'http://'+auth+'@itchy.allin1.cz:9090',
        db: 'zapa-tracking-2013-march',
        design: 'stats'
    }]
};


function Cluster(map) {
        var me = this;
        this.map = map;

        this.nodes = {};

        _.each(map, function(nodes, name) {

            me.nodes[name] = _.map(nodes, function(node) {
                var connection = nano(node.server);
                return {
                    server: connection,
                    db: connection.use(node.db),
                    params: node
                };
            });
        })
    };


Cluster.prototype.view = function(name, view, params, cb) {
    var results = [];
    var errors = [];
    var requests = [];

    if(!this.nodes[name]) return cb('no mapping for "' + name + '"');

    each(this.nodes[name])

    .on('item', function(node, next) {

        var start = new Date;

        node.db.view(node.params.design, view, params, function(err, body, req) {
            if(!req) req = {};
            req.time = new Date - start;
            if(req.uri) req.uri = req.uri.replace(auth+'@', '');
            requests.push(req);
            if(body && body.rows) results = results.concat(body.rows);

            if (err) errors.push(err);

            next();

        })
    })

    .on('error', function(err, errors) {
        cb(err);
    })

    .on('end', function() {
        cb(errors, results, requests);
    })

}




Cluster.prototype.relax = function(name, path, params, cb) {
    var results = [];
    var errors = [];
    var requests = [];

    if(!this.nodes[name]) return cb('no mapping for "' + name + '"');

    each(this.nodes[name])

    .on('item', function(node, next) {

        var start = new Date;

        node.server.relax({db: node.params.db, path: path, params: params}, function(err, body, req) {
            if(!req) req = {};
            req.time = new Date - start;
            if(req.uri) req.uri = req.uri.replace(auth+'@', '');
            requests.push(req);
            if(body && body.rows) results = results.concat(body.rows);
            else results.push(body);

            if (err) errors.push(err);

            next();

        })
    })

    .on('error', function(err, errors) {
        cb(err);
    })

    .on('end', function() {
        cb(errors, results, requests);
    })

}


module.exports = function(map) {
    return new Cluster(map || defaultMap);
}