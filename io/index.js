'use strict';

var Item = require('../model/item');
var conf = require('../config');
var siofu = require('socketio-file-upload');
var fileType = require('file-type');
var fs = require('fs');
var uuid = require('uuid');

module.exports = function (io) {
  io.on('connection', function (socket) {

    var uploader = new siofu();
    uploader.listen(socket);

    uploader.on('start', function (event) {
      try {
        var filename = uuid.v1();
        socket.fileupload = {};
        socket.fileupload.filename = filename;
        socket.fileupload.mimetype = null;
      } catch (error) {
        console.log('Error starting upload.');
        console.log(error);
        socket.emit('fileupload:failed', { message: 'Error starting upload' });
      }
    });
    uploader.on('progress', function (event) {
      try {
        if (socket.fileupload.mimetype == null) {
          var filemime = fileType(event.buffer);
          var mimetype = filemime !== null ? filemime.mime : null;
          if (mimetype !== null && conf.supportedMimetypes.indexOf(mimetype) > -1) {
            socket.fileupload.mimetype = mimetype;
            socket.fileWriter = fs.createWriteStream(__dirname + '/../public/uploads/' + socket.fileupload.filename);
            socket.fileWriter.write(event.buffer);
            event.file.meta.uuid = socket.fileupload.filename;
            event.file.meta.mimetype = socket.fileupload.mimetype;
          } else {
            uploader.abort(event.file.id, socket);
            socket.emit('fileupload:failed', { message: 'Tuettuja tiedostomuotoja ovat: ' + conf.supportedMimetypes.join(', ') });
          }
        } else {
          socket.fileWriter.write(event.buffer);
        }
      } catch (error) {
        console.log('Error during upload.');
        console.log(error);
        socket.emit('fileupload:failed', { message: 'Error during upload' });
      }
    });
    uploader.on('complete', function (event) {
      try {
        if (event.interrupt) {
          socket.emit('fileupload:failed', { message: 'Tiedonsiirto keskeytettiin' });
        } else {
          socket.emit('fileupload:success', { file: socket.fileupload.filename });
        }
        socket.fileWriter.end();
      } catch (error) {
        console.log('Error completing upload.');
        console.log(error);
        socket.emit('fileupload:failed', { message: 'Error completing upload' });
      }
    });

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
      if (data.filter != null) {
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

    socket.on('filter:added', function (data) {
      Item
        .find({ tags: data.filter })
        .sort({ 'date': -1 })
        .limit(20)
        .exec(function (err, items) {
          for (var i = 0; i < items.length; i++) {
            socket.emit('post:received', items[i]);
          }
          socket.offset = 20;
        });
    });

    socket.on('filter:removed', function (data) {
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

    socket.on('post:liked', function (data) {
      Item
        .findOne({ _id: data._id })
        .exec(function (err, item) {
          if (!err && item) {
            item.likes = item.likes + 1;
            item.save();
          }
        });
    });

    socket.on('post:sent', function (data) {
      if (data.text.length > 0) {
        var item = new Item();
        item.code = uuid.v1();
        item.text = data.text + ' ' + data.tags.join(' ');
        item.tags = data.tags;
        item.img = data.image;
        item.email = data.email;
        item.date = new Date();
        item.icon = 'fa fa-smile-o';
        item.link = '#'+item.code;
        item.likes = 0;
        item.save(function (err, item) {
          if (err) {
            socket.emit('post:failed', { message: 'Hupsista, jokin meni vikaan. Yritä myöhemmin uudelleen.' });
          } else {
            socket.emit('post:saved');
          }
        })
      } else {
        socket.emit('post:failed', { message: 'Syötä kehu.' });
      }
    });
  });
}