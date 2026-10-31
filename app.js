"use strict";

const API_USERS = "https://jsonplaceholder.typicode.com/users";
const API_PHOTOS = "https://jsonplaceholder.typicode.com/photos";
const PAGE_SIZE = 50;
const SESSION_KEY = "galeria_usuario";

const app = document.getElementById("app");
const topbar = document.getElementById("topbar");
const userName = document.getElementById("user-name");

const state = {
  photos: null,      // cache da lista (evita nova consulta ao voltar)
  visible: PAGE_SIZE,
  scroll: 0
};

/* ---------- utilidades ---------- */

function esc(text) {
  const d = document.createElement("div");
  d.textContent = text;
  return d.innerHTML;
}

function getSession() {
  try { return JSON.parse(sessionStorage.getItem(SESSION_KEY)); }
  catch { return null; }
}

function setSession(user) {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ id: user.id, username: user.username }));
}

function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

async function getJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("HTTP " + res.status);
  return res.json();
}

function loadingView(text) {
  return `
    <div class="text-center py-5">
      <div class="spinner-border text-primary" role="status"></div>
      <p class="mt-3 mb-0">${text}</p>
    </div>`;
}

/* O serviço via.placeholder.com, usado nas URLs da API, pode estar fora do ar.
   Nesse caso, a imagem é trocada por um quadrado da mesma cor da URL. */
function fallbackSrc(url) {
  const m = url.match(/\/([0-9a-fA-F]{6})(?:\?|$)/);
  const color = m ? "#" + m[1] : "#999999";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10" fill="${color}"/></svg>`;
  return "data:image/svg+xml," + encodeURIComponent(svg);
}

document.addEventListener("error", (e) => {
  const img = e.target;
  if (img.tagName === "IMG" && img.dataset.url && !img.dataset.failed) {
    img.dataset.failed = "1";
    img.src = fallbackSrc(img.dataset.url);
  }
}, true);

/* ---------- tela de login ---------- */

function renderLogin() {
  topbar.classList.add("d-none");
  app.innerHTML = `
    <div class="card shadow-sm login-card">
      <div class="card-body p-4">
        <h1 class="h4 mb-1">Entrar</h1>
        <p class="text-muted small">Acesse a galeria com seu usuário e senha.</p>
        <form id="form-login" novalidate>
          <div class="mb-3">
            <label for="usuario" class="form-label">Usuário</label>
            <input id="usuario" class="form-control" autocomplete="username" autofocus>
          </div>
          <div class="mb-3">
            <label for="senha" class="form-label">Senha</label>
            <input id="senha" type="password" class="form-control" autocomplete="current-password">
          </div>
          <div id="login-erro" class="alert alert-danger py-2 d-none" role="alert"></div>
          <button id="btn-entrar" type="submit" class="btn btn-primary w-100">Entrar</button>
        </form>
      </div>
    </div>`;

  const form = document.getElementById("form-login");
  const erro = document.getElementById("login-erro");
  const btn = document.getElementById("btn-entrar");

  const showError = (msg) => {
    erro.textContent = msg;
    erro.classList.remove("d-none");
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    erro.classList.add("d-none");

    const usuario = document.getElementById("usuario").value.trim();
    const senha = document.getElementById("senha").value.trim();

    if (!usuario || !senha) {
      showError("Preencha o usuário e a senha.");
      return;
    }

    btn.disabled = true;
    btn.textContent = "Verificando...";

    try {
      const users = await getJSON(API_USERS);
      const user = users.find(
        (u) => u.username === usuario && u.email.toLowerCase() === senha.toLowerCase()
      );

      if (!user) {
        showError("Usuário ou senha incorretos. Confira os dados e tente de novo.");
        return;
      }

      setSession(user);
      location.hash = "#/galeria";
    } catch {
      showError("Não foi possível consultar a API de usuários. Verifique sua conexão e tente de novo.");
    } finally {
      btn.disabled = false;
      btn.textContent = "Entrar";
    }
  });
}

/* ---------- galeria (lista) ---------- */

async function renderGallery() {
  app.innerHTML = loadingView("Carregando fotos...");

  if (!state.photos) {
    try {
      state.photos = await getJSON(API_PHOTOS);
    } catch {
      app.innerHTML = `
        <div class="alert alert-danger" role="alert">
          Não foi possível carregar as fotos. Verifique sua conexão e tente de novo.
        </div>
        <button id="btn-retry" class="btn btn-primary">Tentar novamente</button>`;
      document.getElementById("btn-retry").addEventListener("click", renderGallery);
      return;
    }
  }

  drawList();
  window.scrollTo(0, state.scroll);
}

function drawList() {
  const total = state.photos.length;
  const shown = state.photos.slice(0, state.visible);

  app.innerHTML = `
    <h1 class="h4 mb-1">Fotos</h1>
    <p class="text-muted small">Mostrando ${shown.length} de ${total}. Clique em uma foto para ampliar.</p>
    <div class="d-grid gap-2">
      ${shown.map((p) => `
        <a class="photo-item" href="#/foto/${p.id}" data-id="${p.id}">
          <img class="thumb" src="${esc(p.thumbnailUrl)}" data-url="${esc(p.thumbnailUrl)}"
               width="32" height="32" alt="" loading="lazy">
          <span class="photo-title">${p.id}</span>
        </a>`).join("")}
    </div>
    ${shown.length < total
      ? `<div class="text-center mt-3"><button id="btn-more" class="btn btn-outline-primary">Carregar mais ${Math.min(PAGE_SIZE, total - shown.length)} fotos</button></div>`
      : ""}`;

  const more = document.getElementById("btn-more");
  if (more) {
    more.addEventListener("click", () => {
      state.visible += PAGE_SIZE;
      const y = window.scrollY;
      drawList();
      window.scrollTo(0, y);
    });
  }
}

/* guarda a posição da rolagem ao abrir uma foto, para voltar ao mesmo ponto */
app.addEventListener("click", (e) => {
  if (e.target.closest(".photo-item")) state.scroll = window.scrollY;
});

/* ---------- foto ampliada ---------- */

async function renderDetail(id) {
  app.innerHTML = loadingView("Carregando foto...");
  window.scrollTo(0, 0);

  try {
    let photo = state.photos && state.photos.find((p) => String(p.id) === String(id));
    if (!photo) photo = await getJSON(`${API_PHOTOS}/${encodeURIComponent(id)}`);

    app.innerHTML = `
      <a href="#/galeria" class="btn btn-outline-secondary btn-sm mb-3">Voltar à lista</a>
      <article>
        <img class="photo-big mb-3" src="${esc(photo.url)}" data-url="${esc(photo.url)}" alt="Foto ${photo.id}">
        <h1 class="h5 detail-title">${photo.id}</h1>
        <p class="text-muted small mb-0">Foto ${photo.id}</p>
      </article>`;
  } catch {
    app.innerHTML = `
      <div class="alert alert-danger" role="alert">
        Não foi possível carregar essa foto. Ela pode não existir ou a conexão falhou.
      </div>
      <a href="#/galeria" class="btn btn-primary">Voltar à lista</a>`;
  }
}

/* ---------- rotas ---------- */

function router() {
  const session = getSession();
  const hash = location.hash || "#/";
  const [, route, param] = hash.split("/");

  // rotas protegidas
  if (!session) {
    if (route !== "login") {
      location.hash = "#/login";
      return;
    }
    renderLogin();
    return;
  }

  // usuário logado não precisa ver o login
  if (route === "login" || !route) {
    location.hash = "#/galeria";
    return;
  }

  topbar.classList.remove("d-none");
  userName.textContent = session.username;

  if (route === "foto" && param) {
    renderDetail(param);
  } else if (route === "galeria") {
    renderGallery();
  } else {
    location.hash = "#/galeria";
  }
}

document.getElementById("btn-logout").addEventListener("click", () => {
  clearSession();
  state.scroll = 0;
  state.visible = PAGE_SIZE;
  location.hash = "#/login";
});

window.addEventListener("hashchange", router);
window.addEventListener("DOMContentLoaded", router);
