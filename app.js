var path = require('path');
var express = require('express');
var pug = require('pug');
var conf = require('./config');
var ig = require('./scrapers/instaScraper');
var Twitter = require('twitter');

var client = new Twitter({
  consumer_key: conf.twitter.consumer_key,
  consumer_secret: conf.twitter.consumer_secret,
  access_token_key: conf.twitter.access_token_key,
  access_token_secret: conf.twitter.access_token_secret
});

var app = express();

var http = require('http').Server(app);
var io = require('socket.io')(http);

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', function (socket) {
  ig.scrape('mikkeli', function(err, results){
    for(var i = 0; i < results.length;i++){
      socket.emit('post:received', results[i]);
    }
  });
});

client.stream('statuses/filter', {track: '#food'},  function(stream) {
  stream.on('data', function(tweet) {
    var data = {
      _id: tweet.id,
      text: tweet.text,
      img: tweet.entities.media ? tweet.entities.media[0].media_url_https : null,
      tags: tweet.entities.hashtags.map(function(tag){ return '#'+tag.text; }),
      date: new Date(tweet.created_at)
    }
    io.emit('post:received', data);
  });

  stream.on('error', function(error) {
    console.log(error);
  });
});

app.get('/', function(req, res){
  res.render('index');
});

http.listen(conf.port, function(){
  console.log('listening on *:3000');
});