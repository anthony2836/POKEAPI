let limit = 9; 
let currentPage = 1;
let tipoActual = null;
let tipoPagina = 1;
let tipoLista = [];

const TYPE_ICON_BASE =
  "https://raw.githubusercontent.com/duiker101/pokemon-type-svg-icons/master/icons/";

let todosLosPokemon = [];

function cargarTodosLosPokemon() {
  $.get("https://pokeapi.co/api/v2/pokemon?limit=1000")
    .then((response) => {
      todosLosPokemon = response.results; // [{ name, url }]
    });
}

$(document).ready(function () {
  const lista = $(".item-list");
  cargarTipos(lista);
  cargarGaleria(currentPage);
  cargarTodosLosPokemon();
  let delayTimer;
$(".left-column input").keyup(function (event) {
  clearTimeout(delayTimer);
  const texto = $(this).val().toLowerCase().trim();

  if (event.key === "Enter") {
    $("#buscar").hide();
    return;
  }

  if (texto === "") {
    tipoActual = null;
    currentPage = 1;
    cargarGaleria(currentPage);
    $("#prevPage").prop("disabled", currentPage === 1);
    return;
  }

  delayTimer = setTimeout(() => {
    tipoActual = null;
    const coincidencias = todosLosPokemon.filter((p) =>
      p.name.includes(texto)
    );

    $(".gallery .row").empty();

    if (coincidencias.length === 0) {
      $(".gallery .row").html(
        '<p class="text-center text-danger">No se encontraron coincidencias</p>'
      );
      return;
    }

    coincidencias.slice(0, 9).forEach((p) => {
      $.get(p.url).then((data) => renderSimpleCard(data));
    });
  }, 500);
});

  $("#prevPage").click(function () {
    if (tipoActual) {
      if (tipoPagina > 1) {
        tipoPagina--;
        cargarTipoPaginado(tipoActual, tipoPagina);
      }
    } else {
      if (currentPage > 1) {
        currentPage--;
        cargarGaleria(currentPage);
      }
    }
  });

  $("#nextPage").click(function () {
    if (tipoActual) {
      const totalPages = Math.ceil(tipoLista.length / limit);
      if (tipoPagina < totalPages) {
        tipoPagina++;
        cargarTipoPaginado(tipoActual, tipoPagina);
      }
    } else {
      currentPage++;
      cargarGaleria(currentPage);
    }
  });
});

// Barra lateral: tipos
function cargarTipos(lista) {
  $.get("https://pokeapi.co/api/v2/type")
    .then((response) => {
      response.results.forEach((tipo) => {
        $.get(tipo.url).then((data) => {
          if (!data.pokemon || data.pokemon.length === 0) return; 

          const item = `
            <div class="item" onclick="filtrarPorTipo('${tipo.name}')">
              <img src="${TYPE_ICON_BASE}${tipo.name}.svg" alt="${tipo.name}" width="40" height="40"
                   onerror="this.style.display='none';">
              <span class="text-capitalize">${tipo.name}</span>
            </div>`;
          lista.append(item);
        });
      });
    });
}

function filtrarPorTipo(tipo) {
  tipoActual = tipo;
  tipoPagina = 1;

  $.get(`https://pokeapi.co/api/v2/type/${tipo}`).then((data) => {
    tipoLista = data.pokemon;
    cargarTipoPaginado(tipoActual, tipoPagina);
  });
}

function cargarTipoPaginado(tipo, page) {
  $(".gallery .row").empty();
  const totalPages = Math.ceil(tipoLista.length / limit);
  $("#pageIndicator").text(`Tipo "${tipo}" - Página ${page} de ${totalPages}`);
  $("#prevPage").prop("disabled", page === 1);

  const inicio = (page - 1) * limit;
  const fin = inicio + limit;
  const pokemons = tipoLista.slice(inicio, fin);

  pokemons.forEach((entry) => {
    $.get(entry.pokemon.url).then((data) => renderSimpleCard(data));
  });
}

// Búsqueda por nombre
function cargarBusqueda(nombre) {
  const query = nombre.toLowerCase().trim();
  if (!query) return;

  $(".gallery .row").empty();
  $("#pageIndicator").text(`Resultado para "${query}"`);
  $("#prevPage").prop("disabled", true);

  $.get(`https://pokeapi.co/api/v2/pokemon/${query}`)
    .then((data) => renderSimpleCard(data))
    .catch(() => {
      $(".gallery .row").html(
        '<p class="text-center text-danger">Pokémon no encontrado</p>'
      );
    });
}

// Galería paginada
function cargarGaleria(page) {
  const offset = (page - 1) * limit;
  $(".gallery .row").empty();

  $.get(
    `https://pokeapi.co/api/v2/pokemon?offset=${offset}&limit=${limit}`
  ).then((response) => {
    const totalCount = response.count;
    const totalPages = Math.ceil(totalCount / limit);
    $("#pageIndicator").text(`Página ${page} de ${totalPages}`);
    $("#prevPage").prop("disabled", page === 1);

    response.results.forEach((pokemon) => {
      $.get(pokemon.url).then((data) => renderSimpleCard(data));
    });
  });
}

// Tarjeta estilo Pokédex (3x3)
function renderSimpleCard(data) {
  const tipos = data.types.map((t) => t.type.name);
  const typeIcons = tipos
    .map(
      (t) =>
        `<img src="${TYPE_ICON_BASE}${t}.svg" alt="${t}" title="${t}" width="24" height="24" class="me-1">`
    )
    .join("");

  const card = `
        <div class="col-12 col-md-4">
            <div class="pokemon-tile text-center p-3" onclick="mostrarDetalle('${data.name}')">
                <div class="pokemon-img">
                    <img src="${data.sprites.front_default}" alt="${data.name}" />
                </div>
                <div class="pokemon-number">#${data.id}</div>
                <h5 class="pokemon-name text-capitalize">${data.name}</h5>
                <div class="pokemon-types mb-2">${typeIcons}</div>
                <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); mostrarDetalle('${data.name}')">Ver gráfica</button>
            </div>
        </div>
    `;
  $(".gallery .row").append(card);
}

// Modal con estadísticas
function mostrarDetalle(nombre) {
  $.get(`https://pokeapi.co/api/v2/pokemon/${nombre}`)
    .then((data) => {
      const tipos = data.types.map((t) => t.type.name);
      const typeIcons = tipos
        .map(
          (t) =>
            `<img src="${TYPE_ICON_BASE}${t}.svg" alt="${t}" title="${t}" width="24" height="24" class="me-1">`
        )
        .join("");

      const alturaM = (data.height / 10).toFixed(1);
      const pesoKg = (data.weight / 10).toFixed(1);

      const html = `
                <div class="pokemon-card">
                    <div class="left-info">
                        <img src="${
                          data.sprites.other["official-artwork"]
                            .front_default || data.sprites.front_default
                        }" alt="${data.name}" class="img-fluid mb-3">
                        <h4 class="text-capitalize mb-2">${data.name}</h4>
                        <div class="mb-2">${typeIcons}</div>
                        <p class="mb-1"><strong>Altura:</strong> ${alturaM} m</p>
                        <p class="mb-1"><strong>Peso:</strong> ${pesoKg} kg</p>
                    </div>
                    <div class="right-stats">
                        <div class="stats-wrapper">
                        <h6 class="mb-3">Habilidades</h6>
                        ${renderStatBar(
                          "Velocidad",
                          getStat(data.stats, "speed")
                        )}
                        ${renderStatBar(
                          "Defensa",
                          getStat(data.stats, "defense")
                        )}
                        ${renderStatBar(
                          "Ataque",
                          getStat(data.stats, "attack")
                        )}
                        ${renderStatBar("Vida", getStat(data.stats, "hp"))}
                        </div>
                    </div>
                </div>
            `;

      $("#modalContent").html(html);
      const modal = new bootstrap.Modal(
        document.getElementById("pokemonModal")
      );
      modal.show();
    })
    .catch(() => {
      $("#modalContent").html(
        '<p class="text-center text-danger">No se pudieron cargar los detalles</p>'
      );
      const modal = new bootstrap.Modal(
        document.getElementById("pokemonModal")
      );
      modal.show();
    });
}

// Utilidades
function getStat(stats, name) {
  const stat = stats.find((s) => s.stat.name === name);
  return stat ? stat.base_stat : 0;
}

function renderStatBar(label, value) {
  const pct = Math.max(0, Math.min(100, Math.round((value / 180) * 100)));
  return `
        <div class="stat">
            <span>${label}</span>
            <div class="bar" style="width:${pct}%"></div>
        </div>
    `;
}
function mostrarDetalle(nombre) {
  const modal = new bootstrap.Modal(document.getElementById("pokemonModal"));
  $("#modalContent").html("<p class='text-center'>Cargando...</p>");

  $.get(`https://pokeapi.co/api/v2/pokemon/${nombre}`)
    .then((data) => {
      $.get(`https://pokeapi.co/api/v2/pokemon-species/${nombre}`)
        .then((species) => {
          const tipos = data.types.map((t) => t.type.name);
          const typeIcons = tipos
  .map((t) => `<img src="${TYPE_ICON_BASE}${t}.svg" alt="${t}" title="${t}" width="24" height="24" class="me-1">`)
  .join("");

          const alturaM = (data.height / 10).toFixed(1);
          const pesoKg = (data.weight / 10).toFixed(1);

          const entrada = species.flavor_text_entries.find(
            (entry) => entry.language.name === "es"
          );
          const descripcion = entrada
            ? entrada.flavor_text.replace(/[\f\n\r]/g, " ")
            : "Sin descripción disponible";

          const html = `
            <div class="pokemon-card">
              <div class="left-info">
                <img src="${
                  data.sprites.other["official-artwork"].front_default ||
                  data.sprites.front_default
                }" alt="${data.name}" class="img-fluid mb-3">
                <h4 class="text-capitalize mb-2">${data.name}</h4>
                <div class="mb-2">${typeIcons}</div>
                <p class="mb-1"><strong>Altura:</strong> ${alturaM} m</p>
                <p class="mb-1"><strong>Peso:</strong> ${pesoKg} kg</p>
              </div>
              <div class="right-stats">
                <div class="stats-wrapper">
                  <h6 class="mb-3">Descripción</h6>
                  <p class="mb-3">${descripcion}</p>
                  <h6 class="mb-3">Habilidades</h6>
                  ${renderStatBar("Velocidad", getStat(data.stats, "speed"))}
                  ${renderStatBar("Defensa", getStat(data.stats, "defense"))}
                  ${renderStatBar("Ataque", getStat(data.stats, "attack"))}
                  ${renderStatBar("Vida", getStat(data.stats, "hp"))}
                </div>
              </div>
            </div>
          `;

          $("#modalContent").html(html);
          modal.show();
        })
        .catch(() => {
          $("#modalContent").html(
            "<p class='text-center text-danger'>No se pudo cargar la descripción</p>"
          );
          modal.show();
        });
    })
    .catch(() => {
      $("#modalContent").html(
        "<p class='text-center text-danger'>No se pudieron cargar los detalles</p>"
      );
      modal.show();
    });
}