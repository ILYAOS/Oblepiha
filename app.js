const sections = window.OBLEPIHA_CONTENT || [];
const content = document.getElementById("content");
const nav = document.getElementById("nav");
const backButton = document.getElementById("back-button");
const overlayRoot = document.getElementById("overlay-root");
let currentView = "home";
let currentGallery = [];
let lightboxIndex = 0;
let touchStartX = 0;
let maxBackHandler = null;

const icons = {
  arrow: '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/>',
  file: '<path d="M6 2h8l4 4v16H6z"/><path d="M14 2v5h5M9 13h6M9 17h6"/>',
  empty: '<path d="M4 19V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v11"/><path d="M2 19h20M9 10h6M9 14h4"/>'
};

const svg = (name) => `<svg viewBox="0 0 24 24" aria-hidden="true">${icons[name]}</svg>`;
const escapeHtml = (value = "") => String(value).replace(/[&<>\"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[char]);
const coverHints = { banket: "Дыши полной грудью", rooms: "Здесь даже будильник" };
const firstImage = (section) => {
  const hint = coverHints[section.key];
  return section.items.find((item) => item.kind === "image" && item.name.includes(hint))?.url
    || section.items.find((item) => item.kind === "image")?.url
    || "";
};

function getFirstName() {
  const user = window.WebApp?.initDataUnsafe?.user || window.MAX?.WebApp?.initDataUnsafe?.user;
  return user?.first_name || user?.name || "Гость";
}

function setBackButton() {
  const webApp = window.WebApp;
  if (maxBackHandler && webApp?.BackButton?.offClick) webApp.BackButton.offClick(maxBackHandler);
  maxBackHandler = () => changeView("home");
  nav.hidden = currentView === "home";
  nav.style.display = currentView === "home" ? "none" : "flex";
  if (currentView === "home") webApp?.BackButton?.hide?.();
  else {
    webApp?.BackButton?.show?.();
    webApp?.BackButton?.onClick?.(maxBackHandler);
  }
}

function changeView(view) {
  closeOverlay();
  currentView = view;
  setBackButton();
  window.scrollTo({ top: 0, behavior: "smooth" });
  if (view === "home") renderHome();
  else if (view === "events") renderEvents();
  else renderSection(sections.find((section) => section.key === view));
}

function renderHome() {
  const firstName = escapeHtml(getFirstName());
  content.innerHTML = `<div class="page home-page">
    <section class="hero">
      <p class="hello">${firstName}, рады вам</p>
      <h1>Добро пожаловать<br>в «Облепиху»</h1>
    </section>
    <section class="card-grid" aria-label="Разделы отеля">
      ${sections.map((section, index) => `<button class="place-card ${index === 0 ? "large" : ""}" type="button" data-view="${section.key}">
        <span class="place-photo" style="background-image:url('${firstImage(section)}')"></span>
        <span class="place-shade"></span>
        <span class="place-copy"><small>${escapeHtml(section.eyebrow)}</small><h2>${escapeHtml(section.title)}</h2><p>${escapeHtml(section.description)}</p></span>
        <span class="round-arrow">${svg("arrow")}</span>
      </button>`).join("")}
    </section>
    <button class="event-tile" type="button" data-view="events">
      <span class="event-icon">${svg("calendar")}</span>
      <span class="event-copy"><small>Афиша отеля</small><strong>События</strong><span>Встречи и особые вечера</span></span>
      ${svg("arrow")}
    </button>
  </div>`;
}

function renderSection(section) {
  if (!section) return changeView("home");
  const items = section.items;
  const images = items.filter((item) => item.kind === "image");
  const videos = items.filter((item) => item.kind === "video");
  const documents = items.filter((item) => item.kind === "pdf");
  currentGallery = images;

  content.innerHTML = `<div class="page detail-page">
    <section class="detail-head"><span class="eyebrow">${escapeHtml(section.eyebrow)}</span><h1>${escapeHtml(section.title)}</h1><p>${escapeHtml(section.description)}</p></section>
    ${documents.map((item) => `<article class="document-card">
      <span class="document-icon">${svg("file")}</span>
      <div><h2>${escapeHtml(item.name)}</h2><p>PDF · доступен без перехода на диск</p></div>
      <div class="document-actions"><button type="button" data-pdf="${item.url}">Открыть</button><a href="${item.url}" download>Скачать</a></div>
    </article>`).join("")}
    ${images.length ? `<div class="media-list images">${images.map((item, index) => `<figure class="media-card"><button class="media-button" type="button" data-image-index="${index}"><img src="${item.url}" alt="${escapeHtml(item.name)}" loading="lazy"></button></figure>`).join("")}</div>` : ""}
    ${videos.length ? `<div class="media-list videos">${videos.map((item) => `<article class="video-card"><video src="${item.url}" aria-label="${escapeHtml(item.name)}" controls playsinline preload="metadata"></video></article>`).join("")}</div>` : ""}
    ${!images.length && !videos.length && !documents.length ? emptyState("В этом разделе пока тихо", "Скоро здесь появятся новые материалы.") : ""}
  </div>`;
}

function emptyState(title, text) {
  return `<div class="empty"><div>${svg("empty")}<strong>${escapeHtml(title)}</strong><p>${escapeHtml(text)}</p></div></div>`;
}

function renderEvents() {
  content.innerHTML = `<div class="page events-page"><section class="detail-head"><span class="eyebrow">Афиша отеля</span><h1>События</h1><p>Встречи, праздники и особые вечера в «Облепихе».</p></section>${emptyState("Новые события скоро", "Загляните сюда чуть позже.")}</div>`;
}

function openImage(index) {
  if (!currentGallery.length) return;
  lightboxIndex = (index + currentGallery.length) % currentGallery.length;
  const item = currentGallery[lightboxIndex];
  overlayRoot.innerHTML = `<div class="lightbox" role="dialog" aria-modal="true">
    <button class="overlay-close" type="button" aria-label="Закрыть">×</button>
    <button class="lightbox-nav lightbox-prev" type="button" data-shift="-1" aria-label="Предыдущее фото">${svg("arrow")}</button>
    <img src="${item.url}" alt="${escapeHtml(item.name)}">
    <button class="lightbox-nav lightbox-next" type="button" data-shift="1" aria-label="Следующее фото">${svg("arrow")}</button>
  </div>`;
}

function openPdf(url) {
  overlayRoot.innerHTML = `<div class="pdf-viewer" role="dialog" aria-modal="true"><button class="overlay-close" type="button" aria-label="Закрыть">×</button><iframe src="${url}" title="PDF"></iframe></div>`;
}

function closeOverlay() { overlayRoot.innerHTML = ""; }

document.addEventListener("click", (event) => {
  const view = event.target.closest("[data-view]");
  if (view) return changeView(view.dataset.view);
  const image = event.target.closest("[data-image-index]");
  if (image) return openImage(Number(image.dataset.imageIndex));
  const shift = event.target.closest("[data-shift]");
  if (shift) return openImage(lightboxIndex + Number(shift.dataset.shift));
  const pdf = event.target.closest("[data-pdf]");
  if (pdf) return openPdf(pdf.dataset.pdf);
  if (event.target.closest(".overlay-close")) return closeOverlay();
});

document.addEventListener("keydown", (event) => {
  if (!overlayRoot.firstChild) return;
  if (event.key === "Escape") closeOverlay();
  if (event.key === "ArrowLeft" && overlayRoot.querySelector(".lightbox")) openImage(lightboxIndex - 1);
  if (event.key === "ArrowRight" && overlayRoot.querySelector(".lightbox")) openImage(lightboxIndex + 1);
});

overlayRoot.addEventListener("touchstart", (event) => { touchStartX = event.changedTouches[0].clientX; }, { passive: true });
overlayRoot.addEventListener("touchend", (event) => {
  if (!overlayRoot.querySelector(".lightbox")) return;
  const delta = event.changedTouches[0].clientX - touchStartX;
  if (Math.abs(delta) > 55) openImage(lightboxIndex + (delta < 0 ? 1 : -1));
}, { passive: true });

backButton.addEventListener("click", () => changeView("home"));
window.WebApp?.ready?.();
setBackButton();
renderHome();
