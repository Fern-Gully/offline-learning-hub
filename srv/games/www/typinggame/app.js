// TypeRush: HTML5 Canvas typing game (no leaderboard)
// Changes:
// - Canvas fills window (100vw x 100vh) using window.innerWidth/innerHeight
// - Slower drop speeds and spawn cadence
// - Removed all leaderboard code & UI hooks

(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');

  // Fill the window
  let DPR = Math.max(1, window.devicePixelRatio || 1);
  function fitCanvas() {
    // Hard-size the canvas to the viewport so it always fills the window
    const W = window.innerWidth;
    const H = window.innerHeight;
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.width = Math.floor(W * DPR);
    canvas.height = Math.floor(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  // Ensure page has no margins and canvas is block-level
  document.documentElement.style.height = '100%';
  document.body.style.height = '100%';
  document.body.style.margin = '0';
  canvas.style.display = 'block';

  fitCanvas();
  window.addEventListener('resize', fitCanvas);

  // --------- Utilities ---------
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const now = () => performance.now();
  const choice = arr => arr[(Math.random() * arr.length) | 0];
  const titleFromFilename = f => f.replace(/\.[^.]+$/, '').replace(/[_-]+/g,' ').replace(/\b\w/g, c => c.toUpperCase());
  const fmtPct = n => `${(n*100).toFixed(0)}%`;

  // Persistent user settings & progress (local only)
  const store = {
    get k(){ return 'typerush-progress-v1'; },
    load(){
      try { return JSON.parse(localStorage.getItem(this.k)) ?? { sound:true, best:{}, last:{} }; }
      catch { return { sound:true, best:{}, last:{} }; }
    },
    save(d){ localStorage.setItem(this.k, JSON.stringify(d)); }
  };
  let settings = store.load();

  // --------- Audio (no external libs) ---------
  let audioCtx = null;
  function playBeep(freq=440, dur=0.08, type='sine'){
    if (!settings.sound) return;
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(0.001, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.08, audioCtx.currentTime + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur);
    o.connect(g); g.connect(audioCtx.destination);
    o.start(); o.stop(audioCtx.currentTime + dur);
  }

  // --------- Wordlist loading ---------
  async function fetchWordlists(){
    // Try PHP directory index first (if available)
    try {
      const res = await fetch('wordlists.php', {cache:'no-store'});
      if (res.ok) return await res.json();
    } catch {}
    // Fallback to static manifest
    try {
      const res = await fetch('wordlists/index.json', {cache:'no-store'});
      if (res.ok) return await res.json();
    } catch {}
    // Final fallback: embedded
    return { wordlists:[{id:'animals.txt', title:'Animals', filename:'animals.txt'}, {id:'food.txt', title:'Food', filename:'food.txt'}, {id:'local_places.txt', title:'Local Places', filename:'local_places.txt'}]};
  }
  async function loadWords(filename){
    const res = await fetch('wordlists/' + filename + '?t=' + Date.now());
    if (!res.ok) throw new Error('Failed to load wordlist ' + filename);
    const text = await res.text();
    return text.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
  }

  // --------- Game state ---------
  class Word {
    constructor(text, x, y, speed, bonus=null){
      this.text = text;
      this.x = x; this.y = y;
      this.speed = speed;
      this.typed = 0;
      this.locked = false;
      this.bonus = bonus; // null | 'slow' | 'blast' | 'x2'
      this.width = ctx.measureText(text).width;
    }
    get done(){ return this.typed >= this.text.length; }
    advance(dt, speedScale){ this.y += this.speed * dt * speedScale; }
    draw(active=false){
      const txt = this.text;
      const typed = this.typed;
      const base = active ? '#fff' : '#cfe3ff';
      ctx.font = '20px ui-sans-serif, system-ui, Segoe UI, Roboto';
      // shadow glow
      ctx.shadowColor = active ? 'rgba(79,140,255,.7)' : 'rgba(0,0,0,.4)';
      ctx.shadowBlur = active ? 12 : 4;
      // bonus tint underline
      if (this.bonus){
        ctx.fillStyle = 'rgba(255,215,0,.12)';
        ctx.fillRect(this.x - 4, this.y + 18, ctx.measureText(this.text).width + 8, 4);
      }
      // typed part
      ctx.fillStyle = '#9ecbff';
      ctx.fillText(txt.slice(0, typed), this.x, this.y);
      // remaining part
      ctx.fillStyle = base;
      ctx.fillText(txt.slice(typed), this.x + ctx.measureText(txt.slice(0, typed)).width, this.y);
      ctx.shadowBlur = 0;
    }
  }

  class Particles {
    constructor(){ this.ps = []; }
    burst(x,y,color='#7c5cff'){
      for(let i=0;i<14;i++){
        this.ps.push({x,y,vx:(Math.random()-0.5)*200, vy:(Math.random()-0.7)*220, life:0.6, t:0, color});
      }
    }
    update(dt){
      this.ps = this.ps.filter(p => p.t < p.life);
      for(const p of this.ps){
        p.t += dt;
        p.x += p.vx*dt;
        p.y += p.vy*dt + 160*dt;
      }
    }
    draw(){
      for(const p of this.ps){
        const a = 1 - p.t/p.life;
        ctx.fillStyle = `rgba(124,92,255,${a})`;
        ctx.fillRect(p.x, p.y, 3, 3);
      }
    }
  }

  const Game = {
    running:false, paused:false,
    difficulty:'beginner', mode:'classic', wordlistFile:'animals.txt', words:[], wordsAll:[],
    speedScale:1, spawnTimer:0, spawnInterval:1.6, level:1, score:0, lives:3, streak:0, multiplier:1,
    totalKeys:0, correctKeys:0, startTime:0, elapsed:0, target:null, bonusTimer:0,
    particles: new Particles(),
    slowTimeLeft:0, x2Left:0,

    setOptions({difficulty, mode, wordlist}){
      this.difficulty = difficulty; this.mode = mode; this.wordlistFile = wordlist;
    },
    reset(){
      this.words = [];
      this.speedScale = 1;
      this.spawnTimer = 0;
      this.level = 1; this.score = 0; this.lives = 3; this.streak = 0; this.multiplier = 1;
      this.totalKeys = 0; this.correctKeys = 0; this.elapsed = 0; this.startTime = now();
      this.target = null; this.slowTimeLeft = 0; this.x2Left = 0; this.bonusTimer = 0;
      this.particles = new Particles();

      // Slower spawn pacing by difficulty
      if (this.difficulty === 'beginner') this.spawnInterval = 1.8;
      else if (this.difficulty === 'normal') this.spawnInterval = 1.4;
      else this.spawnInterval = 1.1;
    },
    async loadWords(){
      this.wordsAll = await loadWords(this.wordlistFile);
      const limits = { beginner:[3,6], normal:[4,8], challenge:[5,12] }[this.difficulty];
      this.wordsAll = this.wordsAll.filter(w => w.length >= limits[0] && w.length <= limits[1]);
      if (this.wordsAll.length < 50) {
        while(this.wordsAll.length < 200) this.wordsAll = this.wordsAll.concat(this.wordsAll);
      }
    },
    spawn(){
      const txt = choice(this.wordsAll);
      const padding = 40;
      const x = padding + Math.random() * (canvas.width/DPR - padding*2);
      const y = -10;

      // Slower base speeds + gentler level ramp
      let baseSpeed = 40;              // was 65
      if (this.difficulty === 'normal') baseSpeed = 60;     // was 90
      if (this.difficulty === 'challenge') baseSpeed = 80;  // was 115
      const speed = baseSpeed + this.level * 4; // was +6

      // bonus?
      let bonus = null;
      if (Math.random() < 0.09){
        bonus = choice(['slow','blast','x2']);
      }
      const w = new Word(txt, x, y, speed, bonus);
      this.words.push(w);
    },
    onType(ch){
      if (!this.running || this.paused) return;
      this.totalKeys++;
      const letters = 'abcdefghijklmnopqrstuvwxyz-\'';
      const c = ch.toLowerCase();
      if (!letters.includes(c)) return;

      if (!this.target){
        const candidates = this.words.filter(w => w.text[0]?.toLowerCase() === c);
        if (candidates.length){
          candidates.sort((a,b) => b.y - a.y);
          this.target = candidates[0];
        }
      }
      if (!this.target){
        const any = this.words.find(w => w.text[0]?.toLowerCase() === c);
        if (any) this.target = any;
      }

      if (this.target){
        const expected = this.target.text[this.target.typed]?.toLowerCase();
        if (expected === c){
          this.target.typed++;
          this.correctKeys++;
          playBeep(520, 0.04, 'square');
          if (this.target.done){
            const base = 10 + Math.floor(this.target.text.length * 2.5);
            this.streak++;
            const streakBonus = Math.min(5, Math.floor(this.streak/5));
            const levelBonus = this.level * 2;
            const bonusMult = this.x2Left > 0 ? 2 : 1;
            const gained = Math.floor((base + levelBonus) * (1 + streakBonus*0.1) * this.multiplier * bonusMult);
            this.score += gained;
            this.particles.burst(this.target.x, this.target.y);
            if (this.target.bonus){
              if (this.target.bonus === 'slow'){ this.slowTimeLeft = 5; }
              if (this.target.bonus === 'blast'){ this.blast(); }
              if (this.target.bonus === 'x2'){ this.x2Left = 10; }
            }
            this.words = this.words.filter(w => w !== this.target);
            this.target = null;
            // gentler level up and spawn tightening
            if (this.score > this.level * 300){
              this.level++;
              this.spawnInterval = Math.max(0.75, this.spawnInterval - 0.04);
            }
          }
        } else {
          this.streak = 0;
          playBeep(200, 0.06, 'sawtooth');
        }
      }
    },
    blast(){
      const sorted = this.words.slice().sort((a,b)=>b.y-a.y).slice(0,3);
      for(const w of sorted){
        this.score += 10 + w.text.length;
      }
      this.words = this.words.filter(w => !sorted.includes(w));
      playBeep(180, 0.12, 'triangle');
    },
    update(dt){
      this.elapsed += dt;
      if (this.slowTimeLeft > 0){ this.slowTimeLeft -= dt; }
      if (this.x2Left > 0){ this.x2Left -= dt; }

      // spawn
      this.spawnTimer += dt;
      if (this.spawnTimer >= this.spawnInterval){
        this.spawnTimer = 0;
        this.spawn();
      }
      // advance words
      const speedMod = this.slowTimeLeft > 0 ? 0.55 : 1.0;
      for (const w of this.words){
        w.advance(dt, speedMod);
      }
      // bottom check
      const H = canvas.height/DPR;
      const missed = this.words.filter(w => w.y > H - 16);
      if (missed.length){
        this.lives -= missed.length;
        this.words = this.words.filter(w => w.y <= H - 16);
        this.target = null;
        this.streak = 0;
        playBeep(110, 0.15, 'sine');
        if (this.lives <= 0){ this.gameOver(); }
      }

      this.particles.update(dt);
    },
    draw(){
      const W = canvas.width/DPR, H = canvas.height/DPR;
      const grd = ctx.createLinearGradient(0,0,0,H);
      grd.addColorStop(0,'#0b1426'); grd.addColorStop(1,'#0a1020');
      ctx.fillStyle = grd; ctx.fillRect(0,0,W,H);

      // HUD
      ctx.fillStyle = '#a6b0c8'; ctx.font = '14px ui-sans-serif, system-ui';
      ctx.fillText(`Score: ${this.score}`, 16, 24);
      const acc = this.totalKeys ? (this.correctKeys/this.totalKeys) : 0;
      const minutes = Math.max(1e-6, this.elapsed/60);
      const wpm = (this.correctKeys/5)/minutes;
      ctx.fillText(`Level: ${this.level}`, 16, 44);
      ctx.fillText(`Lives: ${'❤'.repeat(this.lives)}`, 16, 64);
      ctx.fillText(`WPM: ${wpm.toFixed(0)}  Acc: ${fmtPct(acc)}`, 16, 84);
      if (this.slowTimeLeft > 0){
        ctx.fillStyle = '#facc15'; ctx.fillText(`Slow: ${this.slowTimeLeft.toFixed(1)}s`, W-160, 24);
      }
      if (this.x2Left > 0){
        ctx.fillStyle = '#22c55e'; ctx.fillText(`x2: ${this.x2Left.toFixed(1)}s`, W-80, 24);
      }

      for (const w of this.words){
        w.draw(w === this.target);
      }
      this.particles.draw();
    },
    async start(){
      this.reset();
      await this.loadWords();
      hideOverlay('menu'); hideOverlay('gameover'); hideOverlay('tutorial');
      this.running = true; this.paused = false;
      loop();
    },
    pause(){ if (!this.running) return; this.paused = true; showOverlay('pause'); },
    resume(){ if (!this.running) return; this.paused = false; hideOverlay('pause'); },
    gameOver(){
      this.running = false;
      const minutes = Math.max(1e-6, this.elapsed/60);
      const wpm = (this.correctKeys/5)/minutes;
      const acc = this.totalKeys ? (this.correctKeys/this.totalKeys) : 0;
      const stats = {
        score:this.score, level:this.level, wpm:Math.round(wpm), acc, difficulty:this.difficulty, wordlist:this.wordlistFile, mode:this.mode,
        date:new Date().toISOString()
      };
      const key = `${this.difficulty}|${this.wordlistFile}|${this.mode}`;
      settings.best[key] = Math.max(settings.best[key]||0, this.score);
      settings.last = { name: settings.last?.name || '' };
      store.save(settings);

      const statsDiv = document.getElementById('stats');
      statsDiv.innerHTML = `
        <p><strong>Score:</strong> ${stats.score} &nbsp; <strong>Level:</strong> ${stats.level}</p>
        <p><strong>WPM:</strong> ${stats.wpm} &nbsp; <strong>Accuracy:</strong> ${fmtPct(stats.acc)}</p>
        <p class="muted small">Diff: ${stats.difficulty} &middot; List: ${titleFromFilename(stats.wordlist)} &middot; Mode: ${stats.mode}</p>
      `;
      showOverlay('gameover');

      // No leaderboard submission; just show stats and allow retry/exit.
    }
  };

  // --------- Main loop ---------
  let last = now();
  function loop(){
    if (!Game.running) return;
    const t = now();
    const dt = Math.min(0.033, (t - last)/1000);
    last = t;
    if (!Game.paused){
      Game.update(dt);
      Game.draw();
    }
    requestAnimationFrame(loop);
  }

  // --------- Input ---------
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape'){
      if (Game.paused) Game.resume(); else Game.pause();
      return;
    }
    if (/^[a-zA-Z\-']$/.test(e.key)){
      Game.onType(e.key);
      e.preventDefault();
    }
  }, {capture:true});

  // --------- UI wiring ---------
  const $ = sel => document.querySelector(sel);
  const $$ = sel => Array.from(document.querySelectorAll(sel));
  function showOverlay(id){ document.getElementById(id).classList.add('show'); }
  function hideOverlay(id){ document.getElementById(id).classList.remove('show'); }
  function getSelected(name){
    const el = document.querySelector(`input[name="${name}"]:checked`);
    return el ? el.value : null;
  }

  async function populateWordlists(){
    const listsSel = $('#wordlist');
    listsSel.innerHTML = '';
    const data = await fetchWordlists();
    const lists = data.wordlists || [];
    lists.forEach(w => {
      const opt = document.createElement('option');
      opt.value = w.filename || w.id;
      opt.textContent = w.title || titleFromFilename(w.filename || w.id);
      listsSel.appendChild(opt);
    });
    if (settings.last?.wordlist){
      listsSel.value = settings.last.wordlist;
    }
  }

  // Menu buttons
  $('#btn-start').addEventListener('click', async () => {
    const difficulty = getSelected('difficulty');
    const mode = getSelected('mode');
    const wordlist = $('#wordlist').value;
    settings.last = { ...settings.last, difficulty, mode, wordlist };
    store.save(settings);
    Game.setOptions({difficulty, mode, wordlist});
    await Game.start();
  });

  $('#btn-tutorial').addEventListener('click', () => showOverlay('tutorial'));
  $('#btn-tutorial-close').addEventListener('click', () => hideOverlay('tutorial'));
  // Removed leaderboard buttons & handlers
  $('#btn-menu').addEventListener('click', () => { showOverlay('menu'); Game.paused = true; });
  $('#btn-resume').addEventListener('click', () => Game.resume());
  $('#btn-exit').addEventListener('click', () => { hideOverlay('pause'); showOverlay('menu'); Game.running=false; });
  $('#btn-exit-over').addEventListener('click', () => { hideOverlay('gameover'); showOverlay('menu'); });
  $('#btn-retry').addEventListener('click', () => { hideOverlay('gameover'); Game.start(); });
  $('#btn-reload-wordlists').addEventListener('click', populateWordlists);

  $('#toggle-sound').checked = settings.sound;
  $('#toggle-sound').addEventListener('change', (e) => { settings.sound = !!e.target.checked; store.save(settings); });

  // preload lists on load & open menu
  populateWordlists();
  showOverlay('menu');
})();
