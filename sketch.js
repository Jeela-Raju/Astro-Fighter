let paddle;
let obstacles = [];
let score = 0;
let highScore = 0;
let isGameOver = false;
let video;
let handpose;
let predictions = [];
let img1, img2, img3;
let handX = null;
let flag = false;
let canvas;

function preload() {
  img1 = loadImage('img1.png');
  img2 = loadImage('img2.png');
  img3 = loadImage('bkgn.png');
}

function setup() {
  canvas = createCanvas(600, 600);
  canvas.elt.setAttribute("tabindex", "0");
  canvas.elt.focus();

  video = createCapture(VIDEO);
  video.size(600, 600);
  video.hide();

  handpose = ml5.handpose(video, modelReady);
  handpose.on("predict", results => {
    predictions = results;
  });

  if (localStorage.getItem("highScore")) {
    highScore = int(localStorage.getItem("highScore"));
  }

  paddle = new Paddle();
}

function modelReady() {
  console.log("Handpose model loaded!");
  flag = true;
}

function draw() {
  if (!flag) {
    background(0);
    fill(255);
    textSize(32);
    textAlign(CENTER, CENTER);
    text("Loading model...", width / 2, height / 2);
    return;
  }

  background(img3);
  image(video, 500, 0, 100, 100);

  if (predictions.length > 0) {
    let hand = predictions[0];
    let index = hand.landmarks[8];
    handX = map(index[0], 0, video.width, width, 0);

    paddle.x = constrain(handX - paddle.width / 2, 0, width - paddle.width);
    paddle.shoot();

    fill(0, 255, 0);
    noStroke();
    ellipse(handX, index[1], 15);
  }

  if (!isGameOver) {
    paddle.move();
    paddle.show();

    for (let bullet of paddle.bullets) {
      bullet.update();
      bullet.show();

      for (let j = obstacles.length - 1; j >= 0; j--) {
        if (bullet.hits(obstacles[j])) {
          bullet.toDelete = true;
          obstacles.splice(j, 1);
          score++;
          if (score > highScore) {
            highScore = score;
            localStorage.setItem("highScore", highScore);
          }
        }
      }
    }

    paddle.bullets = paddle.bullets.filter(b => !b.isOffscreen() && !b.toDelete);

    if (frameCount % 90 === 0) {
      obstacles.push(new Obstacle());
    }

    for (let i = obstacles.length - 1; i >= 0; i--) {
      if (obstacles[i].hits(paddle)) {
        isGameOver = true;
        break;
      }

      if (obstacles[i].y > height) {
        obstacles.splice(i, 1);
      } else {
        obstacles[i].update();
        obstacles[i].show();
      }
    }

    fill(255);
    textSize(20);
    textAlign(CENTER);
    text(`Score: ${score} | High Score: ${highScore}`, width / 2, 30);
  } else {
    fill(255);
    textSize(32);
    textAlign(CENTER, CENTER);
    text("Game Over", width / 2, height / 2);
    textSize(20);
    text("Press R to Restart", width / 2, height / 2 + 40);
    noLoop();
  }

  fill(255);
  textSize(14);
  textAlign(LEFT, BOTTOM);
  text('FPS: ' + floor(frameRate()), 10, height - 10);
}

class Paddle {
  constructor() {
    this.width = 60;
    this.height = 90;
    this.x = width / 2 - this.width / 2;
    this.y = height - this.height - 10;
    this.bullets = [];
    this.lastShotTime = 0;
    this.shootCooldown = 300;
  }

  move() {
    this.x = constrain(this.x, 0, width - this.width);
  }

  show() {
    image(img2, this.x, this.y, this.width, this.height);
  }

  shoot() {
    if (millis() - this.lastShotTime > this.shootCooldown) {
      this.bullets.push(new Bullet(this.x + this.width / 2 - 1, this.y));
      this.lastShotTime = millis();
    }
  }
}

class Obstacle {
  constructor() {
    this.width = 50;
    this.height = 50;
    this.x = random(width - this.width);
    this.y = 0;
    this.speed = 6 + score * 0.3; // 💨 Increased speed
  }

  update() {
    this.y += this.speed;
  }

  show() {
    image(img1, this.x, this.y, this.width, this.height);
  }

  hits(paddle) {
    return (
      this.y + this.height >= paddle.y &&
      this.y + this.height <= paddle.y + paddle.height &&
      this.x + this.width >= paddle.x &&
      this.x <= paddle.x + paddle.width
    );
  }
}

class Bullet {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.ySpeed = -8;
    this.toDelete = false;
  }

  update() {
    this.y += this.ySpeed;
  }

  show() {
    fill(0, 255, 0);
    rect(this.x, this.y, 4, 10);
  }

  isOffscreen() {
    return this.y < 0;
  }

  hits(enemy) {
    return (
      this.x > enemy.x &&
      this.x < enemy.x + enemy.width &&
      this.y > enemy.y &&
      this.y < enemy.y + enemy.height
    );
  }
}

function keyPressed() {
  if (isGameOver && (key === 'r' || key === 'R')) {
    obstacles = [];
    score = 0;
    isGameOver = false;
    paddle.bullets = [];
    paddle.x = width / 2 - paddle.width / 2;
    loop();
  }
}
