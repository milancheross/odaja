import { preparePhoto } from './photos.js';
const errors = {
  invalid_credentials: ['Email ili lozinka nisu ispravni. Lozinka mora imati 12–128 znakova.', 'Invalid email or password. Passwords must contain 12–128 characters.'],
  invalid_profile: ['Proveri podatke profila i potvrdi punoletstvo.', 'Check your profile details and confirm you are an adult.'],
  registration_failed: ['Registracija nije uspela. Ako već imaš nalog, prijavi se.', 'Registration failed. If you already have an account, sign in.'],
  unauthorized: ['Prijavi se ponovo.', 'Please sign in again.'],
  rate_limit: ['Previše pokušaja. Pokušaj ponovo za 15 minuta.', 'Too many attempts. Try again in 15 minutes.'],
  invalid_photo: ['Slika nije podržana. Izaberi JPEG, PNG ili WebP do 5 MB.', 'Unsupported photo. Choose JPEG, PNG or WebP up to 5 MB.'],
  service_unavailable: ['Usluga trenutno nije dostupna. Pokušaj ponovo.', 'Service temporarily unavailable. Please try again.'],
};
async function request(language, body) {
  const response = await fetch('/api/member', body ? {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), credentials: 'same-origin'
  } : { credentials: 'same-origin', cache: 'no-store' });
  const data = await response.json();
  if (!response.ok) {
    const message = errors[data.error] || errors.service_unavailable;
    throw new Error(language === 'sr' ? message[0] : message[1]);
  }
  return data;
}

const t = (language, sr, en) => language === 'sr' ? sr : en;
const field = (label, name, type, attrs = '') => '<label>' + label + '<input name="' + name + '" type="' + type + '" required ' + attrs + '></label>';
const status = (box, message) => { box.querySelector('[role="status"]').textContent = message; };

async function attempt(box, button, operation) {
  button.disabled = true;
  try { await operation(); }
  catch (error) { status(box, error.message); }
  finally { button.disabled = false; }
}

export async function showAccount(box, language) {
  box.innerHTML = '<h2 id="panel-title">' + t(language, 'Moj profil', 'My profile') + '</h2><p role="status"></p>';
  try {
    const result = await request(language);
    if (location.hash !== '#account') return;
    if (result.user) await showProfile(box, language, result.user, result.photos);
    else showAuth(box, language, true);
  } catch (error) { status(box, error.message); }
}

function showAuth(box, language, signup) {
  const label = signup ? t(language, 'Registracija', 'Register') : t(language, 'Prijava', 'Sign in');
  box.innerHTML = '<h2 id="panel-title">' + label + '</h2><form class="fields">' +
    (signup ? field(t(language, 'Nadimak', 'Nickname'), 'nickname', 'text', 'minlength="2" maxlength="40" autocomplete="nickname"') : '') +
    field('Email', 'email', 'email', 'autocomplete="email" maxlength="254"') +
    field(t(language, 'Lozinka', 'Password'), 'password', 'password', 'minlength="12" maxlength="128" autocomplete="' + (signup ? 'new-password' : 'current-password') + '"') +
    (signup ? '<label class="check"><input type="checkbox" required> ' + t(language, 'Imam najmanje 18 godina.', 'I am at least 18.') + '</label>' : '') +
    '<button class="button primary">' + label + '</button></form><button class="button secondary auth-toggle" type="button">' +
    (signup ? t(language, 'Već imam nalog', 'I already have an account') : t(language, 'Napravi nalog', 'Create an account')) +
    '</button><p role="status"></p>';
  box.querySelector('.auth-toggle').addEventListener('click', () => showAuth(box, language, !signup));
  box.querySelector('form').addEventListener('submit', event => {
    event.preventDefault();
    const form = event.currentTarget;
    attempt(box, form.querySelector('button'), async () => {
      const credentials = { email: form.elements.email.value.trim(), password: form.elements.password.value };
      const result = await request(language, {
        action: signup ? 'register' : 'login',
        ...credentials,
        ...(signup ? { nickname: form.elements.nickname.value.trim(), adult: form.querySelector('input[type="checkbox"]').checked } : {})
      });
      await showProfile(box, language, result.user);

    });
  });
}

async function showProfile(box, language, user, photos) {
  const profile = user;
  if (!photos) photos = (await request(language)).photos;
  box.innerHTML = '<h2 id="panel-title">' + t(language, 'Moj profil', 'My profile') + '</h2>' + (user.is_admin ? '<a class="button secondary" href="#admin">' + t(language, 'Administracija slika', 'Manage images') + '</a>' : '') + '<form class="fields">' +
    field(t(language, 'Nadimak', 'Nickname'), 'nickname', 'text', 'minlength="2" maxlength="40"') +
    '<label>' + t(language, 'Grad', 'City') + '<select name="city"><option>Beograd</option><option>Novi Sad</option></select></label><label>' +
    t(language, 'Tip profila', 'Profile type') + '<select name="kind"><option value="solo">' + t(language, 'Pojedinačni profil', 'Solo profile') +
    '</option><option value="couple">' + t(language, 'Par', 'Couple') + '</option></select></label><label>' + t(language, 'O meni / nama', 'About me / us') +
    '<textarea name="bio" maxlength="1000"></textarea></label><button class="button primary">' + t(language, 'Sačuvaj profil', 'Save profile') +
    '</button></form><h3 class="photo-heading">' + t(language, 'Profilne slike · do 3', 'Profile photos · up to 3') + '</h3><p>' +
    t(language, 'JPEG, PNG ili WebP · do 5 MB po slici. Fotografije su privatne, dostupne tebi i administratoru.', 'JPEG, PNG or WebP · up to 5 MB per photo. Photos are private, visible to you and the administrator.') +
    '</p><div class="photos"></div><button class="button secondary signout" type="button">' + t(language, 'Odjavi se', 'Sign out') + '</button><p role="status"></p>';
  const form = box.querySelector('form');
  for (const key of ['nickname','city','kind','bio']) form.elements[key].value = profile[key] || '';
  form.addEventListener('submit', event => {
    event.preventDefault();
    attempt(box, form.querySelector('button'), async () => {
      await request(language, { action: 'profile', ...Object.fromEntries(new FormData(form)) });
      status(box, t(language, 'Profil je sačuvan.', 'Profile saved.'));
    });
  });
  box.querySelector('.signout').addEventListener('click', event => attempt(box, event.currentTarget, async () => {
    await request(language, { action: 'logout' });
    showAuth(box, language, false);
  }));
  for (let slot = 1; slot <= 3; slot++) await photoSlot(box, language, slot, photos.includes(slot));
}

async function photoSlot(box, language, slot, present) {
  const element = document.createElement('div');
  element.className = 'photo-slot';
  const label = t(language, 'Slika ', 'Photo ') + slot;
  element.innerHTML = '<div class="photo-preview"></div><label>' + label + '<input type="file" accept="image/jpeg,image/png,image/webp"></label><button class="button secondary" type="button">' + t(language, 'Ukloni sliku', 'Remove photo') + '</button>';
  box.querySelector('.photos').append(element);
  const remove = element.querySelector('button');
  function refresh() {
    const preview = element.querySelector('.photo-preview');
    preview.replaceChildren();
    remove.disabled = !present;
    if (present) {
      const image = document.createElement('img');
      image.src = '/api/photo?slot=' + slot + '&v=' + Date.now();
      image.alt = label;
      preview.append(image);
    }
  }
  refresh();
  element.querySelector('input').addEventListener('change', event => {
    const input = event.currentTarget;
    const file = input.files[0];
    if (!file) return;
    attempt(box, remove, async () => {
      input.disabled = true;
      try {
        const data = await preparePhoto(file, language);
        await request(language, { action: 'upload', slot, data });
        present = true;
        refresh();
        status(box, t(language, 'Slika je sačuvana.', 'Photo saved.'));
      } finally { input.value = ''; input.disabled = false; }
    });
  });
  remove.addEventListener('click', () => attempt(box, remove, async () => {
    await request(language, { action: 'remove', slot });
    present = false;
    refresh();
    status(box, t(language, 'Slika je uklonjena.', 'Photo removed.'));
  }));
}

export function showDemoChat(box, profile, language) {
  box.innerHTML = '<h2 id="panel-title"></h2><p>' + t(language, 'Probni profil · Automatski demonstracioni odgovori. Dopisivanje se čuva samo u ovom pregledaču.', 'Demo profile · Automated sample replies. Messages are stored only in this browser.') +
    '</p><div class="chat-log" role="log" aria-live="polite"></div><form class="fields"><label>' + t(language, 'Poruka', 'Message') +
    '<textarea name="message" required maxlength="1000"></textarea></label><button class="button primary">' + t(language, 'Pošalji probnu poruku', 'Send demo message') + '</button></form><p role="status"></p>';
  box.querySelector('h2').textContent = profile[language][0];
  const key = 'odaja:chat:' + language + ':' + profile.id;
  let messages = [];
  try {
    const stored = JSON.parse(localStorage.getItem(key));
    if (Array.isArray(stored)) messages = stored.filter(item => typeof item?.body === 'string' && ['you','demo'].includes(item.sender)).slice(-100);
  } catch { /* Start fresh when local history is unavailable. */ }
  const log = box.querySelector('.chat-log');
  function paint() {
    log.replaceChildren();
    for (const message of messages) {
      const bubble = document.createElement('p');
      bubble.className = 'bubble ' + message.sender;
      bubble.textContent = (message.sender === 'demo' ? t(language, 'Demo odgovor · ', 'Demo reply · ') : '') + message.body;
      log.append(bubble);
    }
    log.scrollTop = log.scrollHeight;
  }
  paint();
  box.querySelector('form').addEventListener('submit', event => {
    event.preventDefault();
    const form = event.currentTarget;
    const body = form.elements.message.value.trim();
    if (!body) return;
    const replies = [
      t(language, 'Ovo je primer odgovora probnog profila. Koji grad bi izabrao/la za druženje?', 'This is a demo profile reply. Which city would you choose for a gathering?'),
      t(language, 'U budućem razgovoru sa stvarnim članom ovde bi stigla njegova poruka.', 'In a conversation with a real member, their message would appear here.'),
      t(language, 'Možeš pogledati predloge spa druženja u sekciji Događaji.', 'You can explore proposed spa gatherings in Events.'),
    ];
    const reply = replies[(messages.length / 2) % replies.length];
    messages.push({ sender: 'you', body }, { sender: 'demo', body: reply });
    messages = messages.slice(-100);
    try { localStorage.setItem(key, JSON.stringify(messages)); }
    catch { status(box, t(language, 'Pregledač nije dozvolio čuvanje razgovora.', 'This browser did not allow conversation storage.')); }
    paint();
    form.reset();
  });
}
