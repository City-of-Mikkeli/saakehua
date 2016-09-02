(function(){
  'use strict';

  var targetTime = moment({
    year :2016,
    month :8,
    day :23,
    hour :0,
    minute :0,
    second :0,
  });

  setInterval(function(){
    var untilPublish = moment.duration(targetTime.diff(moment()));
    var days = Math.floor(untilPublish.asDays());
    untilPublish.subtract(days, 'd');
    var hours = Math.floor(untilPublish.asHours());
    untilPublish.subtract(hours, 'h');
    var minutes = Math.floor(untilPublish.asMinutes());
    untilPublish.subtract(minutes, 'm');
    var seconds =  Math.floor(untilPublish.asSeconds());
    $('#countdown').text(days+':'+hours+':'+minutes+':'+seconds);
  }, 1000);



})();