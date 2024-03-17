/*please don't look to this code for best practices
 * it's an easter egg, it's supposed to be a mess
 * - grom
 */
export default async function ({ addon, global, console }) {
  const button = Object.assign(document.createElement("div"), { className: "link right mystuff egg" });
  const link = document.createElement("a");
  link.style.backgroundImage = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23fff' d='M6.89 6.36C8.23 3.91 10 2 12 2c2 0 3.77 1.91 5.11 4.36c-.85.21-1.61.71-2.11 1.41a3.712 3.712 0 0 0-5.2-.8c-.3.22-.58.49-.8.8c-.5-.7-1.26-1.2-2.11-1.41M15 18.06l-3-3l-3 3l-3-3l-1.27 1.27a7.504 7.504 0 0 0 9.11 5.43a7.529 7.529 0 0 0 5.43-5.43L18 15.06zm-6-2.12l3-3l3 3l3-3l1.5 1.5c-.13-2.31-.7-4.58-1.69-6.68c-1.16.1-2.06 1.07-2.06 2.24h-1.5A2.25 2.25 0 0 0 12 7.75A2.25 2.25 0 0 0 9.75 10h-1.5c0-1.17-.9-2.14-2.06-2.24c-.99 2.1-1.56 4.37-1.69 6.68l1.5-1.5z'/%3E%3C/svg%3E")`;
  link.style.backgroundRepeat = "no-repeat";
  button.append(link);
  button.title = "with ❤️ from the Scratch Addons team";
  document.querySelector(".search").after(button);
  button.addEventListener("click", async () => {
    await setup();
  });
  async function setup() {
    // play game_theme.mp3
    const audio = new Audio(addon.self.dir + "/game_theme.mp3");
    audio.play();
    audio.loop = true;
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

    //canvas.style.backgroundColor = "#111";

    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    let gameOver = false;
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
    // find mod-splash div with 3 or more .box children
    // this is incredibly braindead but it works
    // its an easter egg, give me a break
    //let box = document.querySelector(".inner.mod-splash:nth-of-type(2)");
    let box;
    for (let div of document.querySelectorAll(".inner.mod-splash")) {
      if (div.querySelector(".news")) {
        continue;
      }
      if (div.querySelectorAll(".box").length >= 4) {
        box = div;
        break;
      }
    }
    box.scrollIntoView();
    const div = box.querySelector("div:nth-of-type(1) > a > img:nth-of-type(1)");
    const div2 = box.querySelector("div:nth-of-type(2) > a > img:nth-of-type(1)");
    const div3 = box.querySelector(
      `.box:nth-of-type(2) > div.box-content > div > div > div > div:nth-child(1) > a > img`
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
    const brickOffsetTop = rect.top; //- window.scrollY + 20;
    const brickOffsetLeft = rect.left;

    const bricks = [];
    let debris = [];

    for (let c = 0; c < brickColumnCount; c++) {
      bricks[c] = [];
      for (let r = 0; r < brickRowCount; r++) {
        bricks[c][r] = { x: 0, y: 0, status: 3 };
      }
    }

    let score = 0;
    let lives = 3;

    function drawScore() {
      ctx.font = "2rem Helvetica Neue";
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
          if (bricks[c][r].status > 0) {
            // check if enough space to bottom of screen on last row

            let tooSmall =
              r == 2 && r * (brickHeight + brickVertPadding) + brickOffsetTop + brickHeight + 10 > canvas.height;
            if (tooSmall) {
              console.log("too small");
            }

            const brickX = c * ((r == 1 ? rect3.width : brickWidth) + brickPadding) + brickOffsetLeft;
            const brickY = r * ((tooSmall ? 50 : brickHeight) + brickVertPadding) + brickOffsetTop;
            bricks[c][r].x = brickX;
            bricks[c][r].y = brickY;
            const img = box.querySelector(
              `.box:nth-of-type(${r + 1}) > div.box-content > div > div > div > div:nth-child(${c + 1}) > a > img`
            );

            let image = ctx.drawImage(
              img,
              brickX,
              brickY,
              r == 1 ? rect3.width : brickWidth,
              r == 1 ? rect3.height : brickHeight
            );
            bricks[c][r].image = image;
            ctx.beginPath();

            ctx.rect(brickX, brickY, brickWidth, tooSmall ? 50 : brickHeight);
            ctx.fillStyle = `#000000${
              bricks[c][r].status == 3 ? "00" : bricks[c][r].status == 2 ? "66" : bricks[c][r].status == 1 ? "bb" : "ff"
            }`;
            ctx.fill();

            ctx.closePath();
          }
        }
      }
    }

    function collisionDetection() {
      // keep within 950px centered on the canvas
      if (x + ballRadius < canvas.width / 2 - 475 || x + ballRadius > canvas.width / 2 + 475) {
        dx = -dx;
      }

      for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
          const b = bricks[c][r];
          if (b.status > 0) {
            if (
              x + ballRadius > b.x &&
              x - ballRadius < b.x + brickWidth &&
              y + ballRadius > b.y &&
              y - ballRadius < b.y + brickHeight
            ) {
              dy = -dy;
              b.status--;

              debris.push({ x: x, y: y, dy: Math.random() * 2 - 1, dx: Math.random() * 2 - 1 });
              debris.push({ x: x + 8, y: y, dy: Math.random() * 2 - 1, dx: Math.random() * 2 - 1 });
              debris.push({ x: x - 8, y: y, dy: Math.random() * 2 - 1, dx: Math.random() * 2 - 1 });
              debris.push({ x: x, y: y + 8, dy: Math.random() * 2 - 1, dx: Math.random() * 2 - 1 });
              debris.push({ x: x, y: y - 8, dy: Math.random() * 2 - 1, dx: Math.random() * 2 - 1 });
              // play sound
              var audio = new Audio(addon.self.dir + "/break.wav");
              audio.play();

              score++;
              if (score === brickRowCount * brickColumnCount * 3) {
                gameOver = true;
              }
            }
          }
        }
      }
    }
    let firstTransition = true;
    function drawBg() {
      // draw 950 px black rectangle centered on the canvas

      ctx.fillStyle = "#111";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    async function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawBg();
      drawBricks();
      canvas.style.opacity = "1";

      drawBall();
      drawPaddle();
      drawScore();
      drawLives();
      if (firstTransition) {
        await wait(3000);
        firstTransition = false;
      }
      collisionDetection();
      renderDebris(ctx);
      if (x + dx + ballRadius > canvas.width || x + dx < ballRadius) {
        dx = -dx;
      }
      if (y + dy < ballRadius) {
        dy = -dy;
      } else if (y + dy > canvas.height - ballRadius) {
        if (x > paddleX && x < paddleX + paddleWidth) {
          // change dy based on where the ball hits the paddle
          dy = -dy;
          dx = 8 * ((x - (paddleX + paddleWidth / 2)) / paddleWidth);
        } else {
          lives--;
          if (!lives) {
            gameOver = true;
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

      x += dx * 1.5;
      y += dy * 1.5;
      if (gameOver) {
        canvas.remove();

        document.body.style.overflow = "auto";
        audio.pause();
        if (score === brickRowCount * brickColumnCount * 3) {
          let winNoise = new Audio(addon.self.dir + "/win_noise.mp3");
          winNoise.play();
          addon.tab.confirm("You won!", "Happy april fools from the Scratch Addons team!");
        } else {
          let loseNoise = new Audio(addon.self.dir + "/lose_noise.mp3");
          loseNoise.play();

          addon.tab.confirm("Game over!", "Happy april fools from the Scratch Addons team!");
        }
      } else {
        requestAnimationFrame(draw);
      }
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

    await wait(500);
    document.addEventListener("keydown", keyDownHandler, false);
    document.addEventListener("keyup", keyUpHandler, false);
    document.addEventListener("mousemove", mouseMoveHandler, false);
    const renderDebris = () => {
      for (let debri of debris) {
        // draw falling rectangles
        ctx.beginPath();
        ctx.fillStyle = `#0095DD`;
        ctx.fillRect(debri.x, debri.y, 8, 8);
        ctx.fill();
        ctx.closePath();
        // make them fall and rotate
        debri.y += debri.dy;
        debri.x += debri.dx;
        debri.dy += 0.1;
        debri.dx *= 0.99;
      }
    };

    await draw();
  }
}

const wait = (s) =>
  new Promise((resolve, reject) => {
    setTimeout(() => {
      return resolve();
    }, s);
  });
