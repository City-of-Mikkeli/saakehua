(function(){
  'use strict';
  
  var socket = io();
  var contentLoading = false;
  var currentFilter = null;
  
  $(document).ready(function(){
    $('.grid').masonry({
      itemSelector: '.grid-item',
      columnWidth: '.grid-sizer',
      percentPosition: true
    });
  });
  
  $(window).scroll(function() {
   if($(window).scrollTop() + $(window).height() > $(document).height() - 100) {
     if(!contentLoading){
      socket.emit('load:more', {filter: currentFilter});
      contentLoading = true;
     }
   }
  });
  
  $('#searchItems').click(function(e){
    e.preventDefault();
    $('.grid-item').remove();
    var tag = $('#searchTag').val();
    if(tag.length > 0){
      if(!tag.startsWith('#')) {
        tag = '#' + tag;
      }
      socket.emit('filter:added', {filter: tag});
      currentFilter = tag;
    } else {
      socket.emit('filter:removed');
      currentFilter = null;
    }
    return null;
  });

  socket.on('more:loaded', function(data){
    for(var i = 0; i < data.length;i++) {
      var item = $(renderMediaItem(data[i]));
      $('.grid').append(item).masonry( 'appended', item );
      item.imagesLoaded(function(){
        $('.grid').masonry('layout');
      });    
    }
    contentLoading = false;
  });
  
  socket.on('post:received', function(data){
    if(currentFilter == null || data.tags.indexOf(currentFilter) > -1){
      var item = $(renderMediaItem(data));
      $('.grid').prepend(item).masonry( 'prepended', item );
      item.imagesLoaded(function(){
        $('.grid').masonry('layout');
      });
    }
  });
  
})();