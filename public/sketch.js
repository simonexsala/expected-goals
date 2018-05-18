var shots = []
var backgroundImage;

function setup() {
  var canvas = createCanvas(534, 356)
  backgroundImage = loadImage("assets/football_pitch.png")
  background(backgroundImage)

  // for (var i = 0; i < shotData.length; i++)
    // shots.push(new Shot(shotData[i].x, shotData[i].y, 30, 20, shotData[i].scored))
}

function draw() {
  background(backgroundImage)
  for (var i = 0; i < shots.length; i++)
    shots[i].display()
    noLoop();
}
