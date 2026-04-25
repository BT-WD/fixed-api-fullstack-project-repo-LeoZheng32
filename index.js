const baseUrl = "https://pokeapi.co/api/v2/";

const searchInput = document.getElementById("searchInput");
const playBtn = document.getElementById("playBtn");
const contentArea = document.getElementById("contentArea");
const scoreDisplay = document.querySelector(".nav-left");
const highScoreDisplay = document.querySelector(".nav-right-score");
const historyMount = document.getElementById("searchHistoryMount");

let score = 0;
let highScore = parseInt(localStorage.getItem("pokeHighScore") || "0", 10);
let currentAnswer = "";
let gameActive  = false;

let searchHistory = JSON.parse(localStorage.getItem("pokeSearchHistory") || "[]");

function updateScoreDisplay() {
  scoreDisplay.textContent = score;
  highScoreDisplay.textContent = highScore;
}

function saveHighScore() {
  localStorage.setItem("pokeHighScore", highScore.toString());
}

function addToSearchHistory(name) {
  searchHistory = searchHistory.filter(n => n !== name);
  searchHistory.unshift(name);
  if (searchHistory.length > 5) searchHistory = searchHistory.slice(0, 5);
  localStorage.setItem("pokeSearchHistory", JSON.stringify(searchHistory));
  renderSearchHistory();
}

function renderSearchHistory() {
  historyMount.innerHTML = "";
  if (searchHistory.length === 0) return;

  const box = document.createElement("div");
  box.className = "search-history-box";

  const label = document.createElement("span");
  label.className = "search-history-label";
  label.textContent = "Recent:";
  box.appendChild(label);

  for (const name of searchHistory) {
    const btn = document.createElement("button");
    btn.className = "history-btn";
    btn.textContent = name;
    btn.onclick = () => { searchInput.value = name; searchPokemon(); };
    box.appendChild(btn);
  }

  historyMount.appendChild(box);
}

function getEvolutionNames(chain) {
  const names = [];
  let current = chain;
  while (current) {
    names.push(current.species.name);
    current = current.evolves_to[0] || null;
  }
  return names;
}

async function fetchEvoSprites(names) {
  const stages = [];
  for (const name of names) {
    const res = await fetch(`${baseUrl}pokemon/${name}`);
    const data = await res.json();
    const sprite = data.sprites.other["official-artwork"].front_default || data.sprites.front_default;
    stages.push({ name, sprite });
  }
  return stages;
}

async function fetchRandomPokemon() {
  const id = Math.floor(Math.random() * 151) + 1;
  const pokemonRes = await fetch(`${baseUrl}pokemon/${id}`);
  const pokemon = await pokemonRes.json();
  const speciesRes = await fetch(pokemon.species.url);
  const speciesData = await speciesRes.json();
  const evoRes = await fetch(speciesData.evolution_chain.url);
  const evoData = await evoRes.json();
  const evoNames = getEvolutionNames(evoData.chain);
  const evoStages = await fetchEvoSprites(evoNames);
  return { pokemon, evoStages };
}

function buildEvoRow(evoStages, mysteryName) {
  const row = document.createElement("div");
  row.className = "evo-stages";

  const stageDivs = [];

  for (let i = 0; i < evoStages.length; i++) {
    const stage = evoStages[i];
    const isMystery = mysteryName !== null && stage.name === mysteryName;

    const stageDiv = document.createElement("div");
    stageDiv.className = "evo-stage";
    stageDiv.dataset.realName = stage.name;

    const img = document.createElement("img");
    img.src = stage.sprite;
    img.alt = isMystery ? "???" : stage.name;
    if (isMystery) img.classList.add("silhouette");

    const lbl = document.createElement("span");
    lbl.className = "evo-label";
    lbl.textContent = isMystery ? "???" : stage.name.toUpperCase();

    stageDiv.appendChild(img);
    stageDiv.appendChild(lbl);
    row.appendChild(stageDiv);
    stageDivs.push(stageDiv);

    if (i < evoStages.length - 1) {
      const arrow = document.createElement("div");
      arrow.className = "evo-arrow";
      arrow.textContent = "→";
      row.appendChild(arrow);
    }
  }

  function reveal() {
    for (const div of stageDivs) {
      div.querySelector("img").classList.remove("silhouette");
      div.querySelector(".evo-label").textContent = div.dataset.realName.toUpperCase();
    }
  }

  return { row, reveal };
}

async function searchPokemon() {
  const query = searchInput.value.trim().toLowerCase();
  if (!query) return;

  setLoading();

  try {
    const pokemonRes  = await fetch(`${baseUrl}pokemon/${query}`);
    if (!pokemonRes.ok) throw new Error("Pokémon not found");
    const pokemon = await pokemonRes.json();
    const speciesRes = await fetch(pokemon.species.url);
    if (!speciesRes.ok) throw new Error("Species data not found");
    const speciesData = await speciesRes.json();
    const evoRes = await fetch(speciesData.evolution_chain.url);
    if (!evoRes.ok) throw new Error("Evolution data not found");
    const evoData = await evoRes.json();
    const evoNames = getEvolutionNames(evoData.chain);
    const evoStages = await fetchEvoSprites(evoNames);

    addToSearchHistory(pokemon.name);
    displayPokemon(pokemon, evoStages);
  } catch (err) {
    contentArea.innerHTML = `<p class="loading-msg">${err.message}</p>`;
  }
}

function displayPokemon(pokemon, evoStages) {
  const name = pokemon.name;
  const image = pokemon.sprites.other["official-artwork"].front_default;
  const types = pokemon.types.map(t => t.type.name).join(", ");
  const hp = pokemon.stats.find(s => s.stat.name === "hp").base_stat;
  const attack = pokemon.stats.find(s => s.stat.name === "attack").base_stat;
  const defense = pokemon.stats.find(s => s.stat.name === "defense").base_stat;

  contentArea.innerHTML = "";

  const card = document.createElement("div");
  card.className = "pokemon-card";

  const title = document.createElement("h2");
  title.textContent = name.toUpperCase();
  card.appendChild(title);

  const img = document.createElement("img");
  img.src = image; img.alt = name;
  card.appendChild(img);

  for (const [key, val] of [["Type", types], ["HP", hp], ["Attack", attack], ["Defense", defense]]) {
    const p = document.createElement("p");
    p.innerHTML = `<span style="color:var(--muted);font-size:10px;letter-spacing:2px;text-transform:uppercase;">${key}:</span> <span>${val}</span>`;
    card.appendChild(p);
  }

  if (evoStages.length > 1) {
    const evoSection = document.createElement("div");
    evoSection.className = "evolution-chain";
    const evoLabel = document.createElement("p");
    evoLabel.textContent = "Evolution Chain";
    evoSection.appendChild(evoLabel);
    const { row } = buildEvoRow(evoStages, null);
    evoSection.appendChild(row);
    card.appendChild(evoSection);
  } else {
    const noEvo = document.createElement("p");
    noEvo.className = "no-evo";
    noEvo.textContent = "No evolutions";
    card.appendChild(noEvo);
  }

  contentArea.appendChild(card);
}

function setLoading() {
  contentArea.innerHTML = `<p class="loading-msg">Loading…</p>`;
}

async function loadRound() {
  setLoading();
  gameActive = false;

  const { pokemon, evoStages } = await fetchRandomPokemon();
  currentAnswer = pokemon.name;
  gameActive = true;

  const types = pokemon.types.map(t => t.type.name).join(", ");
  const hp = pokemon.stats.find(s => s.stat.name === "hp").base_stat;
  const attack = pokemon.stats.find(s => s.stat.name === "attack").base_stat;
  const defense = pokemon.stats.find(s => s.stat.name === "defense").base_stat;
  const speed = pokemon.stats.find(s => s.stat.name === "speed").base_stat;
  const weight = (pokemon.weight / 10).toFixed(1);
  const height = (pokemon.height / 10).toFixed(1);
  const abilities = pokemon.abilities.map(a => a.ability.name).join(", ");
  const evoText = evoStages.map(s => s.name === currentAnswer ? "???" : s.name.toUpperCase()).join(" → ");

  contentArea.innerHTML = "";

  const card = document.createElement("div");
  card.className = "game-card";

  const gameTitle = document.createElement("div");
  gameTitle.className = "game-title";
  gameTitle.textContent = "Who's That Pokémon?";
  card.appendChild(gameTitle);

  const clues = [
    ["Type", types],
    ["HP", hp],
    ["Attack", attack],
    ["Defense", defense],
    ["Speed", speed],
    ["Weight", `${weight} kg`],
    ["Height", `${height} m`],
    ["Abilities", abilities, true],
    ["Evo Chain", evoText, true],
  ];

  const grid = document.createElement("div");
  grid.className = "clue-grid";

  for (const [key, val, full] of clues) {
    const item = document.createElement("div");
    item.className = "clue-item" + (full ? " full-width" : "");
    item.innerHTML = `<span class="clue-key">${key}</span><span class="clue-val">${val}</span>`;
    grid.appendChild(item);
  }
  card.appendChild(grid);

  const evoSection = document.createElement("div");
  evoSection.className = "game-evo-section";
  const evoLbl = document.createElement("div");
  evoLbl.className = "game-evo-label";
  evoLbl.textContent = "Evolution Chain";
  evoSection.appendChild(evoLbl);
  const { row: evoRow, reveal } = buildEvoRow(evoStages, currentAnswer);
  evoSection.appendChild(evoRow);
  card.appendChild(evoSection);

  const guessInput = document.createElement("input");
  guessInput.type = "text";
  guessInput.placeholder = "Enter Pokémon name…";
  guessInput.className = "guess-input";

  const submitBtn = document.createElement("button");
  submitBtn.textContent = "Guess";
  submitBtn.className = "guess-btn";

  const guessRow = document.createElement("div");
  guessRow.className = "guess-row";
  guessRow.appendChild(guessInput);
  guessRow.appendChild(submitBtn);
  card.appendChild(guessRow);

  const resultMsg = document.createElement("p");
  resultMsg.className = "result-msg";
  card.appendChild(resultMsg);

  contentArea.appendChild(card);
  guessInput.focus();

  function lockInput() {
    guessInput.disabled = true;
    submitBtn.disabled  = true;
    gameActive = false;
  }

  function checkGuess() {
    if (!gameActive) return;
    const guess = guessInput.value.trim().toLowerCase();
    if (!guess) return;

    if (guess === currentAnswer) {
      score++;
      if (score > highScore) { highScore = score; saveHighScore(); }
      updateScoreDisplay();
      lockInput();
      reveal();
      resultMsg.textContent = "✓ Correct! Loading next Pokémon…";
      resultMsg.className = "result-msg correct";
      setTimeout(loadRound, 1400);
    } else {
      lockInput();
      reveal();
      resultMsg.innerHTML = `✗ It was <strong>${currentAnswer.toUpperCase()}</strong> — Press Play to go again.`;
      resultMsg.className = "result-msg wrong";
    }
  }

  submitBtn.onclick = checkGuess;
  guessInput.addEventListener("keydown", e => { if (e.key === "Enter") checkGuess(); });
}

function startGame() {
  score = 0;
  updateScoreDisplay();
  loadRound();
}

document.querySelector(".search-btn").addEventListener("click", searchPokemon);
searchInput.addEventListener("keydown", e => { if (e.key === "Enter") searchPokemon(); });
playBtn.addEventListener("click", startGame);

updateScoreDisplay();
renderSearchHistory();