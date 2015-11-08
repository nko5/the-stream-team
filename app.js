var express = require('express');
var app = express();
var http = require('http').Server(app);
var fs = require('fs');
var path = require('path');
var io = require('socket.io')(http);
var ndarray = require('ndarray');
var savePixels = require('save-pixels');
var imgs = require('./data/images.json');
var imgIds = Object.keys(imgs);

var pixels = ndarray([], [640, 640, 3]);

for(var xp = 0; xp < 640; xp++){
  for(var yp = 0; yp < 640; yp++){
    pixels.set(xp, yp, 0, 255);
    pixels.set(xp, yp, 1, 255);
    pixels.set(xp, yp, 2, 255);
  }
}

//Create a static file server
app.configure(function() {
  app.use(express.static(__dirname + '/public'));
});

var isPathGood = {};

var isThisReady = false;

app.get('/ref-sets/:x/:y/:ref', function(req, res){
  var x = parseInt(req.params.x);
  var y = parseInt(req.params.y);
  var ref = parseInt(req.params.ref);

  if(isThisReady){

    if(x < 640 && x >= 0) {
      if(y < 640 && y >= 0){
        if(ref < 512 && ref >= 0){
          var filePath = path.join(__dirname, 'data', 'ref-sets', ''+x, ''+y, ref+'.json');

          if(isPathGood[filePath] === undefined){
            try{
              fs.accessSync(filePath);
              isPathGood[filePath] = true;
            }
            catch(err){
              console.log(err);
              isPathGood[filePath] = false;
            }
          }

          if(isPathGood[filePath] === true){
            res.status(200);
            return fs.readFile(filePath, 'utf8', function(err, data){
              var json = JSON.parse(data.toString());
              res.json(json);
            });
          }
        }
      }
    }
  }


  res.status(404).json({
    'message': 'nope'
  });

});

app.get('/us-all.jpg', function(req, res){
  res.set('Content-Type', 'image/jpg');
  savePixels(pixels, 'jpg').pipe(res);
});

app.get('/rando.jpg', function(req, res){
  var request = require('request');
  var imgId = imgIds[Math.floor(Math.random() * imgIds.length)];
  res.set('Content-Type', 'image/jpg');
  request(imgs[imgId]).pipe(res);
})

var rgb = function(r,g,b){
  return [r, g, b];
}

var addColor = function(x, y, color){
  var colors = eval(color);
  for(var xAdd=0; xAdd<20; xAdd++){
    for(var yAdd=0; yAdd<20; yAdd++){
      pixels.set(x+xAdd, y+yAdd, 0, colors[0]);
      pixels.set(x+xAdd, y+yAdd, 1, colors[1]);
      pixels.set(x+xAdd, y+yAdd, 2, colors[2]);
    }
  }
}

io.on('connection', function(socket){
  socket.on('color', function(msg){
    console.log(msg);
    io.emit('back', msg);
    addColor(msg.x, msg.y, msg.color);
  });
});

var port = process.env.PORT || 8080;
http.listen(port, function(){
  console.log('Express server started on port %s', port);
});

require('child_process').exec('npm run curl && npm run unpack', {
  cwd: __dirname
}, function(){
  console.log('loaded');
  isThisReady = true;
});

