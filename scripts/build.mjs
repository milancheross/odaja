import { build } from 'esbuild';
import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';

const source = new URL('../site/', import.meta.url);
const output = new URL('../dist/', import.meta.url);
const template = await readFile(new URL('index.html', source), 'utf8');
const locales = {
  sr: { account: 'Moj profil', title: 'Kad se grad utiša.', description: 'Privatni događaji, dnevni odmor i upoznavanje online u Srbiji.', demo: 'Demo verzija', skip: 'Preskoči na sadržaj', events: 'Događaji', stays: 'Dnevni odmor', online: 'Upoznavanje online', guests: 'Za goste', hosts: 'Za organizatore', close: 'Zatvori' },
  en: { account: 'My profile', title: 'When the city goes quiet.', description: 'Private events, day stays and online introductions in Serbia.', demo: 'Demo version', skip: 'Skip to content', events: 'Events', stays: 'Day stays', online: 'Meet online', guests: 'For guests', hosts: 'For hosts', close: 'Close' },
};

await rm(output, { recursive: true, force: true });
await mkdir(new URL('en/', output), { recursive: true });
await cp(new URL('assets/', source), new URL('assets/', output), { recursive: true });
for (const asset of ['style.css']) {
  await cp(new URL(asset, source), new URL(asset, output));
}
for (const [language, copy] of Object.entries(locales)) {
  const replacements = { ...copy, language, srCurrent: language === 'sr' ? 'aria-current="page"' : '', enCurrent: language === 'en' ? 'aria-current="page"' : '' };
  const html = template.replace(/{{(\w+)}}/g, (_, key) => replacements[key]);
  const file = language === 'sr' ? 'index.html' : 'en/index.html';
  await writeFile(new URL(file, output), html);
}
console.log('Built Serbian and English pages in dist/');

await build({
  entryPoints: [new URL('app.js', source).pathname],
  outfile: new URL('app.js', output).pathname,
  bundle: true,
  format: 'esm',
  minify: true,

});
