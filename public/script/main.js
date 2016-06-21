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
    var item = $('<div/>')
      .addClass('grid-item')
      .append($('<p/>').text(data.text));
    if(data.img) {
      item.append(
        $('<img/>')
          .addClass('img-responsive')
          .attr('src', data.img)
      )
    }
    $('.grid').prepend(item).masonry( 'prepended', item );
  });
  
})();