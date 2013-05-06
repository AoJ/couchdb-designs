// Load the TCP Library
var net = require('net');
var axon = require('axon');
var emitter = axon.socket('pub-emitter');
var nano = require('nano');
var _ = require('underscore');
var appUp = require('appUp');

axon.codec.define('text', {
  encode: function(msg) { return new Buffer(msg); },
  decode: function(msg) { return msg.toString(); }
});
var collector = axon.socket('sub');
collector.set('identity', 'collector');
collector.set('retry max timeout', 60 * 1000);



var settings = {
  listenPort: process.env.PORT || process.argv[2] || 3000,
  broadcastPort: 10001,
  broadcastHost: '127.0.0.1',
  couchDsn: 'http://zapa:59QDnxudRxFp@itchy.allin1.cz:9090',
  couchDb: 'new'
};

var couchNed = nano(settings.couchDsn);
var couch = couchNed.use(settings.couchDb);





collector.bind(settings.listenPort, function(){
  console.log("server running at port " + settings.listenPort +"\n");
});

collector.on('message', function(project, group, type, title, desc, content, meta){
  broadcast(project, group, type, title, desc, content, meta);
});




emitter.bind(settings.broadcastPort, settings.broadcastHost);
function broadcast(project, group, type, title, desc, content, meta) {
  console.log(project + ":" + group + ":" + type + " - " + title);
  emitter.emit(project + ":" + group + ":" + type, {title: title, desc: desc, meta: meta, data: content});
}

var sock = axon.socket('sub-emitter');
sock.connect(settings.broadcastPort, settings.broadcastHost);

sock.on('zapakatel:*:tracking', function(group, data){

  var data = {
    "type": ['/type/access'],
    "time": (new Date).toISOString(),
    "duration": data.meta.timetrace,
    "group": group,
    "project": "zapakatel",
    "ip": null,
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

   couch.insert(data, function (e, doc) {
        if(e) emitter.emit("sys:couchdb:error:tracking", {e: e, doc: doc, data: data});
        else emitter.emit("sys:couchdb:insert:tracking", doc);
      });

});

sock.on('zapakatel:dev:*', function(type, data){
  if(type === 'tracking') return;
  //console.log(arguments, type);
});


sock.on('sys:couchdb:insert:tracking', function(doc){
  console.log(doc.id);
})


sock.on('sys:couchdb:error:tracking', function(data){
  console.error(data.e);
})



 
// Keep track of the chat clients
var clients = [];

/*
 
// Start a TCP Server
net.createServer(function (socket) {
 
  // Identify this client
  socket.name = socket.remoteAddress + ":" + socket.remotePort 
 
  // Put this new client in the list
  clients.push(socket);
 
  // Handle incoming messages from clients.
  socket.on('data', function (data) {


    var parser = new axon.Parser;
    parser.onmessage = function(body, multipart){
      if(multipart) broadcast.apply(socket, body);
      else console.error(body.toString());
    };

     parser.write(new Buffer(data));
    //process.stdout.write("\n" + socket.name + "\n-------------------\n" + new Buffer(data) + "\n")
  });
 
  // Remove the client from the list when it leaves
  socket.on('end', function () {
    clients.splice(clients.indexOf(socket), 1);
  });
 
}).listen(10002);*/
