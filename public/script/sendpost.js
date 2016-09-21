(function () {
  'use strict';

  $(document).ready(function () {

    var socket = io.connect();
    var uploader = new SocketIOFileUpload(socket);
    $('#postFileInput').change(function (e) {
      loadImage.parseMetaData(e.target.files[0], function (data) {
        var options = {
          maxWidth: 800,
          maxHeight: 800,
          canvas: true
        };
        if (typeof data.exif !== 'undefined') {
          var orientation = data.exif.get('Orientation');
          if (orientation) {
            options.orientation = orientation;
          }
        }
        loadImage(e.target.files[0], function (canvas) {
          canvas.toBlob(function (blob) {
            var file = new File([blob], e.target.files[0].name);
            uploader.submitFiles([file]);
          });
        }, options);
      });
    });
    uploader.addEventListener('start', function (event) {
      $('.fileUploadContainer').hide();
      $('.progress-container').show();
    });
    uploader.addEventListener('progress', function (event) {
      var progress = Math.floor((event.bytesLoaded / event.file.size) * 100);
      $('.progress-container .progress-bar').css('width', progress + '%');
    });
    socket.on('fileupload:failed', function (data) {
      alert('Tiedonsiirto epäonnistui! \n\n' + data.message);
      $('.fileUploadContainer').show();
      $('.progress-container').hide();
    });
    socket.on('fileupload:success', function (data) {
      $('.progress-container').hide();
      $('.image-container').append(renderImagePreview({ filename: data.file }))
    });
    socket.on('post:saved', function () {
      $('.image-container').empty();
      $('#postTextInput').val('');
      $('#postTagsInput').tagsinput('removeAll');
      alert('Kehu lisätty onnistuneesti!');
    });
    socket.on('post:failed', function (data) {
      alert(data.message);
    });
    $('#postTagsInput').tagsinput({
      trimValue: true,
      confirmKeys: [13, 188, 32]
    });
    $(document).on('click', '.removefile', function () {
      $('.image-container').empty();
      $('.fileUploadContainer').show();
    });
    $('.sendPostBtn').click(function () {
      var text = $('#postTextInput').val();
      if (text.length > 0) {
        var data = {
          text: text,
          tags: $('#postTagsInput').tagsinput('items'),
          image: $('#postImageUrl').length > 0 ? $('#postImageUrl').val() : null,
          email: $('#postEmailInput').val()
        }
        socket.emit('post:sent', data);
      }
    });
    $('#postTagsInput').on('itemAdded', function (event) {
      if (!event.item.startsWith('#')) {
        $('#postTagsInput').tagsinput('remove', event.item);
        $('#postTagsInput').tagsinput('add', '#' + event.item);
      }
    });
  });
})();