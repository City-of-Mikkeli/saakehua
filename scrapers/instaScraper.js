var INSTA_URL = 'https://www.instagram.com';

var request = require('request');

exports.scrape = function(tag, callback){
  request(INSTA_URL+'/explore/tags/'+tag, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var jsonData = body.match(/window\._sharedData = ({.*})/);
      try {
        var data = JSON.parse(jsonData[1]);
        var media = data.entry_data.TagPage[0].tag.media.nodes;
        var result = [];
        for(var i = 0; i < media.length;i++){
          result.push({
            _id: media[i].code,
            text: media[i].caption,
            img: media[i].thumbnail_src,
            tags: media[i].caption.match(/#[a-zA-Z0-9äöÖÄ]+/g),
            date: new Date((media[i].date * 1000)),
            icon: 'fa fa-instagram'
          });
        }
        callback(null, result);
      } catch (error) {
        callback(error);
      }
    }else{
      callback('Error getting posts for tag: '+tag);
    }
  });
}