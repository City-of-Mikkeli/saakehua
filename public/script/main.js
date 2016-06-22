(function(){
  'use strict';
  
  var socket = io();
  
  $(document).ready(function(){
    $('.grid').masonry({
      itemSelector: '.grid-item',
      columnWidth: '.grid-sizer',
      percentPosition: true
    });
  });
  
  socket.on('post:received', function(data){
    var item = $(renderMediaItem(data));
    $('.grid').prepend(item).masonry( 'prepended', item );
    item.imagesLoaded(function(){
      $('.grid').masonry('layout');
    });   
  });
  
})();