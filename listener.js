var axon = require('axon');
var emitter = axon.socket('pub-emitter');
var _ = require('underscore');
var util = require('util');

axon.codec.define('text', {
    encode: function(msg) {
        return new Buffer(msg);
    },
    decode: function(msg) {
        return msg.toString();
    }
});


var settings = {
    broadcastPort: 10001,
    broadcastHost: '127.0.0.1',
};


var sock = axon.socket('sub-emitter');

if(sock.set) sock.set('retry timeout', 50);
if(sock.set) sock.set('retry max timeout', 7 * 24 * 60 * 60 * 1000);


sock.on('connect', function() {
    util.log('conneted');
});

sock.on('close', function() {
    util.log('close');
});

sock.connect(settings.broadcastPort, settings.broadcastHost, function() {
  if(process.send) process.send('online');
    util.log(util.format("conneted to %s:%s", settings.broadcastHost, settings.broadcastPort));
});


sock.on('zapakatel:dev:*', function(type, data) {
    if (type === 'tracking') return;
});


sock.on('sys:couchdb:insert:tracking', function(doc) {
    console.log(doc.id);
})


sock.on('sys:couchdb:error:tracking', function(data) {
    console.error(data.e);
})



process.on('message', function(message) {
 if (message === 'shutdown') {
   socket.close();
   process.exit(0);
   setTimeout(function(){
    process.exit(1);
   }, 2000);
 }
});