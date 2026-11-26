# ODAJA

Dvojezičan interaktivni prototip za privatne događaje, apartmane za dnevni odmor i online upoznavanje. Vizuelni pravac je Kuća mesečine.

## Lokalno pokretanje

Pokreni `npm run dev` i otvori `http://localhost:4173/`. Potrebni su Node.js i Python 3. Projekat nema npm zavisnosti.

`npm run build` generiše statički sajt u `dist/`, sa srpskom verzijom na `/` i engleskom na `/en/`. Vercel podešavanja su u `vercel.json`. Nakon povezivanja Git repozitorijuma produkcijska grana treba da bude `main`.

## Opseg prototipa

Oglasi i profili su izmišljeni. Filteri, navigacija i obrasci su interaktivni. Nacrt organizatora čuva se samo u trenutnom pregledaču. Obrasci ne šalju poruke, prijave niti rezervacije. Za upotrebu sa stvarnim korisnicima potrebni su autentifikacija, baza, moderacija i tok potvrde prijava, upita i poziva za razgovor.
