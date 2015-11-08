
(function(){

  var canvas = document.getElementById('canvas');
  var ctx = canvas.getContext('2d');

  var palette = document.getElementById('palette');

  var clickDir = {
    'up': {
      x: 0,
      y: -20
    },
    'right': {
      x: 20,
      y: 0
    },
    'down': {
      x: 0,
      y: 20
    },
    'left': {
      x: -20,
      y: 0
    }
  }

  var back = {
    'up': 'down',
    'down': 'up',
    'left': 'right',
    'right': 'left'
  }

  var last = null;


  var x = 320;
  var y = 320;
  var ref = 103;
  var color = 'pink';

  var get = function(url, cb){
    var req = new XMLHttpRequest();
    req.onload = function() {
      if(req.status !== 200){
        cb(new Error(req.response));
      }
      else{
        cb(null, JSON.parse(req.response));
      }
    }

    req.open('GET', url);
    req.send();
  }

  document.onkeydown = function(e){
    console.log('a', e);
  }

  var setColorPalette = function(){
    var xt = x / 20;
    var yt = y / 20;
    get('/ref-sets/'+xt+'/'+yt+'/'+ref, function(err, data){
      if(err){
        alert(err.message);
      }
      else{

        var lbls = ['up', 'right', 'down', 'left'];

        lbls = lbls.filter(function(a){
          if(a===last){
            return false;
          }
          else {
            return data[a].length > 0;
          }
        });

        var lbl = lbls[Math.floor(Math.random()*lbls.length)];
        last = back[lbl];

        palette.innerHTML = '';
        var content = data[lbl];
        content.forEach(function(channels, i){
          var div = document.createElement('div');
          div.innerText = i;
          var pickRef = channels[0];
          var red = channels[1];
          var green = channels[2];
          var blue = channels[3];
          var pickColor = 'rgb('+red+','+green+','+blue+')';
          div.style.backgroundColor = pickColor;
          div.onkeydown = function(e){
          }
          div.onclick = function(){
            ctx.fillStyle = color;
            ctx.fillRect(x, y, 20, 20);
            ctx.strokeStyle = color;
            ctx.strokeRect(x, y, 20, 20);

            x += clickDir[lbl]['x'];
            y += clickDir[lbl]['y'];
            color = pickColor;
            ref = pickRef;

            ctx.fillStyle = color;
            ctx.fillRect(x, y, 20, 20);
            ctx.strokeStyle = '#00ff00';
            ctx.strokeRect(x, y, 20, 20);

            setColorPalette();
          }
          palette.appendChild(div);
        });
      }
    });
  }

  setColorPalette();
}());
