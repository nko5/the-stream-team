var getPixels = require("get-pixels");
var imgs = require('./clean');
var imgIds = Object.keys(imgs);
var co = require('co');
var path = require('path');
var fs = require('fs');

var BLOCK_SIZE = 20;
var WIDTH = 640 / BLOCK_SIZE;
var PIXELS_PER_BLOCK = BLOCK_SIZE * BLOCK_SIZE;


var getBasePixels = function*(imgPath){
  return new Promise(function(accept, reject){
    getPixels(imgPath, function(err, pixels) {
      if(err) {
        reject(err);
      }
      else{
        accept(pixels);
      }
    });
  });
}

var getPixel = function(img, x, y){
  var red = 0;
  var green = 0;
  var blue = 0;

  var xBase = x * BLOCK_SIZE;
  var yBase = y * BLOCK_SIZE;

  for(var xAdd=0; xAdd < BLOCK_SIZE; xAdd++){
    for(var yAdd = 0; yAdd < BLOCK_SIZE; yAdd++){
      var xPos = xBase + xAdd;
      var yPos = yBase + yAdd;

      red += (img.get(x, y, 0) || 0) / PIXELS_PER_BLOCK;
      green += (img.get(x, y, 1) || 0) / PIXELS_PER_BLOCK;
      blue += (img.get(x, y, 2) || 0) / PIXELS_PER_BLOCK;
    }
  }

  red = Math.floor(red);
  green = Math.floor(green);
  blue = Math.floor(blue);

  var ref = Math.floor(red / 32) << 6 | Math.floor(green / 32) << 3 | Math.floor(blue / 32);

  return [ref, red, green, blue];
}

var getBlock = function(img, x, y){
  var middle = getPixel(img, x, y);
  var out = {};
  out.ref = middle[0] + '';
  out.up = y-1 >= 0 && getPixel(img, x, y-1);
  out.right = x+1 < WIDTH && getPixel(img, x-1, y);
  out.down = y+1 < WIDTH && getPixel(img, x, y+1);
  out.left = x-1 >= 0 && getPixel(img, x-1, y);

  return out;
}

co(function*() {

  var startContent = JSON.stringify({
    up: [],
    right: [],
    down: [],
    left: []
  });

  var imgs = [];

  for(var i=0; i<imgIds.length; i++){
    try{
      var imgSrc = path.join(__dirname, 'imgs', imgIds[i]+'.jpg');
      var img = yield getBasePixels(imgSrc);
      imgs.push(img);
    }
    catch(err){}

    if(i%30 === 0){
      console.log(100/imgIds.length*i, 'loaded');
    }
  }

  var numImgs = imgs.length;

  console.log('numImgs', numImgs);

  for(var x=0; x<WIDTH; x++){
    for(var y=0; y<WIDTH; y++){

      var data = {};

      var start = process.hrtime();

      for(var i=0; i<numImgs; i++){
        var img = imgs[i];
        var block = getBlock(img, x, y);

        data[block.ref] = data[block.ref] || JSON.parse(startContent);

        block.up && data[block.ref]['up'].push(block.up);
        block.right && data[block.ref]['right'].push(block.right);
        block.down && data[block.ref]['down'].push(block.down);
        block.left && data[block.ref]['left'].push(block.left);
      }

      var refs = Object.keys(data);

      console.log(x, y, 'num-refs', refs.length);

      for(var i=0; i<refs.length; i++){
        var filePath = path.join(__dirname, 'ref-sets', ''+x, ''+y, refs[i]+'.json');
        fs.writeFileSync(filePath, JSON.stringify(data[refs[i]]));
      }

      var diff = process.hrtime(start);

      console.log('benchmark took %d nanoseconds', diff[0] * 1e9 + diff[1]);

      console.log(x, y, 'added', refs.length);
    }
  }

  fs.writeFile(path.join(__dirname, 'data.json'), JSON.stringify(data));
}).catch(function(err){
  console.log(err);
  console.log(err.stack);
})
