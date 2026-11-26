import { showAdmin } from './admin.js';
import { showAccount, showDemoChat } from './members.js';
import { translations, listings } from './content.js';

const language = document.documentElement.lang;
const copy = translations[language];
const panel = document.querySelector('#panel');
const content = document.querySelector('#panel-content');
const catalogs = Object.keys(listings);
const cityName = (city) => language === 'en' && city === 'Beograd' ? 'Belgrade' : city;
const titles = { ...copy, 'new-event': copy.event, 'new-stay': copy.stay };
const pages = ['guests', 'hosts', 'new-event', 'new-stay', ...catalogs, 'account', 'admin'];
let adult = false;
let media = [];
const illustration = language === 'sr' ? 'AI ilustracija' : 'AI illustration';

function photosFor(item, page) {
  const kind = page === 'online' ? 'demo' : 'listing';
  const custom = media.filter(image => image.kind === kind && image.target_id === item.id);
  const photos = custom.map(image => ({ slot: image.slot, url: '/api/media?kind=' + kind + '&id=' + item.id + '&slot=' + image.slot + '&v=' + image.version, custom: true }));
  if (item.image && !photos.some(image => image.slot === 1)) photos.push({ slot: 1, url: item.image, custom: false });
  return photos.sort((a,b) => a.slot - b.slot);
}

function imageGallery(item, page, compact = false) {
  const photos = photosFor(item, page);
  if (!photos.length) return '';
  const caption = photos[0].custom ? (language === 'sr' ? 'Slika oglasa' : 'Listing image') : illustration;
  return '<figure class="listing-gallery"><img class="listing-photo" src="' + photos[0].url + '" alt="' + item[language][0] + '" width="1200" height="800" loading="lazy"><figcaption>' + caption +
    '</figcaption>' + (photos.length > 1 && !compact ? '<div class="thumbnails">' + photos.map((image, index) =>
    '<button type="button" data-photo="' + image.url + '" data-custom="' + image.custom + '" aria-label="' + (language === 'sr' ? 'Prikaži sliku ' : 'Show image ') + (index + 1) + '"><img src="' + image.url + '" alt="" loading="lazy"></button>').join('') + '</div>' : '') + '</figure>';
}

function catalogCard(item, page) {
  const action = { events: copy.request, stays: copy.inquiry, online: copy.invite }[page];
  const label = page === 'online' ? copy.demoProfile : page === 'events' ? (language === 'sr' ? 'Predlog događaja · Nepotvrđen' : 'Proposed event · Unconfirmed') : copy.example;
  return '<article class="result">' + imageGallery(item, page) + '<h3>' + item[language][0] + '</h3><p>' + cityName(item.city) + ' · ' + label +
    '</p>' + (item.venue ? '<p>' + item.venue + '</p><a class="source" href="' + item.source + '" target="_blank" rel="noopener noreferrer">' +
    (language === 'sr' ? 'Zvanični sajt centra' : 'Official venue website') + '</a>' : '') + '<p>' + item[language][1] +
    '</p><button class="button secondary" data-id="' + item.id + '" type="button">' + action + '</button></article>';
}

function connectGalleries(root) {
  root.querySelectorAll('[data-photo]').forEach(button => button.addEventListener('click', () => {
    const figure = button.closest('figure');
    figure.querySelector('.listing-photo').src = button.dataset.photo;
    figure.querySelector('figcaption').textContent = button.dataset.custom === 'true' ? (language === 'sr' ? 'Slika oglasa' : 'Listing image') : illustration;
  }));
}

function renderFeatured() {
  const featured = document.querySelector('#featured');
  featured.innerHTML = '<h2>' + (language === 'sr' ? 'Događaji i apartmani' : 'Events and apartments') + '</h2><div class="featured-grid">' +
    [...listings.events.map(item => ({ item, page: 'events' })), ...listings.stays.map(item => ({ item, page: 'stays' }))].map(({item, page}) =>
    '<article><a href="#' + page + '">' + imageGallery(item, page, true) + '<h3>' + item[language][0] + '</h3><p>' + cityName(item.city) +
    ' · ' + (page === 'events' ? (language === 'sr' ? 'Nepotvrđen predlog' : 'Unconfirmed proposal') : copy.example) + '</p></a></article>').join('') + '</div>';
}

async function refreshMedia() {
  try {
    const response = await fetch('/api/media?manifest=1', { cache: 'no-store' });
    if (!response.ok) return;
    media = (await response.json()).media;
    renderFeatured();
    if (catalogs.includes(location.hash.slice(1)) && content.querySelector('.results')) render();
  } catch { /* Default illustrations remain available when custom media cannot load. */ }
}


function navigation(destinations) {
  return '<nav class="panel-nav">' + destinations.map((destination) =>
    '<a class="button secondary" href="#' + destination + '">' + titles[destination] + '</a>'
  ).join('') + '</nav>';
}

function announcement(message) {
  content.querySelector('#notice').textContent = message;
}

function showDemoForm(item, action) {
  content.innerHTML = '<h2 id="panel-title">' + action + '</h2><p>' + item[language][0] + ' · ' + copy.demoNote +
    '</p><form class="fields"><label>' + copy.nickname + '<input name="nickname" required maxlength="40"></label><label>' +
    copy.message + '<textarea name="message" required maxlength="500"></textarea></label><button class="button primary">' +
    copy.try + '</button></form><p id="notice" role="status"></p>';
  content.querySelector('form').addEventListener('submit', (event) => {
    event.preventDefault();
    event.currentTarget.reset();
    announcement(copy.done);
  });
  content.querySelector('input').focus();
}

function showCatalog(page) {
  if (page === 'online' && !adult) {
    content.innerHTML += '<p>' + copy.ageRequired + '</p><button class="button primary" type="button">' + copy.adult + '</button>';
    content.querySelector('button').addEventListener('click', () => {
      adult = true;
      render();
      content.querySelector('select').focus();
    });
    return;
  }

  const entries = listings[page];
  const cities = [...new Set(entries.map((item) => item.city))];
  const action = { events: copy.request, stays: copy.inquiry, online: copy.invite }[page];

  content.innerHTML += '<label>' + copy.city + '<select><option value="">' + copy.all + '</option>' +
    cities.map((city) => '<option value="' + city + '">' + cityName(city) + '</option>').join('') +
    '</select></label><div class="results" aria-live="polite"></div>';
  const select = content.querySelector('select');
  const results = content.querySelector('.results');
  function paintResults() {
    const filtered = select.value ? entries.filter((item) => item.city === select.value) : entries;
    results.innerHTML = filtered.map(item => catalogCard(item, page)).join('') || '<p>' + copy.noResults + '</p>';
    connectGalleries(results);

  }
  select.addEventListener('change', paintResults);
  results.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-id]');
    if (button) {
      const item = entries.find((entry) => entry.id === button.dataset.id);
      if (page === 'online') showDemoChat(content, item, language);
      else showDemoForm(item, action);
    }
  });
  paintResults();
}

function showDraft(page) {
  const key = 'odaja:draft:' + page;
  content.innerHTML += '<p>' + copy.hostsIntro + ' ' + copy.demoNote + '</p><form class="fields"><label>' +
    copy.title + '<input name="title" required maxlength="90"></label><label>' + copy.city +
    '<input name="city" required maxlength="60"></label><label>' + copy.description +
    '<textarea name="description" required maxlength="1400"></textarea></label><button class="button primary">' +
    copy.save + '</button><button type="button" class="button secondary" id="delete-draft">' + copy.clear +
    '</button></form><p id="notice" role="status"></p>';
  const form = content.querySelector('form');
  try {
    const saved = JSON.parse(localStorage.getItem(key)) ?? {};
    for (const field of ['title', 'city', 'description']) {
      form.elements[field].value = typeof saved[field] === 'string' ? saved[field] : '';
    }
  } catch {
    announcement(copy.storageError);
  }
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    try {
      localStorage.setItem(key, JSON.stringify(Object.fromEntries(new FormData(form))));
      announcement(copy.saved);
    } catch {
      announcement(copy.storageError);
    }
  });
  content.querySelector('#delete-draft').addEventListener('click', () => {
    try {
      localStorage.removeItem(key);
      form.reset();
      announcement(copy.cleared);
    } catch {
      announcement(copy.storageError);
    }
  });
}

function render() {
  const page = location.hash.slice(1);
  if (!pages.includes(page)) {
    if (panel.open) panel.close();
    return;
  }
  content.innerHTML = '<h2 id="panel-title">' + (page === 'admin' ? (language === 'sr' ? 'Administracija slika' : 'Manage images') : page === 'account' ? (language === 'sr' ? 'Moj profil' : 'My profile') : titles[page]) + '</h2>';
  if (page === 'account') showAccount(content, language);
  if (page === 'admin') showAdmin(content, language);
  if (page === 'guests') content.innerHTML += '<p>' + copy.guestsIntro + '</p>' + navigation(catalogs) + '<p><a class="button primary" href="#account">' + (language === 'sr' ? 'Registracija / Moj profil' : 'Register / My profile') + '</a></p>';
  if (page === 'hosts') content.innerHTML += '<p>' + copy.hostsIntro + '</p>' + navigation(['new-event', 'new-stay']);
  if (catalogs.includes(page)) {
    content.innerHTML += '<p>' + copy[page + 'Intro'] + '</p>';
    if (page === 'events') content.innerHTML += '<p>' + (language === 'sr' ? 'Tri predloga druženja. Spa centri nisu potvrdili organizaciju, termine ni partnerstvo sa ODAJOM.' : 'Three proposed gatherings. Venues have not confirmed hosting, dates or partnership with ODAJA.') + '</p>';
    showCatalog(page);
  }
  if (page.startsWith('new-')) showDraft(page);
  if (!panel.open) panel.showModal();
  document.querySelector('#close-panel').focus();
}

document.querySelector('#close-panel').addEventListener('click', () => panel.close());
panel.addEventListener('close', () => {
  if (pages.includes(location.hash.slice(1))) {
    history.replaceState(null, '', location.pathname + location.search);
  }
});
window.addEventListener('hashchange', render);
render();

renderFeatured();
refreshMedia();
window.addEventListener('odaja-media-updated', refreshMedia);
