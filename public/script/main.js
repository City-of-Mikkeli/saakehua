(function(){
  'use strict';
  
  var socket = io();
  var contentLoading = false;
  
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
      socket.emit('load:more');
      contentLoading = true;
     }

   }
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
    var item = $(renderMediaItem(data));
    $('.grid').prepend(item).masonry( 'prepended', item );
    item.imagesLoaded(function(){
      $('.grid').masonry('layout');
    });   
  });
  
})();