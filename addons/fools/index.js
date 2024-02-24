export default async function ({ addon, global, console }) {
  document.addEventListener("keydown", async (e) => {
    if (e.key == "s") {
      await setup();
    }
  });
}
const wait = (s) =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      return resolve();
    }, s);
  });
async function setup() {
  document.querySelector("#view > div > div:nth-child(3) > div:nth-child(1)").scrollIntoView();
  await wait(300);
  document.body.style.overflow = "hidden";
  // create full screen canvas
  const canvas = document.createElement("canvas");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.position = "fixed";
  canvas.style.top = "0";
  canvas.style.left = "0";
  canvas.style.zIndex = "1000";
  document.body.appendChild(canvas);
  canvas.style.transition = "opacity 3s ease-in-out";
  canvas.style.opacity = "0.1";

  canvas.style.backgroundColor = "black";

  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // atari breakout
  const ballRadius = 10;
  let x = canvas.width / 2;
  let y = canvas.height - 30;
  let dx = 2;
  let dy = -2;
  const paddleHeight = 10;
  const paddleWidth = 175;

  let paddleX = (canvas.width - paddleWidth) / 2;
  let rightPressed = false;
  let leftPressed = false;
  const div = document.querySelector(
    "#view > div > div:nth-child(3) > div:nth-child(1) > div.box-content > div > div > div > div:nth-child(1) > a > img"
  );
  const div2 = document.querySelector(
    "#view > div > div:nth-child(3) > div:nth-child(1) > div.box-content > div > div > div > div:nth-child(2) > a > img"
  );
  const div3 = document.querySelector(
    "#view > div > div:nth-child(3) > div:nth-child(2) > div.box-content > div > div > div > div:nth-child(1) > a > img"
  );

  const rect = div.getBoundingClientRect();
  const rect2 = div2.getBoundingClientRect();
  const rect3 = div3.getBoundingClientRect();

  const brickRowCount = 3;
  const brickColumnCount = 5;
  const brickWidth = rect.width;
  const brickHeight = rect.height;
  const brickPadding = rect2.x - rect.x - rect.width;
  const brickVertPadding = rect3.y - rect.y - rect.height;
  console.log(brickVertPadding);
  const brickOffsetTop = rect.top; //- window.scrollY + 20;
  console.log(brickOffsetTop, rect.top, window.scrollY, rect.top - window.scrollY);
  const brickOffsetLeft = rect.left;

  const bricks = [];

  for (let c = 0; c < brickColumnCount; c++) {
    bricks[c] = [];
    for (let r = 0; r < brickRowCount; r++) {
      bricks[c][r] = { x: 0, y: 0, status: 1 };
    }
  }

  let score = 0;
  let lives = 3;

  function drawScore() {
    ctx.font = "16px Arial";
    ctx.fillStyle = "#0095DD";
    ctx.fillText("Score: " + score, 8, 20);
  }

  function drawLives() {
    ctx.font = "16px Arial";
    ctx.fillStyle = "#0095DD";
    ctx.fillText("Lives: " + lives, canvas.width - 65, 20);
  }

  function drawBall() {
    ctx.beginPath();
    ctx.arc(x, y, ballRadius, 0, Math.PI * 2);
    ctx.fillStyle = "#0095DD";
    ctx.fill();
    ctx.closePath();
  }

  function drawPaddle() {
    ctx.beginPath();
    ctx.rect(paddleX, canvas.height - paddleHeight, paddleWidth, paddleHeight);
    ctx.fillStyle = "#0095DD";
    ctx.fill();
    ctx.closePath();
  }

  function drawBricks() {
    for (let c = 0; c < brickColumnCount; c++) {
      for (let r = 0; r < brickRowCount; r++) {
        if (bricks[c][r].status === 1) {
          const brickX = c * ((r == 1 ? rect3.width : brickWidth) + brickPadding) + brickOffsetLeft;
          const brickY = r * ((r >= 1 ? rect3.height : brickHeight) + brickVertPadding) + brickOffsetTop;
          bricks[c][r].x = brickX;
          bricks[c][r].y = brickY;
          ctx.beginPath();

          ctx.rect(brickX, brickY, r == 1 ? rect3.width : brickWidth, r == 1 ? rect3.height : brickHeight);
          ctx.fillStyle = "#0095DD";
          ctx.fill();
          // fill with image
          // get image using selector similar to div selector
          console.log(
            r,
            c,
            document.querySelector(
              `#view > div > div:nth-child(3) > div:nth-child(${
                r + 1
              }) > div.box-content > div > div > div > div:nth-child(${c + 1}) > a > img`
            )
          );
          //  3rd row looks like
          // #view > div > div:nth-child(4) > div:nth-child(1) > div.box-content > div > div > div > div:nth-child(1) > a > img

          const img = document.querySelector(
            `#view > div > div:nth-child(${r == 2 ? 4 : 3}) > div:nth-child(${
              r >= 2 ? r - 1 : r + 1
            }) > div.box-content > div > div > div > div:nth-child(${c + 1}) > a > img`
          );

          ctx.drawImage(img, brickX, brickY, r == 1 ? rect3.width : brickWidth, r == 1 ? rect3.height : brickHeight);

          ctx.closePath();
        }
      }
    }
  }

  function collisionDetection() {
    for (let c = 0; c < brickColumnCount; c++) {
      for (let r = 0; r < brickRowCount; r++) {
        const b = bricks[c][r];
        if (b.status === 1) {
          if (x > b.x && x < b.x + brickWidth && y > b.y && y < b.y + brickHeight) {
            dy = -dy;
            b.status = 0;
            score++;
            if (score === brickRowCount * brickColumnCount) {
              alert("YOU WIN, CONGRATULATIONS!");
              //document.location.reload();
            }
          }
        }
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawBox();
    drawBricks();
    canvas.style.opacity = "1";

    drawBall();
    drawPaddle();
    drawScore();
    drawLives();
    collisionDetection();

    if (x + dx > canvas.width - ballRadius || x + dx < ballRadius) {
      dx = -dx;
    }
    if (y + dy < ballRadius) {
      dy = -dy;
    } else if (y + dy > canvas.height - ballRadius) {
      if (x > paddleX && x < paddleX + paddleWidth) {
        dy = -dy;
      } else {
        lives--;
        if (!lives) {
          alert("GAME OVER");
          document.location.reload();
        } else {
          x = canvas.width / 2;
          y = canvas.height - 30;
          dx = 2;
          dy = -2;
          paddleX = (canvas.width - paddleWidth) / 2;
        }
      }
    }

    if (rightPressed && paddleX < canvas.width - paddleWidth) {
      paddleX += 7;
    } else if (leftPressed && paddleX > 0) {
      paddleX -= 7;
    }

    x += dx;
    y += dy;
    requestAnimationFrame(draw);
  }

  function keyDownHandler(e) {
    if (e.key === "Right" || e.key === "ArrowRight") {
      rightPressed = true;
    } else if (e.key === "Left" || e.key === "ArrowLeft") {
      leftPressed = true;
    }
  }

  function keyUpHandler(e) {
    if (e.key === "Right" || e.key === "ArrowRight") {
      rightPressed = false;
    } else if (e.key === "Left" || e.key === "ArrowLeft") {
      leftPressed = false;
    }
  }

  function mouseMoveHandler(e) {
    const relativeX = e.clientX - canvas.offsetLeft;
    if (relativeX > 0 && relativeX < canvas.width) {
      paddleX = relativeX - paddleWidth / 2;
    }
  }
  // draw a box over given div
  function drawBox() {
    const div = document.querySelector(
      "#view > div > div:nth-child(3) > div:nth-child(1) > div.box-content > div > div > div > div:nth-child(1) > a > img"
    );
    const rect = div.getBoundingClientRect();
    // put in terms of canvas

    ctx.beginPath();
    ctx.rect(rect.left - window.scrollX, rect.top - window.scrollY, rect.width, rect.height);
    ctx.strokeStyle = "red";
    ctx.fillStyle = "#0095DD";

    ctx.fill();
    ctx.stroke();
    ctx.closePath();
  }
  await wait(500);
  document.addEventListener("keydown", keyDownHandler, false);
  document.addEventListener("keyup", keyUpHandler, false);
  document.addEventListener("mousemove", mouseMoveHandler, false);

  draw();
}
