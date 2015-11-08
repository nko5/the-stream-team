
(function(){

  var socket = io();

  var canvas = document.getElementById('canvas');
  var ctx = canvas.getContext('2d');

  var background = new Image();
  background.src = "/us-all.jpg";

  background.onload = function(){
    ctx.drawImage(background, 0, 0);
  }

  socket.on('back', function(msg){
    console.log(msg);
    ctx.fillStyle = msg.color;
    ctx.fillRect(msg.x, msg.y, 20, 20);
  });

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
  var color = 'white';

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

  var canPress = false;

  var setColorPalette = function(){
    canPress = false;
    var xt = x / 20;
    var yt = y / 20;
    get('/ref-sets/'+xt+'/'+yt+'/'+ref, function(err, data){
      if(err){
        alert(':( -- we had an error');
        x = 320;
        y = 320;
        ref = 103;
        setColorPalette();
      }
      else{
        canPress = true;

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

        var handles = [];

        var redMax = 0;
        var greenMax = 0;
        var blueMax = 0;

        content.map(function(channels){
          channels.red = channels[1];
          channels.green = channels[2];
          channels.blue = channels[3];

          redMax = redMax < channels.red ? channels.red : redMax;
          greenMax = greenMax < channels.green ? channels.green : greenMax;
          blueMax = blueMax < channels.blue ? channels.blue : blueMax;

          return channels;
        });

        content.sort(function(a, b){
          return Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]) + Math.abs(a[3] + b[3]);
        })

        var redIndex = null;
        var greenIndex = null;
        var blueIndex = null;

        content.forEach(function(channels, i){
          var div = document.createElement('div');
          div.innerText = i <= 9 ? i : '';
          var pickRef = channels[0];
          var red = channels[1];
          var green = channels[2];
          var blue = channels[3];
          var pickColor = 'rgb('+red+','+green+','+blue+')';
          div.style.backgroundColor = pickColor;

          div.onclick = function(){
            handles[i]();
          }

          redIndex = channels.red === redMax ? i : redIndex;
          greenIndex = channels.green === greenMax ? i : greenIndex;
          blueIndex = channels.blue === blueMax ? i : blueIndex;

          handles.push(function(){
            canPress = false;
            ctx.fillStyle = color;
            ctx.fillRect(x, y, 20, 20);

            x += clickDir[lbl]['x'];
            y += clickDir[lbl]['y'];
            color = pickColor;
            ref = pickRef;

            socket.emit('color', {
              x: x,
              y: y,
              color: color
            });

            ctx.fillStyle = color;
            ctx.fillRect(x, y, 20, 20);
            ctx.strokeStyle = '#00ff00';
            ctx.strokeRect(x, y, 20, 20);

            setColorPalette();
          });

          palette.appendChild(div);
        });

        document.onkeydown = function(e){
          if(canPress){
            if(e.keyCode >= 48 && e.keyCode <= 57){
              handles[e.keyCode - 48] && handles[e.keyCode - 48]();
            }
            else if(e.keyCode == 82) {
              handles[redIndex]();
            }
            else if(e.keyCode == 71) {
              handles[greenIndex]();
            }
            else if(e.keyCode == 66) {
              handles[redIndex]();
            }
          }
        }
      }
    });
  }

  setColorPalette();
}());
