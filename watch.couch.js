var listener = require('./lib/listener');


listener.connect(function(sock) {


    sock.on('zapakatel:dev:*', function(type, data) {
        if (type === 'tracking') return;
    });


    sock.on('sys:couchdb:insert:tracking', function(doc) {
        console.log(doc.id);
    })


    sock.on('sys:couchdb:error:tracking', function(data) {
        console.error(data.e);
    })


});