// Load the TCP Library
var net = require('net');
var axon = require('axon');
var emitter = axon.socket('pub-emitter');
var nano = require('nano');
var _ = require('underscore');
var util = require('util');

axon.codec.define('text', {
  encode: function(msg) { return new Buffer(msg); },
  decode: function(msg) { return msg.toString(); }
});
var collector = axon.socket('sub-ext');
collector.set('identity', 'collector');
collector.set('retry max timeout', 5 * 60 * 1000);


var settings = {
  listenPort: parseInt(process.env.PORT || process.argv[2] || 3000, 10),
  broadcastPort: 10001,
  broadcastHost: '127.0.0.1',
  couchDsn: 'http://zapa:59QDnxudRxFp@itchy.allin1.cz:9090',
  couchDb: 'new'
};

var couchNed = nano(settings.couchDsn);
var couch = couchNed.use(settings.couchDb);





collector.bind(settings.listenPort, function(){
  if(process.send) process.send('online');
  util.log("server running at port " + settings.listenPort +"\n");
});

collector.on('message', function(sock, project, group, type, title, desc, content, meta){
  meta.bytesRead = sock.bytesRead;
  meta.bytesWritten = sock.bytesWritten;
  broadcast(sock.remoteAddress, project, group, type, title, desc, content, meta);
});




emitter.bind(settings.broadcastPort, settings.broadcastHost);
function broadcast(ip, project, group, type, title, desc, content, meta) {
  var msg = project + ":" + group + ":" + type;
  var data = {title: title, desc: desc, meta: meta, ip: ip, data: content};
  emitter.emit(msg, data);
}

var sock = axon.socket('sub-emitter');
sock.connect(settings.broadcastPort, settings.broadcastHost);

sock.on('zapakatel:*:tracking', function(group, data){

  var time = (new Date);
  var data = {
    "type": ['/type/access'],
    "time": time.toISOString(),
    "timestamp": time.getTime(),
    "duration": data.meta.timetrace,
    "group": group,
    "project": "zapakatel",
    "ip": data.ip,
    "message": data.title,
    "data": data.data
  };

  //blacklist duration
    var whiteListDuration = ["component ", "couchLoad", "ORDER SAVE"];
    if(data.data.duration) {
      data.data.duration = _.filter(_.values(data.data.duration), function(record) {
        return _.any(whiteListDuration, function(whitelist){
          return record.name.indexOf(whitelist) !== -1;
        });
      });
    }

      //blacklist trace
    var whiteListTrace = ["render "];
    if(data.data.trace) {
      data.data.trace = _.filter(_.values(data.data.trace), function(record) {
        return _.any(whiteListTrace, function(whitelist){
          return record.name.indexOf(whitelist) !== -1;
        });
      });
    }

    //blacklist sentHeaders
    var blackListHeaders = ["X-Powered-By", "Expires", "Cache-Control", "Pragma", "X-Frame-Options"];
    if(data.data.sentHeaders) {
      data.data.sentHeaders = _.filter(_.values(data.data.sentHeaders), function(record) {
        return _.all(blackListHeaders, function(blacklist){
          return record.indexOf(blacklist) === -1;
        });
      });
    }

   couch.insert(data, function (e, doc) {
        if(e) emitter.emit("sys:couchdb:error:tracking", {e: e, doc: doc, data: data});
        else emitter.emit("sys:couchdb:insert:tracking", doc);
      });

});

sock.on('zapakatel:dev:*', function(type, data){
  if(type === 'tracking') return;
});


sock.on('sys:couchdb:insert:tracking', function(doc){
  console.log(doc.id);
})


sock.on('sys:couchdb:error:tracking', function(data){
  console.error(data.e);
})



process.on('message', function(message) {
 if (message === 'shutdown') {
   sock.close();
   collector.close();
   process.exit(0);
   setTimeout(function(){
    process.exit(1);
   }, 2000);
 }
});


process.on('uncaughtException', function(err) {
  console.error(process.pid + " " + err.stack);
});
