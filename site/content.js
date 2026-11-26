export const translations = {
  sr: {
    events: 'Događaji', stays: 'Dnevni odmor', online: 'Upoznavanje online', guests: 'Za goste', hosts: 'Za organizatore', event: 'Pripremi oglas za događaj', stay: 'Pripremi oglas za apartman',
    guestsIntro: 'Pronađi večernje druženje, apartman na nekoliko sati ili započni upoznavanje online.',
    hostsIntro: 'Izaberi vrstu oglasa. Nacrt ostaje u ovom pregledaču.',
    eventsIntro: 'Pogledaj kako izgleda ponuda večeri za upoznavanje.', staysIntro: 'Pogledaj kako izgleda ponuda apartmana na nekoliko sati.',
    onlineIntro: 'Probaj kako funkcioniše slanje poziva za razgovor uz izmišljene profile. Koristi isključivo probne podatke.',
    example: 'Primer', city: 'Grad', all: 'Svi gradovi', noResults: 'Nema primera za izabrani grad.', request: 'Probaj prijavu', inquiry: 'Probaj upit za termin', invite: 'Probaj poziv za razgovor', nickname: 'Nadimak', message: 'Poruka', demoNote: 'Probni obrazac. Koristi izmišljene podatke. Unos se ne šalje.', try: 'Isprobaj', done: 'Proba je završena. Poruka nije poslata.',
    title: 'Naslov oglasa', description: 'Opis oglasa', save: 'Sačuvaj nacrt', clear: 'Obriši nacrt', saved: 'Nacrt je sačuvan u ovom pregledaču.', cleared: 'Nacrt je obrisan.', storageError: 'Pregledač nije dozvolio čuvanje nacrta.', adult: 'Imam najmanje 18 godina.', demoProfile: 'Probni profil', ageRequired: 'Potvrdi punoletstvo za prikaz probnih profila.',
  },
  en: {
    events: 'Events', stays: 'Day stays', online: 'Meet online', guests: 'For guests', hosts: 'For hosts', event: 'Draft an event listing', stay: 'Draft a property listing',
    guestsIntro: 'Find a social evening, discover a room for a few hours, or meet someone online.',
    hostsIntro: 'Choose what to list. Your draft stays in this browser.',
    eventsIntro: 'See what listings for social evenings look like.', staysIntro: 'See what listings for short day stays look like.',
    onlineIntro: 'Try sending a chat request with fictional profiles. Use sample data only.',
    example: 'Sample', city: 'City', all: 'All cities', noResults: 'There are no samples for this city.', request: 'Try joining', inquiry: 'Try asking for a slot', invite: 'Try a chat request', nickname: 'Nickname', message: 'Message', demoNote: 'Demo form. Use fictional details. Your entry will not be sent.', try: 'Try it', done: 'Demo complete. No message was sent.',
    title: 'Listing title', description: 'Listing description', save: 'Save draft', clear: 'Delete draft', saved: 'Draft saved in this browser.', cleared: 'Draft deleted.', storageError: 'This browser did not allow draft storage.', adult: 'I am at least 18.', demoProfile: 'Sample profile', ageRequired: 'Confirm that you are an adult to reveal the sample profiles.',
  },
};

export const listings = {
  events: [
    { id: 'salon', city: 'Beograd', sr: ['Veče u salonu', 'Druženje uz piće za parove i goste koji dolaze sami.'], en: ['Evening in the lounge', 'Drinks and conversation for couples and guests attending solo.'] },
    { id: 'river', city: 'Novi Sad', sr: ['Druženje kraj Dunava', 'Večernje upoznavanje u manjoj grupi.'], en: ['By the Danube', 'An evening of small-group introductions.'] },
  ],
  stays: [
    { id: 'suite', city: 'Beograd', sr: ['Apartman s pogledom', 'Dva sata · 3.500 RSD · Parking'], en: ['Riverside suite', 'Two hours · RSD 3,500 · Parking'] },
    { id: 'studio', city: 'Novi Sad', sr: ['Studio u centru', 'Tri sata · 3.000 RSD'], en: ['Central studio', 'Three hours · RSD 3,000'] },
  ],
  online: [
    { id: 'luna', city: 'Beograd', sr: ['Luna', 'Pojedinačni profil · Knjige, muzika i noćne šetnje'], en: ['Luna', 'Solo profile · Books, music and evening walks'] },
    { id: 'tara', city: 'Novi Sad', sr: ['Tara i Vuk', 'Profil para · Volimo mala druženja i putovanja'], en: ['Tara and Vuk', 'Couple profile · Small gatherings and travel'] },
  ],
};
