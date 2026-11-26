import { translations, listings } from './content.js';

const language = document.documentElement.lang;
const copy = translations[language];
const panel = document.querySelector('#panel');
const content = document.querySelector('#panel-content');
const catalogs = Object.keys(listings);
const cityName = (city) => language === 'en' && city === 'Beograd' ? 'Belgrade' : city;
const titles = { ...copy, 'new-event': copy.event, 'new-stay': copy.stay };
const pages = ['guests', 'hosts', 'new-event', 'new-stay', ...catalogs];
let adult = false;

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
    results.innerHTML = filtered.map((item) => '<article class="result"><h3>' + item[language][0] +
      '</h3><p>' + cityName(item.city) + ' · ' + (page === 'online' ? copy.demoProfile : copy.example) +
      '</p><p>' + item[language][1] + '</p><button class="button secondary" data-id="' + item.id +
      '" type="button">' + action + '</button></article>').join('') || '<p>' + copy.noResults + '</p>';
  }
  select.addEventListener('change', paintResults);
  results.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-id]');
    if (button) showDemoForm(entries.find((item) => item.id === button.dataset.id), action);
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
  content.innerHTML = '<h2 id="panel-title">' + titles[page] + '</h2>';
  if (page === 'guests') content.innerHTML += '<p>' + copy.guestsIntro + '</p>' + navigation(catalogs);
  if (page === 'hosts') content.innerHTML += '<p>' + copy.hostsIntro + '</p>' + navigation(['new-event', 'new-stay']);
  if (catalogs.includes(page)) {
    content.innerHTML += '<p>' + copy[page + 'Intro'] + '</p>';
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
