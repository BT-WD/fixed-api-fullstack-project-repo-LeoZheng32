const baseUrl = "https://pokeapi.co/api/v2/";

const searchInput = document.getElementById("searchInput");
const playBtn = document.getElementById("playBtn");
const contentArea = document.getElementById("contentArea");
const scoreDisplay = document.querySelector(".nav-left");

let score = 0;
let currentAnswer = "";
let currentGameMode = "silhouette"; 


async function searchPokemon() {
  const query = searchInput.value.trim().toLowerCase();
  if (!query) return;

  contentArea.textContent = "Loading...";

  try {
    const pokemonRes = await fetch(`${baseUrl}pokemon/${query}`);
    if (!pokemonRes.ok) throw new Error("Pokemon not found");
    const pokemonData = await pokemonRes.json();

    const speciesRes = await fetch(pokemonData.species.url);
    if (!speciesRes.ok) throw new Error("Species data not found");
    const speciesData = await speciesRes.json();

    const evoRes = await fetch(speciesData.evolution_chain.url);
    if (!evoRes.ok) throw new Error("Evolution data not found");
    const evoData = await evoRes.json();

    const evoNames = getEvolutionNames(evoData.chain);
    const evoStages = await fetchEvoSprites(evoNames);

    displayPokemon(pokemonData, evoStages);
  } catch (error) {
    contentArea.textContent = error.message;
  }
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

function displayPokemon(pokemon, evoStages) {
  const name    = pokemon.name;
  const image   = pokemon.sprites.other["official-artwork"].front_default;
  const types   = pokemon.types.map(t => t.type.name).join(", ");
  const hp      = pokemon.stats.find(s => s.stat.name === "hp").base_stat;
  const attack  = pokemon.stats.find(s => s.stat.name === "attack").base_stat;
  const defense = pokemon.stats.find(s => s.stat.name === "defense").base_stat;

  contentArea.textContent = "";

  const card = document.createElement("div");
  card.className = "pokemon-card";

  const title = document.createElement("h2");
  title.textContent = name.toUpperCase();

  const img = document.createElement("img");
  img.src = image;
  img.alt = name;
  img.width = 200;

  const typeP = document.createElement("p");
  typeP.textContent = `Type: ${types}`;

  const hpP = document.createElement("p");
  hpP.textContent = `HP: ${hp}`;

  const attackP = document.createElement("p");
  attackP.textContent = `Attack: ${attack}`;

  const defenseP = document.createElement("p");
  defenseP.textContent = `Defense: ${defense}`;

  card.appendChild(title);
  card.appendChild(img);
  card.appendChild(typeP);
  card.appendChild(hpP);
  card.appendChild(attackP);
  card.appendChild(defenseP);

  if (evoStages.length > 1) {
    const evoSection = document.createElement("div");
    evoSection.className = "evolution-chain";

    const evoLabel = document.createElement("p");
    evoLabel.textContent = "Evolution Chain:";

    const evoRow = document.createElement("div");
    evoRow.className = "evo-stages";

    for (let i = 0; i < evoStages.length; i++) {
      const stage = evoStages[i];

      const stageDiv = document.createElement("div");
      stageDiv.className = "evo-stage";
      if (stage.name === name) stageDiv.classList.add("current");

      const stageImg = document.createElement("img");
      stageImg.src = stage.sprite;
      stageImg.alt = stage.name;
      stageImg.width = 80;

      const stageLabel = document.createElement("span");
      stageLabel.textContent = stage.name.toUpperCase();

      stageDiv.appendChild(stageImg);
      stageDiv.appendChild(stageLabel);
      evoRow.appendChild(stageDiv);

      if (i < evoStages.length - 1) {
        const arrow = document.createElement("span");
        arrow.className = "evo-arrow";
        arrow.textContent = "→";
        evoRow.appendChild(arrow);
      }
    }

    evoSection.appendChild(evoLabel);
    evoSection.appendChild(evoRow);
    card.appendChild(evoSection);
  } else {
    const noEvo = document.createElement("p");
    noEvo.className = "no-evo";
    noEvo.textContent = "No evolutions";
    card.appendChild(noEvo);
  }

  contentArea.appendChild(card);
}

async function fetchRandomPokemon() {
  const randomId = Math.floor(Math.random() * 151) + 1;

  const pokemonRes = await fetch(`${baseUrl}pokemon/${randomId}`);
  const pokemon = await pokemonRes.json();

  const speciesRes = await fetch(pokemon.species.url);
  const speciesData = await speciesRes.json();

  const evoRes = await fetch(speciesData.evolution_chain.url);
  const evoData = await evoRes.json();

  const evoNames = getEvolutionNames(evoData.chain);
  const evoStages = await fetchEvoSprites(evoNames);

  return { pokemon, evoStages };
}

function buildGuessRow() {
  const guessInput = document.createElement("input");
  guessInput.type = "text";
  guessInput.placeholder = "Enter pokemon name...";
  guessInput.className = "guess-input";

  const submitBtn = document.createElement("button");
  submitBtn.textContent = "guess";
  submitBtn.className = "guess-btn";

  const giveUpBtn = document.createElement("button");
  giveUpBtn.textContent = "give up";
  giveUpBtn.className = "guess-btn";

  const btnRow = document.createElement("div");
  btnRow.className = "guess-row";
  btnRow.appendChild(guessInput);
  btnRow.appendChild(submitBtn);
  btnRow.appendChild(giveUpBtn);

  return { guessInput, submitBtn, giveUpBtn, btnRow };
}

function buildModeBar(activeMode) {
  const bar = document.createElement("div");
  bar.className = "mode-bar";

  const silBtn = document.createElement("button");
  silBtn.textContent = "silhouette mode";
  silBtn.className = "mode-btn" + (activeMode === "silhouette" ? " active" : "");
  silBtn.onclick = function() {
    currentGameMode = "silhouette";
    startGame();
  };

  const clueBtn = document.createElement("button");
  clueBtn.textContent = "clues mode";
  clueBtn.className = "mode-btn" + (activeMode === "clues" ? " active" : "");
  clueBtn.onclick = function() {
    currentGameMode = "clues";
    startGame();
  };

  bar.appendChild(silBtn);
  bar.appendChild(clueBtn);
  return bar;
}

async function startSilhouetteGame() {
  contentArea.textContent = "Loading...";

  const { pokemon } = await fetchRandomPokemon();
  currentAnswer = pokemon.name;

  const types   = pokemon.types.map(t => t.type.name).join(", ");
  const hp      = pokemon.stats.find(s => s.stat.name === "hp").base_stat;
  const attack  = pokemon.stats.find(s => s.stat.name === "attack").base_stat;
  const defense = pokemon.stats.find(s => s.stat.name === "defense").base_stat;
  const weight  = pokemon.weight / 10;

  contentArea.textContent = "";

  const card = document.createElement("div");
  card.className = "pokemon-card";

  card.appendChild(buildModeBar("silhouette"));

  const title = document.createElement("div");
  title.className = "game-title";
  title.textContent = "Who's that Pokémon?";

  const img = document.createElement("img");
  img.src = pokemon.sprites.other["official-artwork"].front_default;
  img.alt = "mystery pokemon";
  img.width = 180;
  img.className = "silhouette";

  const clueBox = document.createElement("div");
  clueBox.className = "clue-box";

  for (const clue of [`Type: ${types}`, `HP: ${hp}`, `Attack: ${attack}`, `Defense: ${defense}`, `Weight: ${weight} kg`]) {
    const p = document.createElement("p");
    p.textContent = clue;
    clueBox.appendChild(p);
  }

  const { guessInput, submitBtn, giveUpBtn, btnRow } = buildGuessRow();
  const resultMsg = document.createElement("p");
  resultMsg.className = "result-msg";

  function checkGuess() {
    const guess = guessInput.value.trim().toLowerCase();
    if (!guess) return;

    if (guess === currentAnswer) {
      score++;
      scoreDisplay.textContent = `Score: ${score}`;
      resultMsg.textContent = "✓ Correct!";
      resultMsg.style.color = "green";
      img.classList.remove("silhouette");
      submitBtn.textContent = "next";
      submitBtn.onclick = startGame;
      guessInput.disabled = true;
      giveUpBtn.disabled = true;
    } else {
      resultMsg.textContent = "✗ Wrong, try again!";
      resultMsg.style.color = "red";
    }
  }

  submitBtn.onclick = checkGuess;
  guessInput.addEventListener("keydown", function(e) {
    if (e.key === "Enter") checkGuess();
  });

  giveUpBtn.onclick = function() {
    resultMsg.textContent = `It was ${currentAnswer.toUpperCase()}!`;
    resultMsg.style.color = "#555";
    img.classList.remove("silhouette");
    submitBtn.textContent = "next";
    submitBtn.onclick = startGame;
    guessInput.disabled = true;
    giveUpBtn.disabled = true;
  };

  card.appendChild(title);
  card.appendChild(img);
  card.appendChild(clueBox);
  card.appendChild(btnRow);
  card.appendChild(resultMsg);

  contentArea.appendChild(card);
}

async function startCluesGame() {
  contentArea.textContent = "Loading...";

  const { pokemon, evoStages } = await fetchRandomPokemon();
  currentAnswer = pokemon.name;

  const types    = pokemon.types.map(t => t.type.name).join(", ");
  const hp       = pokemon.stats.find(s => s.stat.name === "hp").base_stat;
  const attack   = pokemon.stats.find(s => s.stat.name === "attack").base_stat;
  const defense  = pokemon.stats.find(s => s.stat.name === "defense").base_stat;
  const speed    = pokemon.stats.find(s => s.stat.name === "speed").base_stat;
  const weight   = pokemon.weight / 10;
  const height   = pokemon.height / 10;
  const abilities = pokemon.abilities.map(a => a.ability.name).join(", ");

  const evoNames = evoStages.map(s => (s.name === currentAnswer ? "???" : s.name.toUpperCase()));

  contentArea.textContent = "";

  const card = document.createElement("div");
  card.className = "pokemon-card";

  card.appendChild(buildModeBar("clues"));

  const title = document.createElement("div");
  title.className = "game-title";
  title.textContent = "Guess from the clues!";

  const clueBox = document.createElement("div");
  clueBox.className = "clue-box";

  const clues = [
    `Type: ${types}`,
    `HP: ${hp}`,
    `Attack: ${attack}`,
    `Defense: ${defense}`,
    `Speed: ${speed}`,
    `Weight: ${weight} kg`,
    `Height: ${height} m`,
    `Abilities: ${abilities}`,
    `Evolution chain: ${evoNames.join(" → ")}`,
  ];

  for (const clue of clues) {
    const p = document.createElement("p");
    p.textContent = clue;
    clueBox.appendChild(p);
  }

  const evoRow = document.createElement("div");
  evoRow.className = "evo-stages";
  evoRow.style.marginTop = "0.75rem";

  for (let i = 0; i < evoStages.length; i++) {
    const stage = evoStages[i];

    const stageDiv = document.createElement("div");
    stageDiv.className = "evo-stage";

    const stageImg = document.createElement("img");
    if (stage.name === currentAnswer) {
      stageImg.src = stage.sprite;
      stageImg.className = "silhouette";
    } else {
      stageImg.src = stage.sprite;
    }
    stageImg.alt = stage.name;
    stageImg.width = 80;

    const stageLabel = document.createElement("span");
    stageLabel.textContent = stage.name === currentAnswer ? "???" : stage.name.toUpperCase();

    stageDiv.appendChild(stageImg);
    stageDiv.appendChild(stageLabel);
    evoRow.appendChild(stageDiv);

    if (i < evoStages.length - 1) {
      const arrow = document.createElement("span");
      arrow.className = "evo-arrow";
      arrow.textContent = "→";
      evoRow.appendChild(arrow);
    }
  }

  const { guessInput, submitBtn, giveUpBtn, btnRow } = buildGuessRow();
  const resultMsg = document.createElement("p");
  resultMsg.className = "result-msg";

  function revealAnswer() {
    const allImgs = evoRow.querySelectorAll("img");
    allImgs.forEach(i => i.classList.remove("silhouette"));
    const allLabels = evoRow.querySelectorAll("span");
    allLabels.forEach((span, idx) => {
      span.textContent = evoStages[idx] ? evoStages[idx].name.toUpperCase() : span.textContent;
    });
  }

  function checkGuess() {
    const guess = guessInput.value.trim().toLowerCase();
    if (!guess) return;

    if (guess === currentAnswer) {
      score++;
      scoreDisplay.textContent = `Score: ${score}`;
      resultMsg.textContent = "✓ Correct!";
      resultMsg.style.color = "green";
      revealAnswer();
      submitBtn.textContent = "next";
      submitBtn.onclick = startGame;
      guessInput.disabled = true;
      giveUpBtn.disabled = true;
    } else {
      resultMsg.textContent = "✗ Wrong, try again!";
      resultMsg.style.color = "red";
    }
  }

  submitBtn.onclick = checkGuess;
  guessInput.addEventListener("keydown", function(e) {
    if (e.key === "Enter") checkGuess();
  });

  giveUpBtn.onclick = function() {
    resultMsg.textContent = `It was ${currentAnswer.toUpperCase()}!`;
    resultMsg.style.color = "#555";
    revealAnswer();
    submitBtn.textContent = "next";
    submitBtn.onclick = startGame;
    guessInput.disabled = true;
    giveUpBtn.disabled = true;
  };

  card.appendChild(title);
  card.appendChild(clueBox);
  card.appendChild(evoRow);
  card.appendChild(btnRow);
  card.appendChild(resultMsg);

  contentArea.appendChild(card);
}

function startGame() {
  if (currentGameMode === "clues") {
    startCluesGame();
  } else {
    startSilhouetteGame();
  }
}

document.querySelector(".search-btn").addEventListener("click", searchPokemon);
searchInput.addEventListener("keydown", function(e) {
  if (e.key === "Enter") searchPokemon();
});
playBtn.addEventListener("click", startGame);