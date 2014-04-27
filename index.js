var express = require('express'),
    mongoClient = require('mongodb').MongoClient,
    app,
    io,
    server;

app = express();
server = require('http').createServer(app);
io = require('socket.io').listen(server);

server.listen(8000);

app.get('/', function (req, res) {
  res.sendfile(__dirname + '/index.html');
});

app.use('/', express.static(__dirname + '/'));

mongoClient.connect('mongodb://127.0.0.1:27017/messages_db', function(err, db) {
  var collection = db.collection('messages_collection');
  io.sockets.on('connection', function (socket) {
    var stream = collection.find({}, {
      tailable: 1,
      awaitdata: true,
      numberOfRetries: -1
    }).sort({$natural: -1}).stream();

    stream.on('data', function (data) {
      socket.emit('messages', data);
    });

    socket.on('add_message', function (data) {
      collection.insert(data, function (err) {
        console.log('Wrote', data);
      });
    });
  });
});