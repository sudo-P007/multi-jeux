// MARSHAL MULTI-GAMES - 5 Working Games + Audio/Particles
// Clean, readable source - fully functional

(function() {
  'use strict';

  // DOM Setup
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  const menu = document.getElementById('menu');
  const scoreEl = document.getElementById('score');
  const instrEl = document.getElementById('instructions');

  function resizeCanvas() {
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  // Game State
  let currentGame = -1;
  let score = 0;
  let keys = {};
  let particles = [];
  let gameObjects = [];
  let audioCtx;

  // Input
  window.addEventListener('keydown', e => { 
    keys[e.key.toLowerCase()] = true; 
    e.preventDefault(); 
  });
  window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

  // Audio
  function initAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
  }

  function playSound(freq, duration = 0.1, type = 'sine') {
    initAudio();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.frequency.value = freq;
    osc.type = type;
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  // Particles
  class Particle {
    constructor(x, y, vx, vy, life, color = '#ffd700') {
      this.x = x; this.y = y;
      this.vx = vx; this.vy = vy;
      this.life = life; this.maxLife = life;
      this.color = color;
      this.size = 4;
    }
    update() {
      this.x += this.vx; this.y += this.vy;
      this.vy += 0.1;
      this.vx *= 0.98;
      this.life--;
      this.size *= 0.99;
    }
    draw() {
      ctx.save();
      ctx.globalAlpha = this.life / this.maxLife;
      ctx.fillStyle = this.color;
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 10;
      ctx.fillRect(this.x - this.size/2, this.y - this.size/2, this.size, this.size);
      ctx.restore();
    }
  }

  function emitParticles(x, y, count = 15, color = '#ffd700') {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      particles.push(new Particle(x, y, Math.cos(angle) * 3, Math.sin(angle) * 2 - 1, 40, color));
    }
  }

  function updateParticles() {
    particles = particles.filter(p => {
      p.update();
      return p.life > 0;
    });
    particles.forEach(p => p.draw());
  }

  // GAME 1: Snake Patrol
  function startSnake() {
    currentGame = 0;
    score = 0;
    let snake = [{x: 15, y: 15}];
    let dx = 1, dy = 0;
    let food = {x: 20, y: 20};
    menu.style.display = 'none';

    function gameLoop() {
      const head = {x: snake[0].x + dx, y: snake[0].y + dy};
      
      // Wrap around
      if (head.x < 0) head.x = 39;
      if (head.x > 39) head.x = 0;
      if (head.y < 0) head.y = 29;
      if (head.y > 29) head.y = 0;

      snake.unshift(head);

      if (head.x === food.x && head.y === food.y) {
        score += 10;
        playSound(800, 0.1);
        emitParticles(head.x * 20 + 10, head.y * 20 + 10);
        food = {x: Math.floor(Math.random() * 40), y: Math.floor(Math.random() * 30)};
      } else {
        snake.pop();
      }

      // Self collision
      for (let seg of snake.slice(1)) {
        if (head.x === seg.x && head.y === seg.y) {
          playSound(200, 0.3, 'sawtooth');
          emitParticles(canvas.width/2, canvas.height/2, 30, '#ff4444');
          menu.style.display = 'block';
          return;
        }
      }

      // Draw
      ctx.fillStyle = '#111';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Grid
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1;
      for (let i = 0; i < 40; i++) ctx.strokeRect(i * 20, 0, 20, canvas.height);
      for (let i = 0; i < 30; i++) ctx.strokeRect(0, i * 20, canvas.width, 20);
      
      // Food
      ctx.fillStyle = '#00ff00';
      ctx.fillRect(food.x * 20 + 5, food.y * 20 + 5, 10, 10);
      
      // Snake
      snake.forEach((seg, i) => {
        ctx.fillStyle = i === 0 ? '#ffd700' : '#00aa00';
        ctx.fillRect(seg.x * 20 + 2, seg.y * 20 + 2, 16, 16);
      });

      scoreEl.textContent = `Score: ${score}`;
      requestAnimationFrame(gameLoop);
    }

    function updateDir() {
      if (keys['arrowleft'] || keys['a']) { dx = -1; dy = 0; }
      if (keys['arrowright'] || keys['d']) { dx = 1; dy = 0; }
      if (keys['arrowup'] || keys['w']) { dx = 0; dy = -1; }
      if (keys['arrowdown'] || keys['s']) { dx = 0; dy = 1; }
    }

setInterval(updateDir, 120 - Math.min(score/10, 30));
    gameLoop();
  }

  // GAME 2: Pong Battle
  function startPong() {
    currentGame = 1;
    score = 0;
    let ball = {x: canvas.width/2, y: canvas.height/2, vx: 4, vy: 3};
    let paddle1Y = canvas.height/2 - 50;
    let paddle2Y = canvas.height/2 - 50;
    menu.style.display = 'none';

    function gameLoop() {
      // Update
      ball.x += ball.vx;
      ball.y += ball.vy;
      
      // Player paddle
      if (keys['arrowup'] || keys['w']) paddle1Y = Math.max(0, paddle1Y - 6);
      if (keys['arrowdown'] || keys['s']) paddle1Y = Math.min(canvas.height - 100, paddle1Y + 6);
      
      // AI paddle (simple)
      paddle2Y += (ball.y - paddle2Y - 50) * 0.1;
      paddle2Y = Math.max(0, Math.min(canvas.height - 100, paddle2Y));
      
      // Wall bounce
      if (ball.y <= 10 || ball.y >= canvas.height - 10) {
        ball.vy *= -1;
        playSound(400, 0.05);
      }
      
      // Paddle collision
      if (ball.x <= 40 && ball.y > paddle1Y && ball.y < paddle1Y + 100) {
        ball.vx *= -1.05;
        playSound(600, 0.08);
      }
      if (ball.x >= canvas.width - 40 && ball.y > paddle2Y && ball.y < paddle2Y + 100) {
        ball.vx *= -1.05;
        playSound(600, 0.08);
      }
      
      // Score
      if (ball.x > canvas.width) {
        score += 10;
        playSound(800, 0.15);
        ball = {x: canvas.width/2, y: canvas.height/2, vx: -4, vy: (Math.random() - 0.5) * 6};
      }
      if (ball.x < 0) {
        ball = {x: canvas.width/2, y: canvas.height/2, vx: 4, vy: (Math.random() - 0.5) * 6};
      }

      // Draw
      ctx.fillStyle = '#111';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = '#aaa';
      ctx.fillRect(20, paddle1Y, 20, 100);
      ctx.fillRect(canvas.width - 40, paddle2Y, 20, 100);
      
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, 8, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 4;
      ctx.setLineDash([10, 10]);
      ctx.beginPath();
      ctx.moveTo(canvas.width/2, 0);
      ctx.lineTo(canvas.width/2, canvas.height);
      ctx.stroke();

      scoreEl.textContent = `Score: ${score}`;
      instrEl.textContent = 'W/S or Arrows: Move Paddle';
      
      requestAnimationFrame(gameLoop);
    }
    gameLoop();
  }

  // GAME 3: Space Race
  function startRace() {
    currentGame = 2;
    score = 0;
    let ship = {x: 100, y: canvas.height/2, speed: 0};
    let obstacles = [];
    let scroll = 0;
    menu.style.display = 'none';

    function gameLoop() {
      // Input
      if (keys['arrowup'] || keys['w']) ship.speed = Math.min(6, ship.speed + 0.3);
      if (keys['arrowdown'] || keys['s']) ship.speed = Math.max(-2, ship.speed - 0.3);
      if (keys['arrowleft'] || keys['a']) ship.y = Math.max(30, ship.y - 4);
      if (keys['arrowright'] || keys['d']) ship.y = Math.min(canvas.height - 30, ship.y + 4);
      
      ship.x += ship.speed;
      scroll += 3;
      score += ship.speed > 0 ? 1 : 0;

      // Spawn obstacles
      if (Math.random() < 0.02) {
        obstacles.push({y: 0, x: canvas.width + 50, size: 40 + Math.random() * 30});
      }
      
      // Update obstacles
      obstacles = obstacles.filter(obs => {
        obs.x -= 5;
        obs.y += Math.sin(obs.x * 0.01) * 2;
        return obs.x > -100;
      });

      // Collision
      for (let obs of obstacles) {
        const dx = ship.x - obs.x;
        const dy = ship.y - obs.y;
        if (Math.sqrt(dx*dx + dy*dy) < 30) {
          playSound(150, 0.3);
          emitParticles(ship.x, ship.y, 25, '#ff4444');
          menu.style.display = 'block';
          return;
        }
      }

      // Draw
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Stars
      ctx.fillStyle = '#fff';
      for (let i = 0; i < 50; i++) {
        const x = (i * 137 + scroll * 0.5) % canvas.width;
        const y = (i * 89) % canvas.height;
        const size = (Math.sin(scroll * 0.01 + i) + 1) * 1.5;
        ctx.fillRect(x, y, size, size);
      }
      
      // Obstacles
      ctx.fillStyle = '#ff4444';
      obstacles.forEach(obs => {
        ctx.beginPath();
        ctx.arc(obs.x, obs.y, obs.size/2, 0, Math.PI * 2);
        ctx.fill();
      });
      
      // Ship
      ctx.fillStyle = '#00aaff';
      ctx.beginPath();
      ctx.moveTo(ship.x, ship.y - 15);
      ctx.lineTo(ship.x - 10, ship.y + 10);
      ctx.lineTo(ship.x + 10, ship.y + 10);
      ctx.fill();
      
      ctx.shadowColor = '#00aaff';
      ctx.shadowBlur = 20;
      ctx.fillStyle = '#ffff88';
      ctx.fillRect(ship.x - 3, ship.y - 12, 6, 8);
      ctx.shadowBlur = 0;

      scoreEl.textContent = `Distance: ${Math.floor(score)}`;
      instrEl.textContent = 'Arrows/WASD: Move + Accelerate';
      
      requestAnimationFrame(gameLoop);
    }
    gameLoop();
  }

  // GAME 4: Tank Wars (simple)
  function startTank() {
    currentGame = 3;
    score = 0;
    let tank = {x: 100, y: canvas.height - 80};
    let enemies = [];
    let bullets = [];
    menu.style.display = 'none';

    function gameLoop() {
      // Player movement
      if (keys['arrowleft'] || keys['a']) tank.x = Math.max(30, tank.x - 4);
      if (keys['arrowright'] || keys['d']) tank.x = Math.min(canvas.width - 30, tank.x + 4);
      
      // Shoot
      if (keys[' ']) {
        bullets.push({x: tank.x, y: tank.y - 20});
        playSound(700, 0.08);
        keys[' '] = false;
      }

      // Spawn enemies
      if (Math.random() < 0.015 && enemies.length < 8) {
        enemies.push({x: Math.random() * canvas.width, y: 50, vx: (Math.random() - 0.5) * 2});
      }

      // Update bullets
      bullets = bullets.filter(b => {
        b.y -= 8;
        return b.y > 0;
      });

      // Update enemies
      enemies.forEach(e => {
        e.y += 1;
        e.x += e.vx;
      });
      enemies = enemies.filter(e => e.y < canvas.height);

      // Collisions
      bullets.forEach((b, bi) => {
        enemies.forEach((e, ei) => {
          if (Math.abs(b.x - e.x) < 20 && Math.abs(b.y - e.y) < 20) {
            emitParticles(e.x, e.y);
            playSound(440, 0.1, 'square');
            enemies.splice(ei, 1);
            bullets.splice(bi, 1);
            score += 25;
          }
        });
      });

      // Draw
      ctx.fillStyle = '#111';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Ground
      ctx.fillStyle = '#4a4a2a';
      ctx.fillRect(0, canvas.height - 50, canvas.width, 50);
      
      // Tank
      ctx.fillStyle = '#8b4513';
      ctx.fillRect(tank.x - 15, tank.y, 30, 25);
      ctx.fillStyle = '#228b22';
      ctx.fillRect(tank.x - 10, tank.y - 10, 20, 15);
      
      // Bullets
      ctx.fillStyle = '#ffff44';
      bullets.forEach(b => ctx.fillRect(b.x - 2, b.y - 4, 4, 8));
      
      // Enemies
      ctx.fillStyle = '#ff4444';
      enemies.forEach(e => {
        ctx.fillRect(e.x - 12, e.y - 12, 24, 24);
        ctx.fillStyle = '#000';
        ctx.fillRect(e.x - 4, e.y - 8, 8, 4);
        ctx.fillStyle = '#ff4444';
      });

      scoreEl.textContent = `Score: ${score}`;
      instrEl.textContent = 'A/D: Move | Space: Shoot';
      
      requestAnimationFrame(gameLoop);
    }
    gameLoop();
  }

  // GAME 5: Tetris Defense (basic drop)
  function startTetris() {
    currentGame = 4;
    score = 0;
    const ROWS = 25, COLS = 15;
    let board = Array(ROWS).fill().map(() => Array(COLS).fill(0));
    let piece = {x: 7, y: 0, shape: [[1,1],[1,1]]};
    let dropTime = 0;
    menu.style.display = 'none';

    function newPiece() {
      const pieces = [
        [[1,1],[1,1]], // Square
        [[1,0,0],[1,1,1]], // T
        [[0,1,1],[1,1,0]] // S
      ];
      return {x: Math.floor(COLS/2), y: 0, shape: pieces[Math.floor(Math.random()*pieces.length)]};
    }

    function collide() {
      for (let py = 0; py < piece.shape.length; py++) {
        for (let px = 0; px < piece.shape[py].length; px++) {
          if (piece.shape[py][px]) {
            const nx = piece.x + px, ny = piece.y + py;
            if (nx < 0 || nx >= COLS || ny >= ROWS || (ny > 0 && board[ny][nx])) {
              return true;
            }
          }
        }
      }
      return false;
    }

    function merge() {
      piece.shape.forEach((row, py) => {
        row.forEach((val, px) => {
          if (val) board[piece.y + py][piece.x + px] = 1;
        });
      });
    }

    function gameLoop(time) {
      dropTime += 0.016;
      
      // Input
      if (keys['arrowleft'] || keys['a']) { piece.x--; if (collide()) piece.x++; }
      if (keys['arrowright'] || keys['d']) { piece.x++; if (collide()) piece.x--; }
      if (keys['arrowdown'] || keys['s']) { piece.y++; if (collide()) { piece.y--; merge(); piece = newPiece(); score += 10; playSound(523, 0.1); } }
      
      if (dropTime > 0.5) {
        piece.y++;
        dropTime = 0;
        if (collide()) {
          piece.y--;
          merge();
          piece = newPiece();
          score += 10;
          playSound(440, 0.08);
        }
      }

      // Collision at top
      if (piece.y < 0 && collide()) {
        menu.style.display = 'block';
        return;
      }

      // Draw
      ctx.fillStyle = '#111';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const blockSize = Math.min(canvas.width / COLS, canvas.height / ROWS);
      const offsetX = (canvas.width - COLS * blockSize) / 2;
      const offsetY = (canvas.height - ROWS * blockSize) / 2;

      // Board
      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          if (board[y][x]) {
            ctx.fillStyle = '#ff6600';
            ctx.fillRect(offsetX + x * blockSize, offsetY + y * blockSize, blockSize - 1, blockSize - 1);
          }
        }
      }
      
      // Piece
      ctx.fillStyle = '#00aaff';
      piece.shape.forEach((row, py) => {
        row.forEach((val, px) => {
          if (val) {
            ctx.fillRect(offsetX + (piece.x + px) * blockSize, 
                        offsetY + (piece.y + py) * blockSize, 
                        blockSize - 1, blockSize - 1);
          }
        });
      });

      scoreEl.textContent = `Lines: ${score/10}`;
      instrEl.textContent = 'A/D: Left/Right | S: Drop';
      
      requestAnimationFrame(gameLoop);
    }
    requestAnimationFrame(gameLoop);
  }

  // Game starter
  window.startGame = function(id) {
    scoreEl.textContent = 'Score: 0';
    switch(id) {
      case 0: startSnake(); break;
      case 1: startPong(); break;
      case 2: startRace(); break;
      case 3: startTank(); break;
      case 4: startTetris(); break;
    }
  };

  // Main loop
  function mainLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    updateParticles();
    requestAnimationFrame(mainLoop);
  }
  mainLoop();

})();

