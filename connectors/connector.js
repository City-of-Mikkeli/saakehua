'use strict';

var Item = require('../model/item');

class Connector {
  constructor(io) {
    this.io = io;
  }
  saveItem(data, callback) {
    Item.count({ code: data.code }, (err, count) => {
      if (err) {
        callback(err);
      } else {
        if (count > 0) {
          callback();
        } else {
          var item = new Item(data);
          item.save((err, item) => {
            if (err) {
              callback(err);
            } else {
              this.io.emit('post:received', item);
              callback();
            }
          });
        }
      }
    });
  }
}

module.exports = Connector;