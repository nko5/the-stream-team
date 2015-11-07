var express = require('express');
var app = express();
var fs = require('fs');
var path = require('path');

//Create a static file server
app.configure(function() {
  app.use(express.static(__dirname + '/public'));
});

var isPathGood = {};

app.get('/ref-sets/:x/:y/:ref', function(req, res){
  var x = parseInt(req.params.x);
  var y = parseInt(req.params.y);
  var ref = parseInt(req.params.ref);

  if(x < 640 && x >= 0) {
    if(y < 640 && y >= 0){
      if(ref < 512 && ref > 0){
        var filePath = path.join(__dirname, 'data', 'ref-sets', req.params.x, req.params.y, req.params.ref+'.json');

        if(isPathGood[filePath] === undefined){
          try{
            fs.accessSync(filePath);
            isPathGood[filePath] = true;
          }
          catch(err){
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

  res.status(404).json({
    'message': 'nope'
  });

});

var port = 8080;
app.listen(port);
console.log('Express server started on port %s', port);
