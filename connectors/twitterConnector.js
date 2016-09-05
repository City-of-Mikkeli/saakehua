'use strict';

var Connector = require('./connector');
var Twitter = require('twitter');
var conf = require('../config');

class TwitterConnector extends Connector {
  constructor(io) {
    super(io);
    this.client = new Twitter({
      consumer_key: conf.twitter.consumer_key,
      consumer_secret: conf.twitter.consumer_secret,
      access_token_key: conf.twitter.access_token_key,
      access_token_secret: conf.twitter.access_token_secret
    });
  }
  connect() {
    this.client.get('search/tweets', {q: conf.tags.join(' OR ')}, (error, tweets, response) => {
      for(var i = 0; i < tweets.statuses.length;i++){
        var tweet = tweets.statuses[i];
        var data = {
            code: tweet.id,
            text: tweet.text,
            img: tweet.entities.media ? tweet.entities.media[0].media_url_https : null,
            tags: tweet.entities.hashtags.map(function (tag) { return '#' + tag.text; }),
            date: new Date(tweet.created_at),
            icon: 'fa fa-twitter',
            link: 'https://twitter.com/statuses/' + tweet.id_str,
            likes: 0
        };
        this.saveItem(data, err => {
          if (err) {
            console.log(err);
          }
        });
      }
    });
    this.client.stream('statuses/filter', { track: conf.tags.join(',') }, stream => {
      stream.on('data', tweet => {
        if (!tweet.retweeted_status) {
          var data = {
            code: tweet.id,
            text: tweet.text,
            img: tweet.entities.media ? tweet.entities.media[0].media_url_https : null,
            tags: tweet.entities.hashtags.map(function (tag) { return '#' + tag.text; }),
            date: new Date(tweet.created_at),
            icon: 'fa fa-twitter',
            link: 'https://twitter.com/statuses/' + tweet.id_str,
            likes: 0
          };
          this.saveItem(data, err => {
            if (err) {
              console.log(err);
            }
          });
        }
      });

      stream.on('error', error => {
        console.log(error);
      });
    });
  }
}

module.exports = TwitterConnector;