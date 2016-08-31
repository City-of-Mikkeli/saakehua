'use strict';

var INSTA_URL = 'https://www.instagram.com';

var Connector = require('./connector');
var async = require('async');
var conf = require('../config');
var request = require('request');

class InstaConnector extends Connector {
  constructor(io) {
    super(io);
  }
  connect() {
    setInterval( () => {
      async.eachSeries(conf.tags, (tag, callback) => {
        this.scrape(tag, (err, results) => {
          async.eachSeries(results, (result, cb) => {
            this.saveItem(result, cb);
          }, function (err) {
            if (err) {
              callback(err)
            } else {
              callback();
            }
          })
        });
      }, function (err) {
        if (err) {
          console.log(err);
        }
      });
    }, 5000)
  }
  scrape(tag, callback) {
    request(INSTA_URL + '/explore/tags/' + tag, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        var jsonData = body.match(/window\._sharedData = ({.*})/);
        try {
          var data = JSON.parse(jsonData[1]);
          var media = data.entry_data.TagPage[0].tag.media.nodes;
          var result = [];
          for (var i = 0; i < media.length; i++) {
            result.push({
              code: media[i].code,
              text: media[i].caption,
              img: media[i].thumbnail_src,
              tags: media[i].caption.match(/#[a-zA-Z0-9äöÖÄ]+/g),
              date: new Date((media[i].date * 1000)),
              icon: 'fa fa-instagram',
              link: INSTA_URL + '/p/' + media[i].code,
              likes: 0
            });
          }
          callback(null, result);
        } catch (error) {
          callback(error);
        }
      } else {
        callback('Error getting posts for tag: ' + tag);
      }
    });
  }
}

module.exports = InstaConnector;
