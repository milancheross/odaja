# ODAJA

Dvojezičan interaktivni prototip za privatne događaje, apartmane za dnevni odmor i online upoznavanje. Vizuelni pravac je Kuća mesečine.

## Lokalno pokretanje

Pokreni `npm run dev` i otvori `http://localhost:4173/`. Potrebni su Node.js i Python 3. Pre prvog pokretanja instalirati zavisnosti sa npm ci.

`npm run build` generiše statički sajt u `dist/`, sa srpskom verzijom na `/` i engleskom na `/en/`. Vercel podešavanja su u `vercel.json`. Nakon povezivanja Git repozitorijuma produkcijska grana treba da bude `main`.

## Opseg prototipa

Oglasi i profili su izmišljeni. Filteri, navigacija i obrasci su interaktivni. Nacrt organizatora čuva se samo u trenutnom pregledaču. Demo obrasci ne šalju poruke, prijave niti rezervacije. Registracija i privatne fotografije koriste Neon. Moderacija i stvarni razgovori među članovima tek treba da budu dodati.

## Registracija i slike

Registracija, prijava i privatne fotografije koriste Neon PostgreSQL preko Vercel funkcija u api/.
DATABASE_URL je serverska promenljiva koju postavlja Neon integracija. Lozinke se čuvaju kao scrypt hash, a nasumične sesije u HttpOnly Secure SameSite kolačiću. U bazi se čuva samo hash sesije.

Tabele sa prefiksom odaja_ kreiraju se u transakciji pri prvom API zahtevu. Tri numerisana slota po korisniku i SQL ograničenja garantuju najviše tri fotografije i pri konkurentnim uploadovima. Fotografije su dostupne samo vlasniku profila. Klijent prihvata JPEG/PNG/WebP do 5 MB, optimizuje fotografiju, a server proverava i ponovo kodira WebP do 2 MB bez EXIF metapodataka.

Registracija koristi email i lozinku bez email potvrde. Oporavak zaboravljene lozinke i slanje emailova nisu implementirani.

Pedeset izmišljenih profila imaju jasno označene automatske demo odgovore. Razgovori ostaju u pregledaču.

Tri spa oglasa su nepotvrđeni predlozi. Izvori potvrđuju postojanje spa centara, dok termini, zakup i organizatori čekaju potvrdu.

Lokalni statički pregled pokreće npm run dev. Za lokalni API koristiti Vercel CLI sa Neon okruženjem.
