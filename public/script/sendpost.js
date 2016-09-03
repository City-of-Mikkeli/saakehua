(function () {
  'use strict';

  $(document).ready(function () {

    var socket = io.connect();
    var uploader = new SocketIOFileUpload(socket);
    uploader.listenOnInput(document.getElementById('postFileInput'));
    uploader.addEventListener('start', function (event) {
      $('.fileUploadContainer').hide();
      $('.progress-container').show();
    });
    uploader.addEventListener('progress', function (event) {
      var progress = event.bytesLoaded / event.file.size;
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
    $('.sendPostBtn').click(function(){
      var text = $('#postTextInput').val();
      if(text.length > 0) {
        var data = {
          text : text,
          tags : $('#postTagsInput').tagsinput('items'),
          image : $('#postImageUrl').length > 0 ? $('#postImageUrl').val() : null
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