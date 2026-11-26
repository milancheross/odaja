# ODAJA

Dvojezičan interaktivni prototip za privatne događaje, apartmane za dnevni odmor i online upoznavanje. Vizuelni pravac je Kuća mesečine.

## Lokalno pokretanje

Pokreni `npm run dev` i otvori `http://localhost:4173/`. Potrebni su Node.js i Python 3. Pre prvog pokretanja instalirati zavisnosti sa npm ci.

`npm run build` generiše statički sajt u `dist/`, sa srpskom verzijom na `/` i engleskom na `/en/`. Vercel podešavanja su u `vercel.json`. Nakon povezivanja Git repozitorijuma produkcijska grana treba da bude `main`.

## Opseg prototipa

Oglasi i profili su izmišljeni. Filteri, navigacija i obrasci su interaktivni. Nacrt organizatora čuva se samo u trenutnom pregledaču. Obrasci ne šalju poruke, prijave niti rezervacije. Za upotrebu sa stvarnim korisnicima potrebni su autentifikacija, baza, moderacija i tok potvrde prijava, upita i poziva za razgovor.

## Registracija i slike

Za aktivaciju potreban je Supabase projekat. Pokrenuti supabase/schema.sql jednom u SQL editoru. U Vercel produkcijsko okruženje dodati PUBLIC_SUPABASE_URL i PUBLIC_SUPABASE_PUBLISHABLE_KEY (javni publishable ili anon ključ), pa ponoviti build. Service role ključ se nikada ne postavlja u frontend.

U Supabase Auth podesiti Site URL na https://odaja.vercel.app i dozvoliti redirect URL-ove za / i /en/. Uključiti potvrdu emaila. Tri privatna storage slota po korisniku ograničavaju broj fotografija i pri konkurentnom uploadu. Maksimum je 5 MB po slici, JPEG/PNG/WebP. Fotografije su za sada vidljive vlasniku profila.

Pedeset izmišljenih profila imaju jasno označene automatske demo odgovore. Razgovori ostaju u pregledaču. Stvarno dopisivanje između korisnika zahteva narednu implementaciju pristanka, privatnih razgovora i moderacije.

Tri spa oglasa su nepotvrđeni predlozi. Izvori potvrđuju postojanje spa centara, dok termini, zakup i organizatori čekaju potvrdu.
