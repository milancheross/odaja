import { listings } from './content.js';
import { preparePhoto } from './photos.js';
const t = (language, sr, en) => language === 'sr' ? sr : en;

async function adminRequest(body, search = '') {
  const response = await fetch('/api/admin' + (body ? '' : '?search=' + encodeURIComponent(search)), body ? {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', body: JSON.stringify(body)
  } : { credentials: 'same-origin', cache: 'no-store' });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'service_unavailable');
  return data;
}

export async function showAdmin(container, language) {
  container.innerHTML = '<h2 id="panel-title">' + t(language, 'Administracija slika', 'Manage images') + '</h2><p role="status"></p>';
  const notice = container.querySelector('[role="status"]');
  let members;
  try { members = (await adminRequest()).members; }
  catch {
    notice.textContent = t(language, 'Ova stranica je dostupna administratoru. Prijavi se nalogom sa administratorskim pravima.', 'This page is available to administrators. Sign in with an administrator account.');
    const link = document.createElement('a');
    link.href = '#account';
    link.className = 'button primary';
    link.textContent = t(language, 'Prijava', 'Sign in');
    container.append(link);
    return;
  }
  if (location.hash !== '#admin') return;
  container.insertAdjacentHTML('beforeend', '<div class="fields"><label>' + t(language, 'Uređujem', 'Manage') +
    '<select id="media-kind"><option value="listing">' + t(language, 'Slike oglasa', 'Listing images') +
    '</option><option value="member">' + t(language, 'Slike članova', 'Member photos') +
    '</option><option value="demo">' + t(language, 'Slike probnih profila', 'Demo profile photos') +
    '</option></select></label><form class="member-search" hidden><label>' + t(language, 'Pretraga po nadimku ili emailu', 'Search by nickname or email') +
    '<input type="search" name="search" maxlength="100"></label><button class="button secondary">' + t(language, 'Pretraži', 'Search') +
    '</button></form><label>' + t(language, 'Izaberi profil ili oglas', 'Choose a profile or listing') +
    '<select id="media-target"></select></label></div><p>' +
    t(language, 'Do tri slike po profilu ili oglasu. Prva slika oglasa prikazuje se na kartici. JPEG, PNG ili WebP do 5 MB.', 'Up to three images per profile or listing. The first listing image appears on the card. JPEG, PNG or WebP up to 5 MB.') +
    '</p><div class="photos"></div>');
  const kind = container.querySelector('#media-kind');
  const target = container.querySelector('#media-target');
  const search = container.querySelector('.member-search');
  function targets() {
    search.hidden = kind.value !== 'member';
    const items = kind.value === 'listing' ? [...listings.events, ...listings.stays] : kind.value === 'demo' ? listings.online : members;
    target.replaceChildren();
    for (const item of items) {
      const option = document.createElement('option');
      option.value = item.id;
      option.textContent = kind.value === 'member' ? item.nickname + ' · ' + item.email : item[language][0];
      target.append(option);
    }
    renderSlots();
  }
  async function renderSlots() {
    const current = { kind: kind.value, targetId: target.value };
    const gallery = container.querySelector('.photos');
    gallery.replaceChildren();
    if (!current.targetId) {
      notice.textContent = t(language, 'Nema profila za ovaj izbor.', 'No matching profiles.');
      return;
    }
    notice.textContent = '';
    let manifest = [];
    if (current.kind !== 'member') {
      try { manifest = (await (await fetch('/api/media?manifest=1')).json()).media; }
      catch { notice.textContent = t(language, 'Slike trenutno nisu dostupne.', 'Images are temporarily unavailable.'); return; }
    }
    if (kind.value !== current.kind || target.value !== current.targetId || location.hash !== '#admin') return;
    for (let slot = 1; slot <= 3; slot++) {
      const wrapper = document.createElement('div');
      wrapper.className = 'photo-slot';
      wrapper.innerHTML = '<div class="photo-preview"></div><label>' + t(language, 'Slika ', 'Image ') + slot +
        '<input type="file" accept="image/jpeg,image/png,image/webp"></label><button class="button secondary" type="button">' +
        t(language, 'Ukloni sliku', 'Remove image') + '</button>';
      gallery.append(wrapper);
      const input = wrapper.querySelector('input');
      const remove = wrapper.querySelector('button');
      let fallback = current.kind === 'listing' && slot === 1 ? [...listings.events, ...listings.stays].find(item => item.id === current.targetId)?.image : '';
      const custom = manifest.some(item => item.kind === current.kind && item.target_id === current.targetId && item.slot === slot);
      const url = () => current.kind === 'member' ? '/api/photo?slot=' + slot + '&memberId=' + current.targetId + '&v=' + Date.now()
        : '/api/media?kind=' + current.kind + '&id=' + current.targetId + '&slot=' + slot + '&v=' + Date.now();
      function preview(src) {
        const holder = wrapper.querySelector('.photo-preview');
        holder.replaceChildren();
        if (!src) return;
        const image = document.createElement('img');
        image.src = src;
        image.alt = t(language, 'Slika ', 'Image ') + slot;
        image.addEventListener('error', () => holder.replaceChildren(), { once: true });
        holder.append(image);
      }
      preview(current.kind === 'member' || custom ? url() : fallback);
      async function edit(action, file) {
        input.disabled = remove.disabled = true;
        try {
          const data = file ? await preparePhoto(file, language) : undefined;
          await adminRequest({ ...current, slot, action, data });
          preview(action === 'upload' ? url() : fallback);
          notice.textContent = t(language, 'Slika je sačuvana. Promena je dostupna na sajtu.', 'Image saved. The change is available on the site.');
          window.dispatchEvent(new Event('odaja-media-updated'));
        } catch {
          notice.textContent = t(language, 'Promena nije uspela. Proveri sliku i pokušaj ponovo.', 'Could not save the change. Check the image and try again.');
        } finally {
          input.disabled = remove.disabled = false;
          input.value = '';
        }
      }
      input.addEventListener('change', () => { if (input.files[0]) edit('upload', input.files[0]); });
      remove.addEventListener('click', () => edit('remove'));
    }
  }
  kind.addEventListener('change', targets);
  target.addEventListener('change', renderSlots);
  search.addEventListener('submit', async event => {
    event.preventDefault();
    const button = search.querySelector('button');
    button.disabled = true;
    try { members = (await adminRequest(undefined, search.elements.search.value.trim())).members; targets(); }
    catch { notice.textContent = t(language, 'Pretraga nije uspela.', 'Search failed.'); }
    finally { button.disabled = false; }
  });
  targets();
}
