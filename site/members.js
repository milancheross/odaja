import { createClient } from '@supabase/supabase-js';

const client = SUPABASE_URL && SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;
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
  if (!client) {
    showAuth(box, language, true);
    for (const field of box.querySelectorAll('input, form button')) field.disabled = true;
    status(box, t(language, 'Registracija se priprema. Aktivacija naloga i čuvanje fotografija biće dostupni nakon povezivanja baze.', 'Registration is being prepared. Accounts and photo storage will be available when the database is connected.'));
    return;
  }
  const { data } = await client.auth.getUser();
  if (location.hash !== '#account') return;
  if (data.user) await showProfile(box, language, data.user);
  else showAuth(box, language, true);
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
  box.querySelector('.auth-toggle').addEventListener('click', () => { if (client) showAuth(box, language, !signup); });
  box.querySelector('form').addEventListener('submit', event => {
    event.preventDefault();
    const form = event.currentTarget;
    attempt(box, form.querySelector('button'), async () => {
      const credentials = { email: form.elements.email.value.trim(), password: form.elements.password.value };
      const result = signup
        ? await client.auth.signUp({ ...credentials, options: { emailRedirectTo: location.origin + location.pathname + '#account', data: { nickname: form.elements.nickname.value.trim() } } })
        : await client.auth.signInWithPassword(credentials);
      if (result.error) throw result.error;
      if (result.data.session) await showProfile(box, language, result.data.user);
      else { form.reset(); status(box, t(language, 'Proveri email i potvrdi nalog, pa se prijavi.', 'Check your email to confirm your account, then sign in.')); }
    });
  });
}

async function showProfile(box, language, user) {
  const { data: profile, error } = await client.from('profiles').select('*').eq('id', user.id).single();
  if (error) { status(box, t(language, 'Profil nije dostupan. Proveri podešavanje baze.', 'Profile unavailable. Check the database setup.')); return; }
  box.innerHTML = '<h2 id="panel-title">' + t(language, 'Moj profil', 'My profile') + '</h2><form class="fields">' +
    field(t(language, 'Nadimak', 'Nickname'), 'nickname', 'text', 'minlength="2" maxlength="40"') +
    '<label>' + t(language, 'Grad', 'City') + '<select name="city"><option>Beograd</option><option>Novi Sad</option></select></label><label>' +
    t(language, 'Tip profila', 'Profile type') + '<select name="kind"><option value="solo">' + t(language, 'Pojedinačni profil', 'Solo profile') +
    '</option><option value="couple">' + t(language, 'Par', 'Couple') + '</option></select></label><label>' + t(language, 'O meni / nama', 'About me / us') +
    '<textarea name="bio" maxlength="1000"></textarea></label><button class="button primary">' + t(language, 'Sačuvaj profil', 'Save profile') +
    '</button></form><h3 class="photo-heading">' + t(language, 'Profilne slike · do 3', 'Profile photos · up to 3') + '</h3><p>' +
    t(language, 'JPEG, PNG ili WebP · do 5 MB po slici. Fotografije su dostupne samo tebi u ovoj verziji.', 'JPEG, PNG or WebP · up to 5 MB per photo. Photos are visible only to you in this version.') +
    '</p><div class="photos"></div><button class="button secondary signout" type="button">' + t(language, 'Odjavi se', 'Sign out') + '</button><p role="status"></p>';
  const form = box.querySelector('form');
  for (const key of ['nickname','city','kind','bio']) form.elements[key].value = profile[key] || '';
  form.addEventListener('submit', event => {
    event.preventDefault();
    attempt(box, form.querySelector('button'), async () => {
      const { error } = await client.from('profiles').update(Object.fromEntries(new FormData(form))).eq('id', user.id);
      if (error) throw error;
      status(box, t(language, 'Profil je sačuvan.', 'Profile saved.'));
    });
  });
  box.querySelector('.signout').addEventListener('click', event => attempt(box, event.currentTarget, async () => {
    const { error } = await client.auth.signOut();
    if (error) throw error;
    showAuth(box, language, false);
  }));
  for (let slot = 1; slot <= 3; slot++) await photoSlot(box, language, user.id, slot);
}

async function photoSlot(box, language, userId, slot) {
  const element = document.createElement('div');
  element.className = 'photo-slot';
  const label = t(language, 'Slika ', 'Photo ') + slot;
  element.innerHTML = '<div class="photo-preview"></div><label>' + label + '<input type="file" accept="image/jpeg,image/png,image/webp"></label><button class="button secondary" type="button">' + t(language, 'Ukloni sliku', 'Remove photo') + '</button>';
  box.querySelector('.photos').append(element);
  const path = userId + '/' + slot;
  const storage = client.storage.from('profile-photos');
  const remove = element.querySelector('button');
  async function refresh() {
    const { data, error } = await storage.createSignedUrl(path, 300);
    const preview = element.querySelector('.photo-preview');
    preview.replaceChildren();
    if (!error) { const image = document.createElement('img'); image.src = data.signedUrl; image.alt = label; preview.append(image); }
  }
  await refresh();
  element.querySelector('input').addEventListener('change', event => {
    const input = event.currentTarget;
    const file = input.files[0];
    if (!file) return;
    attempt(box, remove, async () => {
      input.disabled = true;
      try {
        if (!['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 5242880) throw new Error(t(language, 'Izaberi JPEG, PNG ili WebP do 5 MB.', 'Choose a JPEG, PNG or WebP up to 5 MB.'));
        const bitmap = await createImageBitmap(file);
        bitmap.close();
        const { error } = await storage.upload(path, file, { upsert: true, contentType: file.type });
        if (error) throw error;
        await refresh();
        status(box, t(language, 'Slika je sačuvana.', 'Photo saved.'));
      } finally { input.value = ''; input.disabled = false; }
    });
  });
  remove.addEventListener('click', () => attempt(box, remove, async () => {
    const { error } = await storage.remove([path]);
    if (error) throw error;
    await refresh();
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
