/* ============================================================
   Happy Birthday Sanjana — multi-page interactive experience
   ============================================================ */

const HER_NAME = "Sanjana";

const state = {
  soundOn: false,
  audioCtx: null,
  ambientNodes: null,
  currentPage: 0,
  games: { hearts:false, memory:false, quiz:false },
  heartsFound: 0,
  heartsNeeded: 6,
  letterUnlocked: false,
};

const PAGES = [
  { id:"cover",   label:"Cover",    icon:"📖" },
  { id:"gallery", label:"Gallery",  icon:"🎞️" },
  { id:"arcade",  label:"Arcade",   icon:"🎮" },
  { id:"letter",  label:"Letter",   icon:"💌" },
  { id:"fun",     label:"Just Because", icon:"🎈" },
  { id:"finale",  label:"Forever",  icon:"✨" },
];

const GAMES_REQUIRED = 2; // out of 3, to unlock the letter

const REASONS = [
  "You laugh with your whole body, and it makes everyone around you laugh too.",
  "You remember the small things — the things people mention once and forget they said.",
  "You've never once made me feel like 'cousin' meant anything less than 'sister'.",
  "You're stubborn in exactly the way that means you never give up on the people you love.",
  "You make ordinary days feel like they matter.",
  "You are, without question, the best sister anyone could ask for.",
];

const COMPLIMENTS = [
  "You make every room lighter just by walking into it.",
  "Your laugh is genuinely one of my favorite sounds in the world.",
  "You are so much stronger than you give yourself credit for.",
  "The world got lucky the day you showed up in it.",
  "You have the kind of heart that makes people feel safe.",
  "You're not just family — you're one of my favorite people, full stop.",
  "Anyone who knows you is better for it.",
  "You carry so much love for the people around you. It shows.",
  "You make hard days easier just by being there.",
  "Sanjana, you are so deeply, endlessly loved.",
];

const LETTER_TEXT = "You're always going to be my little sister — cousin or not. I love you so much, my darling. You're the best sister anyone could ask for, and the sister I've always wanted.";

const MEMORY_CAPTIONS = [
  "Remember this day?", "One of my favorites.", "You were so proud of this one.",
  "We laughed so hard that day.", "Still can't believe we did this.", "This one lives in my heart.",
  "The best kind of chaos.", "You + me, always.", "A completely ordinary, perfect day.",
  "This face. Every time.", "I'll never forget this one.", "Ten out of ten memory.",
  "This is basically us in one photo.", "My favorite person, honestly.",
];
const GALLERY_COUNT = 14;

/* ---------- Real photo path helper ----------
   Expects an /assets folder next to index.html with photo1.jpeg ... photo14.jpeg
   (idx is 0-based internally, filenames are 1-based) */
function photoSrc(idx){
  return `assets/photo${idx+1}.jpeg`;
}

function shuffle(arr){
  const a = [...arr];
  for(let i=a.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [a[i],a[j]] = [a[j],a[i]];
  }
  return a;
}

/* ============================================================
   ROUTER
   ============================================================ */
function goToPage(id, opts={}){
  const idx = PAGES.findIndex(p => p.id === id);
  if(idx === -1) return;
  const direction = opts.direction || (idx >= state.currentPage ? "forward" : "back");
  const prevEl = document.querySelector(".page.active");
  const nextEl = document.getElementById(`page-${id}`);
  if(nextEl === prevEl) return;

  state.currentPage = idx;
  updateNav();
  updateArrows();
  if(location.hash !== `#${id}`) history.pushState({page:id}, "", `#${id}`);

  const xOut = direction === "forward" ? -60 : 60;
  const xIn = direction === "forward" ? 60 : -60;

  if(prevEl){
    gsap.to(prevEl, { opacity:0, x:xOut, duration:0.35, ease:"power2.in", onComplete:() => {
      prevEl.classList.remove("active");
      prevEl.style.transform = "";
    }});
  }
  nextEl.classList.add("active");
  gsap.fromTo(nextEl, { opacity:0, x:xIn }, { opacity:1, x:0, duration:0.5, ease:"power2.out", delay:0.12 });

  // page-specific entrance animations
  const enterFn = PAGE_ENTER_ANIMATIONS[id];
  if(enterFn) setTimeout(enterFn, 150);
}

function updateNav(){
  document.querySelectorAll(".nav-btn").forEach((btn,i) => {
    btn.classList.toggle("active", i === state.currentPage);
  });
}
function updateArrows(){
  document.getElementById("arrow-prev").disabled = state.currentPage === 0;
  document.getElementById("arrow-next").disabled = state.currentPage === PAGES.length - 1;
}

function renderNav(){
  const inner = document.querySelector("#top-nav .nav-inner");
  inner.innerHTML = PAGES.map((p,i) => `
    <button class="nav-btn" data-id="${p.id}">
      <span class="stamp">${p.icon}</span><span class="lbl">${p.label}</span>
    </button>
  `).join("");
  inner.querySelectorAll(".nav-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      playClick();
      const targetId = btn.dataset.id;
      if(targetId === "letter" && !state.letterUnlocked){
        shakeElement(btn);
        return;
      }
      goToPage(targetId);
    });
  });
}

function shakeElement(el){
  gsap.fromTo(el, { x:0 }, { x:6, duration:0.06, repeat:5, yoyo:true, ease:"none", onComplete:() => gsap.set(el,{x:0}) });
}

document.getElementById("arrow-prev").addEventListener("click", () => {
  playClick();
  if(state.currentPage > 0) attemptGoToIndex(state.currentPage - 1, "back");
});
document.getElementById("arrow-next").addEventListener("click", () => {
  playClick();
  if(state.currentPage < PAGES.length - 1) attemptGoToIndex(state.currentPage + 1, "forward");
});
function attemptGoToIndex(idx, direction){
  const target = PAGES[idx];
  if(target.id === "letter" && !state.letterUnlocked){
    // skip past locked letter automatically in linear navigation
    idx = direction === "forward" ? idx + 1 : idx - 1;
    if(idx < 0 || idx >= PAGES.length) return;
  }
  goToPage(PAGES[idx].id, { direction });
}

window.addEventListener("keydown", (e) => {
  if(e.key === "ArrowRight" && state.currentPage < PAGES.length-1) attemptGoToIndex(state.currentPage+1,"forward");
  if(e.key === "ArrowLeft" && state.currentPage > 0) attemptGoToIndex(state.currentPage-1,"back");
});

window.addEventListener("popstate", () => {
  const id = location.hash.replace("#","") || "cover";
  if(PAGES.some(p=>p.id===id)) goToPage(id);
});

/* ============================================================
   PAGE — COVER
   ============================================================ */
function renderCover(){
  return `
  <div class="page" id="page-cover" style="background:transparent;">
    <div class="page-inner" style="z-index:5;">
      <span class="eyebrow">A little something for you</span>
      <h1 class="display" id="cover-title" style="font-size:clamp(2.6rem, 8vw, 5.2rem); font-weight:700; color:var(--plum); line-height:1.05; margin-bottom:22px;">
        Happy Birthday<br/><span style="color:var(--blush-deep); font-style:italic; font-weight:500;">${HER_NAME}</span>
      </h1>
      <p class="handwritten" id="cover-sub" style="font-size:clamp(1.3rem,3vw,1.7rem); color:var(--plum-soft); max-width:560px; margin:0 auto 40px; line-height:1.5;">
        You're always going to be my little sister — cousin or not. I love you so much, my darling.
      </p>
      <button class="btn" id="start-btn">✨ Start the Surprise</button>
      <p style="margin-top:20px; font-size:0.8rem; color:var(--plum-soft); opacity:0.7;">a chapter at a time — use the arrows or the menu above</p>
    </div>
  </div>`;
}

function initCover(){
  document.getElementById("start-btn").addEventListener("click", () => {
    playClick();
    if(!state.soundOn) toggleSound(true);
    attemptGoToIndex(1, "forward");
  });
  playCoverEnter();
}

function playCoverEnter(){
  gsap.from("#cover-title", { opacity:0, y:30, duration:1, ease:"power3.out", delay:0.1 });
  gsap.from("#cover-sub", { opacity:0, y:20, duration:1, ease:"power3.out", delay:0.35 });
  gsap.from("#start-btn", { opacity:0, y:20, duration:0.9, ease:"power3.out", delay:0.6 });
}

const globalKeyframes = document.createElement("style");
globalKeyframes.textContent = `
  @keyframes twinkle{ 0%,100%{opacity:0.2;} 50%{opacity:0.9;} }
`;
document.head.appendChild(globalKeyframes);

/* ============================================================
   PAGE — GALLERY (waterfall carousel)
   ============================================================ */
const waterfallState = { playing:true, columnCount:4 };

function renderGallery(){
  const cols = buildWaterfallColumns(waterfallState.columnCount);
  // Speed per column, in seconds for one full loop — LOWER = FASTER.
  // Edit these numbers directly to play with each column's speed.
  const COLUMN_SPEEDS = [24, 24, 20, 20];

  const colsHTML = cols.map((colPhotos, colIdx) => {
    const dir = colIdx % 2 === 0 ? "down" : "up";
    const speed = COLUMN_SPEEDS[colIdx] ?? 28;
    const photosHTML = colPhotos.map(idx => `
      <div class="wf-photo" data-idx="${idx}">
        <img src="${photoSrc(idx)}" alt="Memory ${idx+1}" loading="lazy"/>
        <div class="cap">${MEMORY_CAPTIONS[idx]}</div>
      </div>`).join("");
    // duplicate the set so the loop is seamless
    return `
      <div class="waterfall-col" data-dir="${dir}">
        <div class="waterfall-track" style="animation-duration:${speed}s;">
          ${photosHTML}
          ${photosHTML}
        </div>
      </div>`;
  }).join("");

  return `
  <div class="page" id="page-gallery" style="background:transparent;">
    <div class="page-inner" style="max-width:860px;">
      <span class="eyebrow">Memory Lane</span>
      <h2 class="display" style="font-size:clamp(2rem,5vw,3rem); margin-bottom:8px;">A little waterfall of us</h2>
      <p style="color:var(--plum-soft); margin-bottom:16px;">Hover a column to pause it. Click any photo to look closer.</p>
      <div id="waterfall-stage">${colsHTML}</div>
      <div class="rolodex-controls">
        <button class="rolodex-round-btn" id="waterfall-toggle">⏸</button>
      </div>
    </div>
  </div>`;
}

function buildWaterfallColumns(colCount){
  // distribute GALLERY_COUNT photo indices across colCount columns
  const indices = Array.from({length:GALLERY_COUNT}, (_,i) => i);
  const cols = Array.from({length:colCount}, () => []);
  indices.forEach((idx, i) => cols[i % colCount].push(idx));
  // ensure every column has at least 3 photos for a convincing loop
  cols.forEach(col => {
    while(col.length < 3){
      col.push(col[col.length % Math.max(col.length,1)] ?? indices[0]);
    }
  });
  return cols;
}

function initGallery(){
  document.querySelectorAll(".wf-photo").forEach(photo => {
    photo.addEventListener("click", () => {
      playClick();
      openLightbox(+photo.dataset.idx);
    });
  });

  const toggleBtn = document.getElementById("waterfall-toggle");
  toggleBtn.addEventListener("click", () => {
    playClick();
    waterfallState.playing = !waterfallState.playing;
    toggleBtn.textContent = waterfallState.playing ? "⏸" : "▶";
    document.querySelectorAll(".waterfall-track").forEach(track => {
      track.classList.toggle("paused-all", !waterfallState.playing);
    });
  });
}

function openLightbox(idx){
  const lb = document.getElementById("lightbox");
  document.getElementById("lightbox-img").src = photoSrc(idx);
  document.getElementById("lightbox-caption").textContent = MEMORY_CAPTIONS[idx];
  lb.style.display = "flex";
  gsap.fromTo(lb.querySelector(".box"), { scale:0.85, opacity:0 }, { scale:1, opacity:1, duration:0.4, ease:"back.out(1.6)" });
}
document.getElementById("lightbox-close").addEventListener("click", () => {
  playClick();
  document.getElementById("lightbox").style.display = "none";
});
document.getElementById("lightbox").addEventListener("click", (e) => {
  if(e.target.id === "lightbox") document.getElementById("lightbox").style.display = "none";
});

/* ============================================================
   PAGE — ARCADE HUB
   ============================================================ */
function renderArcade(){
  return `
  <div class="page" id="page-arcade" style="background:transparent;">
    <div class="page-inner" style="max-width:820px;">
      <span class="eyebrow">The Arcade</span>
      <h2 class="display" style="font-size:clamp(2rem,5vw,3rem); margin-bottom:8px;">Play your way to the letter</h2>
      <p style="color:var(--plum-soft);">Win ${GAMES_REQUIRED} of 3 games to unlock Chapter Four.</p>
      <div class="passport-track" id="passport-track"></div>

      <div class="arcade-grid">
        <div class="arcade-card" id="card-hearts" data-target="game-hearts">
          <div class="done-badge">✓ done</div>
          <div class="icon">💗</div>
          <h3 class="display" style="font-size:1.15rem;">Hidden Hearts</h3>
          <p style="font-size:0.85rem; color:var(--plum-soft); margin-top:6px;">Find all 6 hearts before the timer runs out.</p>
        </div>
        <div class="arcade-card" id="card-memory" data-target="game-memory">
          <div class="done-badge">✓ done</div>
          <div class="icon">🃏</div>
          <h3 class="display" style="font-size:1.15rem;">Memory Match</h3>
          <p style="font-size:0.85rem; color:var(--plum-soft); margin-top:6px;">Flip cards, find every pair.</p>
        </div>
        <div class="arcade-card" id="card-quiz" data-target="game-quiz">
          <div class="done-badge">✓ done</div>
          <div class="icon">💫</div>
          <h3 class="display" style="font-size:1.15rem;">The Appreciation Quiz</h3>
          <p style="font-size:0.85rem; color:var(--plum-soft); margin-top:6px;">A very biased quiz about how loved you are.</p>
        </div>
      </div>
    </div>
  </div>

  <div class="page" id="page-game-hearts" style="background:transparent;">
    <div class="page-inner" style="max-width:640px;">
      <button class="btn secondary" data-back-to="arcade" style="margin-bottom:20px; padding:8px 20px; font-size:0.8rem;">← back to arcade</button>
      <h2 class="display" style="font-size:clamp(1.7rem,4vw,2.4rem); margin-bottom:6px;">Hidden Hearts</h2>
      <p style="color:var(--plum-soft); margin-bottom:6px;" id="hearts-progress">0 / 6 found · <span id="hearts-timer">30s</span></p>
      <div id="hearts-scene"></div>
      <div id="hearts-result" style="margin-top:22px; display:none;">
        <div class="display" style="font-size:1.4rem; color:var(--blush-deep); margin-bottom:14px;" id="hearts-result-text"></div>
        <button class="btn" data-back-to="arcade">Back to arcade →</button>
      </div>
    </div>
  </div>

  <div class="page" id="page-game-memory" style="background:transparent;">
    <div class="page-inner" style="max-width:520px;">
      <button class="btn secondary" data-back-to="arcade" style="margin-bottom:20px; padding:8px 20px; font-size:0.8rem;">← back to arcade</button>
      <h2 class="display" style="font-size:clamp(1.7rem,4vw,2.4rem); margin-bottom:6px;">Memory Match</h2>
      <p style="color:var(--plum-soft); margin-bottom:20px;" id="mm-progress">0 pairs · 0 moves</p>
      <div id="memory-match-grid"></div>
      <div id="mm-result" style="margin-top:22px; display:none;">
        <div class="display" style="font-size:1.4rem; color:var(--blush-deep); margin-bottom:14px;">🎉 All matched!</div>
        <button class="btn" data-back-to="arcade">Back to arcade →</button>
      </div>
    </div>
  </div>

  <div class="page" id="page-game-quiz" style="background:transparent;">
    <div class="page-inner" style="max-width:560px;">
      <button class="btn secondary" data-back-to="arcade" style="margin-bottom:20px; padding:8px 20px; font-size:0.8rem;">← back to arcade</button>
      <h2 class="display" style="font-size:clamp(1.7rem,4vw,2.4rem); margin-bottom:16px;">The Appreciation Quiz</h2>
      <div id="quiz-progress-bar"><div id="quiz-progress-fill"></div></div>
      <div id="quiz-card"></div>
    </div>
  </div>
  `;
}

function initArcade(){
  document.querySelectorAll(".arcade-card").forEach(card => {
    card.addEventListener("click", () => {
      playClick();
      showSubpage(card.dataset.target);
    });
  });
  document.querySelectorAll("[data-back-to]").forEach(btn => {
    btn.addEventListener("click", () => {
      playClick();
      showSubpage(`arcade`, true);
    });
  });
  refreshArcadeUI();
}

// arcade sub-pages are not part of PAGES[] top nav; manage manually
function showSubpage(id, isArcadeRoot=false){
  document.querySelectorAll("#page-arcade, #page-game-hearts, #page-game-memory, #page-game-quiz").forEach(p => {
    p.classList.remove("active");
  });
  const target = isArcadeRoot ? document.getElementById("page-arcade") : document.getElementById(`page-${id}`);
  target.classList.add("active");
  gsap.fromTo(target, { opacity:0, y:16 }, { opacity:1, y:0, duration:0.4, ease:"power2.out" });

  if(target.id === "page-game-hearts") startHeartsGame();
  if(target.id === "page-game-memory") startMemoryGame();
  if(target.id === "page-game-quiz") startQuiz();
  if(target.id === "page-arcade") refreshArcadeUI();
}

function refreshArcadeUI(){
  document.getElementById("card-hearts").classList.toggle("completed", state.games.hearts);
  document.getElementById("card-memory").classList.toggle("completed", state.games.memory);
  document.getElementById("card-quiz").classList.toggle("completed", state.games.quiz);

  const doneCount = Object.values(state.games).filter(Boolean).length;
  const track = document.getElementById("passport-track");
  track.innerHTML = `
    <span class="passport-stamp ${state.games.hearts?'done':''}">💗 Hearts</span>
    <span class="passport-stamp ${state.games.memory?'done':''}">🃏 Memory</span>
    <span class="passport-stamp ${state.games.quiz?'done':''}">💫 Quiz</span>
  `;

  if(doneCount >= GAMES_REQUIRED && !state.letterUnlocked){
    state.letterUnlocked = true;
    fireConfetti();
    playSuccess();
    setTimeout(() => {
      const letterBtn = document.querySelector('.nav-btn[data-id="letter"]');
      if(letterBtn) gsap.fromTo(letterBtn, { scale:1 }, { scale:1.15, duration:0.3, yoyo:true, repeat:3, ease:"power1.inOut" });
    }, 400);
  }
}

function checkGameUnlockAfterUpdate(){
  refreshArcadeUI();
}

/* ============================================================
   GAME 1 — HIDDEN HEARTS (timed)
   ============================================================ */
const heartsGameState = { found:0, timer:30, interval:null, active:false };

function startHeartsGame(){
  const scene = document.getElementById("hearts-scene");
  const spots = [
    {x:12,y:22},{x:78,y:15},{x:45,y:60},{x:88,y:70},{x:20,y:78},{x:60,y:38}
  ];
  scene.innerHTML = spots.map((h,i) => `<div class="hidden-heart" data-idx="${i}" style="left:${h.x}%; top:${h.y}%;">💗</div>`).join("")
    + `<div style="position:absolute; inset:0; background:radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4), transparent 60%); pointer-events:none;"></div>`;

  document.getElementById("hearts-result").style.display = "none";
  heartsGameState.found = 0;
  heartsGameState.timer = 30;
  heartsGameState.active = true;
  document.getElementById("hearts-progress").innerHTML = `0 / 6 found · <span id="hearts-timer">30s</span>`;

  clearInterval(heartsGameState.interval);
  heartsGameState.interval = setInterval(() => {
    heartsGameState.timer--;
    const timerEl = document.getElementById("hearts-timer");
    if(timerEl) timerEl.textContent = `${heartsGameState.timer}s`;
    if(heartsGameState.timer <= 0){
      endHeartsGame(false);
    }
  }, 1000);

  scene.querySelectorAll(".hidden-heart").forEach(h => {
    h.addEventListener("click", () => {
      if(!heartsGameState.active || h.classList.contains("found")) return;
      h.classList.add("found");
      h.style.opacity = "1";
      gsap.fromTo(h, { scale:0.5 }, { scale:1.4, duration:0.4, ease:"back.out(2)", yoyo:true, repeat:1 });
      heartsGameState.found++;
      document.getElementById("hearts-progress").innerHTML = `${heartsGameState.found} / 6 found · <span id="hearts-timer">${heartsGameState.timer}s</span>`;
      playPop();
      if(heartsGameState.found >= 6) endHeartsGame(true);
    });
    h.addEventListener("mouseenter", () => { if(!h.classList.contains("found")) h.style.opacity = "0.35"; });
    h.addEventListener("mouseleave", () => { if(!h.classList.contains("found")) h.style.opacity = "0.16"; });
  });
}

function endHeartsGame(won){
  heartsGameState.active = false;
  clearInterval(heartsGameState.interval);
  document.getElementById("hearts-result").style.display = "block";
  const resultText = document.getElementById("hearts-result-text");
  if(won){
    resultText.textContent = "🎉 Found them all! Secret unlocked.";
    state.games.hearts = true;
    fireConfetti();
    playSuccess();
  } else {
    resultText.textContent = `Time's up — found ${heartsGameState.found}/6. Want to try again?`;
    const retryBtn = document.createElement("button");
    retryBtn.className = "btn secondary";
    retryBtn.style.cssText = "margin-right:10px;";
    retryBtn.textContent = "Try again";
    retryBtn.addEventListener("click", () => { playClick(); startHeartsGame(); });
    resultText.insertAdjacentElement("afterend", retryBtn);
  }
  checkGameUnlockAfterUpdate();
}

/* ============================================================
   GAME 2 — MEMORY MATCH
   ============================================================ */
const mmState = { first:null, second:null, matches:0, moves:0, lock:false };
const MM_SYMBOLS = ["💗","⭐","🎂","🎈","🌸","🎁"];

function startMemoryGame(){
  const grid = document.getElementById("memory-match-grid");
  const deck = shuffle([...MM_SYMBOLS, ...MM_SYMBOLS]);
  mmState.first = null; mmState.second = null; mmState.matches = 0; mmState.moves = 0; mmState.lock = false;
  document.getElementById("mm-progress").textContent = "0 pairs · 0 moves";
  document.getElementById("mm-result").style.display = "none";

  grid.innerHTML = deck.map((sym,i) => `
    <div class="mm-card" data-idx="${i}" data-symbol="${sym}">
      <div class="mm-card-inner">
        <div class="mm-face mm-front">?</div>
        <div class="mm-face mm-back">${sym}</div>
      </div>
    </div>`).join("");

  grid.querySelectorAll(".mm-card").forEach(card => {
    card.addEventListener("click", () => onMMCardClick(card));
  });
}

function onMMCardClick(card){
  if(mmState.lock) return;
  if(card.classList.contains("flipped") || card.classList.contains("matched")) return;
  card.classList.add("flipped");
  playClick();

  if(!mmState.first){
    mmState.first = card;
    return;
  }
  mmState.second = card;
  mmState.lock = true;
  mmState.moves++;

  const match = mmState.first.dataset.symbol === mmState.second.dataset.symbol;
  setTimeout(() => {
    if(match){
      mmState.first.classList.add("matched");
      mmState.second.classList.add("matched");
      mmState.matches++;
      playPop();
      if(mmState.matches === MM_SYMBOLS.length) endMemoryGame();
    } else {
      mmState.first.classList.remove("flipped");
      mmState.second.classList.remove("flipped");
    }
    document.getElementById("mm-progress").textContent = `${mmState.matches} pairs · ${mmState.moves} moves`;
    mmState.first = null; mmState.second = null; mmState.lock = false;
  }, match ? 500 : 800);
}

function endMemoryGame(){
  document.getElementById("mm-result").style.display = "block";
  state.games.memory = true;
  fireConfetti();
  playSuccess();
  checkGameUnlockAfterUpdate();
}

/* ============================================================
   GAME 3 — THE APPRECIATION QUIZ
   ============================================================ */
const QUIZ_QUESTIONS = [
  { q:"How much do you mean to your sibling?", options:["A lot","So much","Immeasurably","All of the above"], correct:3 },
  { q:"What's the correct amount of love headed your way today?", options:["Some","Plenty","An amount that can't be measured","See previous answer"], correct:2 },
  { q:"True or false: cousin or not, you're still the best sister around.", options:["True","Extremely true","Obviously true","All equally correct"], correct:3 },
  { q:"How proud is your sibling of you, generally?", options:["Very","Constantly","Annoyingly so","Yes"], correct:1 },
];

const quizState = { i:0, done:false };

function startQuiz(){
  quizState.i = 0; quizState.done = false;
  renderQuizQuestion();
}

function renderQuizQuestion(){
  const q = QUIZ_QUESTIONS[quizState.i];
  document.getElementById("quiz-progress-fill").style.width = `${(quizState.i/QUIZ_QUESTIONS.length)*100}%`;
  const card = document.getElementById("quiz-card");
  card.innerHTML = `
    <p class="handwritten" style="font-size:1.5rem; margin-bottom:6px;">${q.q}</p>
    <div id="quiz-options"></div>
  `;
  const optsWrap = document.getElementById("quiz-options");
  q.options.forEach((opt,i) => {
    const b = document.createElement("button");
    b.className = "quiz-option";
    b.textContent = opt;
    b.addEventListener("click", () => onQuizAnswer(b, i === q.correct));
    optsWrap.appendChild(b);
  });
  gsap.from(card, { opacity:0, y:14, duration:0.4, ease:"power2.out" });
}

function onQuizAnswer(btn, isCorrect){
  document.querySelectorAll(".quiz-option").forEach(o => o.style.pointerEvents = "none");
  btn.classList.add("picked");
  playPop();
  setTimeout(() => {
    quizState.i++;
    if(quizState.i >= QUIZ_QUESTIONS.length){
      finishQuiz();
    } else {
      renderQuizQuestion();
    }
  }, 550);
}

function finishQuiz(){
  document.getElementById("quiz-progress-fill").style.width = `100%`;
  const card = document.getElementById("quiz-card");
  card.innerHTML = `
    <div class="display" style="font-size:1.5rem; color:var(--blush-deep); margin-bottom:14px;">💫 Perfect score. Obviously.</div>
    <p style="color:var(--plum-soft); margin-bottom:20px;">There was never really a wrong answer — you're loved no matter what you picked.</p>
    <button class="btn secondary" data-back-to="arcade">Back to arcade →</button>
  `;
  card.querySelector("[data-back-to]").addEventListener("click", () => { playClick(); showSubpage("arcade", true); });
  state.games.quiz = true;
  fireConfetti();
  playSuccess();
  checkGameUnlockAfterUpdate();
}

/* ============================================================
   PAGE — LETTER
   ============================================================ */
function renderLetter(){
  let reasonsHTML = REASONS.map((r,i) => `
    <li class="reason-item" style="opacity:0; text-align:left; padding:14px 18px; background:white; border-radius:14px; box-shadow:0 6px 18px rgba(74,47,92,0.08); margin-bottom:12px; list-style:none; display:flex; gap:12px;">
      <span style="color:var(--blush-deep); font-weight:700;">${i+1}.</span><span>${r}</span>
    </li>`).join("");

  return `
  <div class="page" id="page-letter" style="background:transparent;">
    <div class="page-inner" style="max-width:640px;">
      <span class="eyebrow">Chapter Four</span>
      <h2 class="display" style="font-size:clamp(2rem,5vw,3rem); margin-bottom:26px;">The Letter</h2>
      <div style="background:white; border-radius:24px; padding:40px 30px; box-shadow:var(--shadow-soft); text-align:left;">
        <p class="handwritten" id="typed-letter" style="font-size:clamp(1.3rem,3vw,1.6rem); line-height:1.6; color:var(--plum); min-height:170px;"></p>
      </div>
      <h3 class="display" style="font-size:1.3rem; margin:38px 0 18px;">Reasons you're amazing</h3>
      <ul id="reasons-list" style="padding:0;">${reasonsHTML}</ul>
      <button class="btn" id="letter-continue-btn" style="margin-top:14px;">Keep going →</button>
    </div>
  </div>`;
}

function initLetterPage(){
  document.getElementById("letter-continue-btn").addEventListener("click", () => {
    playClick();
    attemptGoToIndex(4, "forward");
  });
}

function playLetterEnter(){
  const target = document.getElementById("typed-letter");
  target.textContent = "";
  let i = 0;
  clearInterval(target._typer);
  target._typer = setInterval(() => {
    target.textContent += LETTER_TEXT[i];
    i++;
    if(i >= LETTER_TEXT.length) clearInterval(target._typer);
  }, 26);
  gsap.set(".reason-item", { y:14, opacity:0 });
  gsap.to(".reason-item", { opacity:1, y:0, duration:0.55, stagger:0.16, ease:"power2.out", delay: LETTER_TEXT.length*0.026+0.3 });
}

/* ============================================================
   PAGE — JUST BECAUSE (fun interactive)
   ============================================================ */
function renderFun(){
  const balloonColors = ["var(--blush-deep)","var(--lavender-deep)","var(--sky-deep)","var(--gold)"];
  let balloonHTML = "";
  for(let i=0;i<8;i++){
    balloonHTML += `<div class="balloon" data-idx="${i}" style="background:${balloonColors[i%4]};">
      <div style="position:absolute; bottom:-14px; left:50%; width:2px; height:14px; background:var(--plum-soft); transform:translateX(-50%);"></div>
    </div>`;
  }
  return `
  <div class="page" id="page-fun" style="background:transparent;">
    <div class="page-inner" style="max-width:700px;">
      <span class="eyebrow">Chapter Five</span>
      <h2 class="display" style="font-size:clamp(2rem,5vw,3rem); margin-bottom:8px;">Just Because</h2>
      <p style="color:var(--plum-soft); margin-bottom:36px;">No reason. Just a little more you-deserve-this energy.</p>
      <button class="btn" id="compliment-btn" style="margin-bottom:16px;">Give me a compliment</button>
      <p id="compliment-text" class="handwritten" style="font-size:1.5rem; min-height:56px; color:var(--blush-deep); max-width:520px; margin:0 auto 44px;"></p>
      <p style="font-size:0.85rem; color:var(--plum-soft); margin-bottom:14px;">pop a balloon</p>
      <div id="balloon-row" style="display:flex; justify-content:center; gap:16px; flex-wrap:wrap; margin-bottom:44px;">${balloonHTML}</div>
      <button class="btn" id="to-finale-btn">One last thing →</button>
    </div>
  </div>`;
}

function initFunPage(){
  const btn = document.getElementById("compliment-btn");
  const text = document.getElementById("compliment-text");
  let lastIdx = -1;
  btn.addEventListener("click", () => {
    playPop();
    gsap.to(text, { opacity:0, duration:0.15, onComplete:() => {
      let idx; do{ idx = Math.floor(Math.random()*COMPLIMENTS.length); } while(idx===lastIdx);
      lastIdx = idx; text.textContent = COMPLIMENTS[idx];
      gsap.to(text, { opacity:1, duration:0.35 });
    }});
    gsap.fromTo(btn, { scale:0.95 }, { scale:1, duration:0.3, ease:"back.out(3)" });
  });

  document.querySelectorAll(".balloon").forEach(b => {
    b.addEventListener("click", () => {
      if(b.classList.contains("popped")) return;
      b.classList.add("popped");
      playPop();
      gsap.to(b, { scale:1.4, opacity:0, duration:0.25, ease:"power1.in", onComplete:() => b.style.visibility="hidden" });
      burstHearts(b);
    });
    b.addEventListener("mouseenter", () => { if(!b.classList.contains("popped")) gsap.to(b,{y:-6,duration:0.3}); });
    b.addEventListener("mouseleave", () => { if(!b.classList.contains("popped")) gsap.to(b,{y:0,duration:0.3}); });
  });

  document.getElementById("to-finale-btn").addEventListener("click", () => {
    playClick();
    attemptGoToIndex(5, "forward");
  });
}

function burstHearts(el){
  const rect = el.getBoundingClientRect();
  for(let i=0;i<8;i++){
    const h = document.createElement("div");
    h.textContent = "♥";
    h.style.cssText = `position:fixed; left:${rect.left+rect.width/2}px; top:${rect.top+rect.height/2}px; color:var(--blush-deep); font-size:${10+Math.random()*10}px; pointer-events:none; z-index:300;`;
    document.body.appendChild(h);
    gsap.to(h, { x:(Math.random()-0.5)*160, y:-60-Math.random()*80, opacity:0, rotate:(Math.random()-0.5)*90, duration:0.9+Math.random()*0.4, ease:"power1.out", onComplete:() => h.remove() });
  }
}

/* ============================================================
   PAGE — FINALE
   ============================================================ */
function renderFinale(){
  return `
  <div class="page" id="page-finale" style="background:linear-gradient(180deg,#f4f9ff, #2c1b3d);">
    <div id="finale-stars" style="position:absolute; inset:0; z-index:1;"></div>
    <div class="page-inner" style="z-index:5; max-width:640px;">
      <span class="eyebrow" style="color:var(--gold);">Final Chapter</span>
      <div id="finale-heart-wrap" style="width:220px; height:220px; margin:0 auto 30px;">
        <img src="${photoSrc(13)}" style="width:100%; height:100%; object-fit:cover; border-radius:50%; box-shadow:0 0 0 6px rgba(255,255,255,0.5), var(--shadow-soft);"/>
      </div>
      <h2 class="display" style="font-size:clamp(2.2rem,6vw,3.4rem); color:white; margin-bottom:18px;">
        You mean the world to me, <span style="color:var(--blush-deep); font-style:italic;">${HER_NAME}</span>.
      </h2>
      <p class="handwritten" style="font-size:clamp(1.3rem,3vw,1.7rem); color:#e8d9f5; max-width:520px; margin:0 auto 34px; line-height:1.5;">
        Cousin or not, you're my sister — today, and every day after. Happy birthday, my darling. I love you endlessly.
      </p>
      <button class="btn" id="replay-btn" style="background:linear-gradient(135deg, var(--gold), var(--blush-deep));">Read it again ↻</button>
    </div>
  </div>`;
}

function initFinalePage(){
  const starField = document.getElementById("finale-stars");
  for(let i=0;i<60;i++){
    const s = document.createElement("div");
    const size = 1+Math.random()*2.5;
    s.style.cssText = `position:absolute; left:${Math.random()*100}%; top:${Math.random()*100}%; width:${size}px; height:${size}px; border-radius:50%; background:white; opacity:${0.2+Math.random()*0.6}; animation: twinkle ${2+Math.random()*3}s ease-in-out ${Math.random()*3}s infinite;`;
    starField.appendChild(s);
  }
  document.getElementById("replay-btn").addEventListener("click", () => {
    playClick();
    goToPage("cover", { direction:"back" });
  });
}

function playFinaleEnter(){
  gsap.from("#finale-heart-wrap", { scale:0.5, opacity:0, duration:1, ease:"back.out(1.6)" });
  gsap.from("#page-finale h2", { opacity:0, y:20, duration:1, ease:"power2.out", delay:0.25 });
  gsap.from("#page-finale p.handwritten", { opacity:0, y:20, duration:1, ease:"power2.out", delay:0.45 });
  gsap.from("#replay-btn", { opacity:0, y:20, duration:1, ease:"power2.out", delay:0.65 });
}

/* ============================================================
   CONFETTI
   ============================================================ */
function fireConfetti(){
  const canvas = document.getElementById("confetti-canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth; canvas.height = window.innerHeight;
  const colors = ["#FFC6D9","#C9B6E4","#A8D8EA","#FFD97D","#FF9FBE"];
  const particles = Array.from({length:140}, () => ({
    x: Math.random()*canvas.width, y: -20 - Math.random()*canvas.height*0.3,
    w: 6+Math.random()*6, h: 8+Math.random()*8,
    color: colors[Math.floor(Math.random()*colors.length)],
    vy: 2+Math.random()*3, vx: -1.5+Math.random()*3,
    rot: Math.random()*360, vr: -6+Math.random()*12,
  }));
  let frame = 0;
  function anim(){
    frame++;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.rot += p.vr;
      ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.rot*Math.PI/180);
      ctx.fillStyle = p.color; ctx.fillRect(-p.w/2,-p.h/2,p.w,p.h); ctx.restore();
    });
    if(frame < 220) requestAnimationFrame(anim); else ctx.clearRect(0,0,canvas.width,canvas.height);
  }
  anim();
}

/* ============================================================
   GLOBAL BACKGROUND — pink floating hearts, present on every page
   ============================================================ */
function initHeartsBackground(){
  const container = document.getElementById("hearts-bg");
  const glyphs = ["♥","♡","💗","💕"];
  const pinkHues = ["#FF8FB3","#FFC6D9","#FF6FA0","#FFE1EC","#FFB3CD"];
  const COUNT = 34;

  for(let i=0;i<COUNT;i++){
    spawnHeart(container, glyphs, pinkHues, true, i);
  }

  function spawnHeart(container, glyphs, hues, initial, i){
    const el = document.createElement("div");
    el.className = "bg-heart";
    el.textContent = glyphs[Math.floor(Math.random()*glyphs.length)];
    const size = 12 + Math.random()*30;
    const left = Math.random()*100;
    const dur = 14 + Math.random()*16;
    const delay = initial ? Math.random()*dur : 0;
    const drift = -40 + Math.random()*80;
    const rot = -20 + Math.random()*40;
    const opacity = 0.25 + Math.random()*0.45;
    const hue = hues[(i ?? Math.floor(Math.random()*hues.length)) % hues.length];
    el.style.cssText = `
      left:${left}%; bottom:-12%; font-size:${size}px; color:${hue};
      opacity:0; --drift:${drift}px; --rot:${rot}deg; --peak:${opacity};
      animation: heartFloat ${dur}s linear ${delay}s infinite;
    `;
    container.appendChild(el);
  }
}

const heartsBgKeyframes = document.createElement("style");
heartsBgKeyframes.textContent = `
  @keyframes heartFloat{
    0%{ transform:translateY(0) translateX(0) rotate(0deg) scale(0.8); opacity:0; }
    8%{ opacity:var(--peak); }
    50%{ transform:translateY(-55vh) translateX(calc(var(--drift) * 0.5)) rotate(calc(var(--rot) * 0.5)) scale(1); }
    88%{ opacity:var(--peak); }
    100%{ transform:translateY(-115vh) translateX(var(--drift)) rotate(var(--rot)) scale(1.05); opacity:0; }
  }
`;
document.head.appendChild(heartsBgKeyframes);


function initThreadCanvas(){
  const canvas = document.getElementById("thread-canvas");
  const ctx = canvas.getContext("2d");
  let w,h;
  function resize(){ w = canvas.width = window.innerWidth; h = canvas.height = window.innerHeight; }
  resize();
  window.addEventListener("resize", resize);
  let t = 0;
  function draw(){
    t += 0.006;
    ctx.clearRect(0,0,w,h);
    ctx.beginPath();
    const amplitude = 18 + 10*Math.sin(t*0.7);
    const baseX = w * (0.5 + 0.3*Math.sin(t*0.15));
    for(let y=0;y<=h;y+=10){
      const x = baseX + Math.sin(y*0.02 + t*2)*amplitude;
      if(y===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    }
    const grad = ctx.createLinearGradient(0,0,0,h);
    grad.addColorStop(0,"rgba(255,198,217,0.15)");
    grad.addColorStop(0.5,"rgba(201,182,228,0.13)");
    grad.addColorStop(1,"rgba(168,216,234,0.13)");
    ctx.strokeStyle = grad; ctx.lineWidth = 2.5; ctx.stroke();
    requestAnimationFrame(draw);
  }
  draw();
}

/* ============================================================
   SOUND — synthesized ambient pad + click / pop / success FX
   ============================================================ */
function ensureAudioCtx(){
  if(!state.audioCtx) state.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return state.audioCtx;
}
function initSoundToggle(){
  document.getElementById("sound-toggle").addEventListener("click", () => toggleSound(!state.soundOn));
}
function toggleSound(on){
  const ctx = ensureAudioCtx();
  if(ctx.state === "suspended") ctx.resume();
  state.soundOn = on;
  document.getElementById("sound-toggle").textContent = on ? "🔊" : "🔇";
  if(on && !state.ambientNodes) startAmbient();
  else if(!on && state.ambientNodes) stopAmbient();
}
function startAmbient(){
  const ctx = ensureAudioCtx();
  const master = ctx.createGain(); master.gain.value = 0.05; master.connect(ctx.destination);
  const notes = [261.63, 329.63, 392.0, 493.88];
  const oscs = notes.map((freq,i) => {
    const osc = ctx.createOscillator(); osc.type="sine"; osc.frequency.value=freq;
    const g = ctx.createGain(); g.gain.value=0;
    osc.connect(g); g.connect(master); osc.start();
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.04+i*0.01;
    const lfoGain = ctx.createGain(); lfoGain.gain.value = 0.03;
    lfo.connect(lfoGain); lfoGain.connect(g.gain);
    g.gain.value = 0.02; lfo.start();
    return { osc, g, lfo };
  });
  state.ambientNodes = { master, oscs };
}
function stopAmbient(){
  if(!state.ambientNodes) return;
  const ctx = state.audioCtx;
  state.ambientNodes.oscs.forEach(({osc,g,lfo}) => {
    g.gain.setTargetAtTime(0, ctx.currentTime, 0.3);
    setTimeout(() => { osc.stop(); lfo.stop(); }, 600);
  });
  setTimeout(() => { state.ambientNodes = null; }, 650);
}
function playTone(freq, duration=0.12, type="sine", vol=0.06){
  if(!state.soundOn) return;
  const ctx = ensureAudioCtx();
  const osc = ctx.createOscillator(); const g = ctx.createGain();
  osc.type = type; osc.frequency.value = freq; g.gain.value = vol;
  osc.connect(g); g.connect(ctx.destination); osc.start();
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
  osc.stop(ctx.currentTime + duration + 0.02);
}
function playClick(){ playTone(520, 0.08, "sine", 0.05); }
function playPop(){ playTone(760 + Math.random()*120, 0.15, "triangle", 0.07); }
function playSuccess(){
  if(!state.soundOn) return;
  [523.25,659.25,783.99,1046.5].forEach((f,i) => setTimeout(() => playTone(f,0.35,"sine",0.06), i*110));
}

/* ============================================================
   PAGE ENTER ANIMATION MAP + BOOT
   ============================================================ */
const PAGE_ENTER_ANIMATIONS = {
  cover: playCoverEnter,
  letter: playLetterEnter,
  finale: playFinaleEnter,
};

const app = document.getElementById("app");
app.innerHTML = `
  ${renderCover()}
  ${renderGallery()}
  ${renderArcade()}
  ${renderLetter()}
  ${renderFun()}
  ${renderFinale()}
`;

renderNav();
initHeartsBackground();
initThreadCanvas();
initSoundToggle();
initCover();
initGallery();
initArcade();
initLetterPage();
initFunPage();
initFinalePage();

// show initial page based on hash (defaults to cover)
const initialId = "cover";
history.replaceState({page:initialId}, "", "#cover");
document.getElementById(`page-${initialId}`).classList.add("active");
state.currentPage = PAGES.findIndex(p=>p.id===initialId);
updateNav();
updateArrows();