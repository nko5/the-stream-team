var path = require('path');
var fs = require('fs');

for(var x=0; x<640; x++){
  fs.mkdirSync(path.join(__dirname, 'ref-sets', ''+x));
  for(var y=0; y<640; y++){
    fs.mkdirSync(path.join(__dirname, 'ref-sets', ''+x, ''+y));
  }
}
