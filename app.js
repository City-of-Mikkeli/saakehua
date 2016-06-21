var path = require('path');
var express = require('express');
var pug = require('pug');

var app = express();

var http = require('http').Server(app);
var io = require('socket.io')(http);

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(req, res){
  res.render('index');
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});