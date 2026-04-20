const baseUrl = "https://pokeapi.co/api/v2/"

const searchInput = document.getElementById("searchInput");
const playBtn = document.getElementById("playBtn");
const contentArea = document.getElementById("contentArea");

async function searchPokemon() {
  const query = searchInput.value.trim().toLowerCase();

  if (!query) return;

  try {
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${query}`);

    if (!response.ok) throw new Error("Pokemon not found");

    const data = await response.json();

    displayPokemon(data);
  } catch (error) {
    contentArea.innerHTML = `<p class="error"> ${error.message}</p>`;
  }
}

function displayPokemon(data) {
  const name = data.name;
  const image = data.sprites.other["official-artwork"].front_default;
  const types = data.types.map(t => t.type.name).join(", ");
  const hp = data.stats.find(s => s.stat.name === "hp").base_stat;
  const attack = data.stats.find(s => s.stat.name === "attack").base_stat;
  const defense = data.stats.find(s => s.stat.name === "defense").base_stat;

  contentArea.innerHTML = `
    <div class="pokemon-card">
      <h2>${name.toUpperCase()}</h2>
      <img src="${image}" alt="${name}" width="200" />
      <p><strong>Type:</strong> ${types}</p>
      <p><strong>HP:</strong> ${hp}</p>
      <p><strong>Attack:</strong> ${attack}</p>
      <p><strong>Defense:</strong> ${defense}</p>
    </div>
  `;
}

// Hook up the search button
document.querySelector(".search-btn").addEventListener("click", searchPokemon);

// Also trigger on Enter key
searchInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") searchPokemon();
});