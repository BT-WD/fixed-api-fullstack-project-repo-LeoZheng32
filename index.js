const baseUrl = "https://pokeapi.co/api/v2/";

const searchInput = document.getElementById("searchInput");
const playBtn = document.getElementById("playBtn");
const contentArea = document.getElementById("contentArea");

async function searchPokemon() {
  const query = searchInput.value.trim().toLowerCase();
  if (!query) return;

  contentArea.textContent = "Loading...";

  try {
    // Fetch main pokemon data
    const pokemonRes = await fetch(`${baseUrl}pokemon/${query}`);
    if (!pokemonRes.ok) throw new Error("Pokemon not found");
    const pokemonData = await pokemonRes.json();

    // Fetch species data (needed to get evolution chain)
    const speciesRes = await fetch(pokemonData.species.url);
    if (!speciesRes.ok) throw new Error("Species data not found");
    const speciesData = await speciesRes.json();

    // Fetch evolution chain
    const evoRes = await fetch(speciesData.evolution_chain.url);
    if (!evoRes.ok) throw new Error("Evolution data not found");
    const evoData = await evoRes.json();

    // Get list of names in the evolution chain
    const evoNames = getEvolutionNames(evoData.chain);

    // Fetch sprite for each evolution stage
    const evoStages = await fetchEvoSprites(evoNames);

    // Show everything on the page
    displayPokemon(pokemonData, evoStages);

  } catch (error) {
    contentArea.textContent = error.message;
  }
}

// Walk the chain object and collect each pokemon name
function getEvolutionNames(chain) {
  const names = [];
  let current = chain;

  while (current) {
    names.push(current.species.name);
    current = current.evolves_to[0] || null;
  }

  return names;
}

// Fetch the sprite image URL for each name in the evolution chain
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
  // Pull out the stats we need
  const name    = pokemon.name;
  const image   = pokemon.sprites.other["official-artwork"].front_default;
  const types   = pokemon.types.map(t => t.type.name).join(", ");
  const hp      = pokemon.stats.find(s => s.stat.name === "hp").base_stat;
  const attack  = pokemon.stats.find(s => s.stat.name === "attack").base_stat;
  const defense = pokemon.stats.find(s => s.stat.name === "defense").base_stat;

  // Clear old content
  contentArea.textContent = "";

  // Build the card
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

  // Build the evolution chain section (only if there are multiple stages)
  if (evoStages.length > 1) {
    const evoSection = document.createElement("div");
    evoSection.className = "evolution-chain";

    const evoLabel = document.createElement("p");
    evoLabel.textContent = "Evolution Chain:";

    const evoRow = document.createElement("div");
    evoRow.className = "evo-stages";

    for (let i = 0; i < evoStages.length; i++) {
      const stage = evoStages[i];

      // Each pokemon stage box
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

      // Add an arrow between stages
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

document.querySelector(".search-btn").addEventListener("click", searchPokemon);
searchInput.addEventListener("keydown", function(e) {
  if (e.key === "Enter") searchPokemon();
});