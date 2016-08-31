var path = require('path');
var express = require('express');
var pug = require('pug');
var conf = require('./config');
var fs = require('fs');
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/saakehua');
var Item = require('./model/item');
var InstaConnector = require('./connectors/instaConnector');
var TwitterConnector = require('./connectors/twitterConnector');

var clientTemplates = fs.readdirSync(__dirname + '/views/client');
var compiledClientTemplates = [];
for (var i = 0; i < clientTemplates.length; i++) {
  var templateName = clientTemplates[i].replace('.pug', '');
  templateName = 'render'+templateName[0].toUpperCase() + templateName.substring(1);
  compiledClientTemplates.push(pug.compileFileClient(
    __dirname + '/views/client/' + clientTemplates[i],
    { name: templateName}
  ));
}
fs.writeFileSync(__dirname + '/public/script/templates.js', compiledClientTemplates.join(''));

var app = express();

var http = require('http').Server(app);
var io = require('socket.io')(http);

var instaConnector = new InstaConnector(io);
var twitterConnector = new TwitterConnector(io);

instaConnector.connect();
twitterConnector.connect();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', function (socket) {
   Item
    .find({})
    .sort({'date': -1})
    .limit(20)
    .exec(function(err, items) {
      for(var i = 0; i < items.length;i++){
        socket.emit('post:received', items[i]);
      }
      socket.offset = 20;
    });
    
    socket.on('load:more', function(){
      Item
        .find({})
        .sort({'date': -1})
        .skip(socket.offset)
        .limit(10)
        .exec(function(err, items) {
          socket.emit('more:loaded', items);
          socket.offset += 10;
        });
    });
});

app.get('/', function(req, res){
  res.render('index');
});

http.listen(conf.port, function(){
  console.log('listening on *:3000');
});