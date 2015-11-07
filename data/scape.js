var request = require('request');
var fs = require('fs');
var imgs = require('./images.json');
var path = require('path');
var imgIds = Object.keys(imgs);

imgIds.forEach(function(id){
  var from = imgs[id];
  var to = path.join(__dirname, 'imgs', id+'.jpg');
  request(from).pipe(fs.createWriteStream(to));
});
