(function () {
  'use strict';

  var socket = io();
  var contentLoading = false;
  var currentFilter = null;

  function getLikes() {
    var name = 'likes=';
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
      var c = ca[i];
      while (c.charAt(0) == ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
        try {
          var likes = JSON.parse(c.substring(name.length, c.length));
          return likes;
        } catch (error) {
          return [];
        }
      }
    }
    return [];
  }

  function setLikes(likes) {
    var d = new Date();
    d.setTime(d.getTime() + (365 * 24 * 60 * 60 * 1000));
    var expires = 'expires=' + d.toUTCString();
    document.cookie = 'likes=' + JSON.stringify(likes) + '; ' + expires;
  }

  $(document).ready(function () {
    $('.grid').masonry({
      itemSelector: '.grid-item',
      columnWidth: '.grid-sizer',
      percentPosition: true
    });
  });

  $(window).scroll(function () {
    if ($(window).scrollTop() + $(window).height() > $(document).height() - 100) {
      if (!contentLoading) {
        socket.emit('load:more', { filter: currentFilter });
        contentLoading = true;
      }
    }
  });

  $(document).on('click', '.likeBtn', function () {
    var postId = $(this).attr('data-post-id');
    var likes = getLikes();
    if(likes.indexOf(postId) == -1) {
      socket.emit('post:liked', {_id: postId});
      var likeContainer = $(this).parent().find('.like-container');
      var likeCount = parseInt(likeContainer.text(), 10);
      likeCount++;
      likeContainer.text(likeCount);
      likes.push(postId);
      setLikes(likes);
    }
  })

  $('#searchItems').click(function (e) {
    e.preventDefault();
    $('.grid-item').remove();
    var tag = $('#searchTag').val();
    if (tag.length > 0) {
      if (!tag.startsWith('#')) {
        tag = '#' + tag;
      }
      socket.emit('filter:added', { filter: tag });
      currentFilter = tag;
    } else {
      socket.emit('filter:removed');
      currentFilter = null;
    }
    return null;
  });

  socket.on('more:loaded', function (data) {
    for (var i = 0; i < data.length; i++) {
      var item = $(renderMediaItem(data[i]));
      $('.grid').append(item).masonry('appended', item);
      item.imagesLoaded(function () {
        $('.grid').masonry('layout');
      });
    }
    contentLoading = false;
  });

  socket.on('post:received', function (data) {
    if (currentFilter == null || data.tags.indexOf(currentFilter) > -1) {
      var item = $(renderMediaItem(data));
      $('.grid').prepend(item).masonry('prepended', item);
      item.imagesLoaded(function () {
        $('.grid').masonry('layout');
      });
    }
  });

})();