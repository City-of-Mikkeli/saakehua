'use strict';

var Item = require('../model/item');

module.exports = function (io) {
  io.on('connection', function (socket) {
    Item
      .find({})
      .sort({ 'date': -1 })
      .limit(20)
      .exec(function (err, items) {
        for (var i = 0; i < items.length; i++) {
          socket.emit('post:received', items[i]);
        }
        socket.offset = 20;
      });

    socket.on('load:more', function (data) {
      var query = {};
      if(data.filter != null) {
        query.tags = data.filter;
      }
      Item
        .find(query)
        .sort({ 'date': -1 })
        .skip(socket.offset)
        .limit(10)
        .exec(function (err, items) {
          socket.emit('more:loaded', items);
          socket.offset += 10;
        });
    });

    socket.on('filter:added', function(data) {
      Item
        .find({tags: data.filter})
        .sort({ 'date': -1 })
        .limit(20)
        .exec(function (err, items) {
          for (var i = 0; i < items.length; i++) {
            socket.emit('post:received', items[i]);
          }
          socket.offset = 20;
        });
    });

    socket.on('filter:removed', function(data) {
      Item
        .find({})
        .sort({ 'date': -1 })
        .limit(20)
        .exec(function (err, items) {
          for (var i = 0; i < items.length; i++) {
            socket.emit('post:received', items[i]);
          }
          socket.offset = 20;
        });
    });
  });
}