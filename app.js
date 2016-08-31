var path = require('path');
var express = require('express');
var pug = require('pug');
var conf = require('./config');
var ig = require('./scrapers/instaScraper');
var Twitter = require('twitter');
var fs = require('fs');
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/saakehua');
var Item = require('./model/item');
var async = require('async');

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

function saveItem(data, callback){
  Item.count({code: data.code}, function (err, count) {
    if (err) {
      callback(err);
    } else {
      if (count > 0) {
        callback();
      } else {
        var item = new Item(data);
        item.save(function(err, item){
          if(err){
            callback(err);
          }else{
            io.emit('post:received', item);   
            callback();   
          }
        });
      } 
    }
  }); 
}

setInterval(function(){
  async.eachSeries(conf.tags, function(tag, callback){
    ig.scrape(tag, function(err, results){
      async.eachSeries(results, saveItem, function(err){
        if(err){
          callback(err)
        }else{
          callback();
        }
      })
    });
  }, function(err){
    if(err){
      console.log(err);
    }
  });
}, 30000)

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

client.stream('statuses/filter', {track: conf.tags.join(',')},  function(stream) {
  stream.on('data', function(tweet) {
    if(!tweet.retweeted_status) {
      var data = {
        code: tweet.id,
        text: tweet.text,
        img: tweet.entities.media ? tweet.entities.media[0].media_url_https : null,
        tags: tweet.entities.hashtags.map(function(tag){ return '#'+tag.text; }),
        date: new Date(tweet.created_at),
        icon: 'fa fa-twitter',
        link: 'https://twitter.com/statuses/'+tweet.id_str,
        likes: 0//tweet.favorite_count
      };
      saveItem(data, function(err){
        if(err){
          console.log(err);
        }
      });
    }
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