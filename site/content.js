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
    { id: 'prezident', image: '/assets/spa-evening.webp', city: 'Novi Sad', venue: 'Prezident Hotel', source: 'https://www.prezidenthotel.com/rs/spa-wellness', sr: ['Spa druženje parova u Novom Sadu', 'Predlog susreta uz razgovor i wellness u Prezident Hotelu. Termin, zakup prostora i pravila dolaska čekaju dogovor sa centrom.'], en: ['Couples spa gathering in Novi Sad', 'A proposed social wellness gathering at Prezident Hotel. Date, venue booking and attendance rules await agreement with the venue.'] },
    { id: 'olympus', image: '/assets/lounge-evening.webp', city: 'Beograd', venue: 'Club Olympus · Hyatt Regency', source: 'https://www.hyatt.com/en-US/spas/Club-Olympus-Fitness-Centre-and-Spa/home.html', sr: ['Veče upoznavanja parova · Novi Beograd', 'Predlog manjeg druženja uz Club Olympus spa. Organizator, termin i dostupnost prostora još nisu potvrđeni.'], en: ['Couples introductions · New Belgrade', 'A proposed small social gathering at Club Olympus. Organizer, date and venue availability are pending confirmation.'] },
    { id: 'metropol', image: '/assets/spa-terrace.webp', city: 'Beograd', venue: 'The Spa · Metropol Palace', source: 'https://www.metropolpalace.com/wp-content/uploads/compendium-2023-ENGL.pdf', sr: ['Wellness susret za parove · Tašmajdan', 'Predlog opuštenog upoznavanja uz spa odmor u Metropol Palace hotelu. Termin i uslovi čekaju potvrdu centra.'], en: ['Couples wellness gathering · Tašmajdan', 'A proposed relaxed social gathering with a spa break at Metropol Palace. Date and conditions await venue confirmation.'] },
  ],
  stays: [
    { id: 'suite', image: '/assets/suite.webp', city: 'Beograd', sr: ['Apartman s pogledom', 'Dva sata · 3.500 RSD · Parking'], en: ['Riverside suite', 'Two hours · RSD 3,500 · Parking'] },
    { id: 'studio', image: '/assets/studio.webp', city: 'Novi Sad', sr: ['Studio u centru', 'Tri sata · 3.000 RSD'], en: ['Central studio', 'Three hours · RSD 3,000'] },
  ],
  online: createDemoProfiles(),
};

function createDemoProfiles() {
  const names = ['Luna', 'Mila', 'Tara i Vuk', 'Nina', 'Marko', 'Una i Luka', 'Sara', 'Ivan', 'Ana i Stefan', 'Dunja', 'Nikola', 'Lea i Filip', 'Iva', 'Petar', 'Mina i Ognjen', 'Jana', 'Viktor', 'Tea i Milan', 'Ema', 'Aleksa', 'Lana i Pavle', 'Iskra', 'Mihailo', 'Nika i David', 'Nevena'];
  const interests = [
    ['Muzika, kratka putovanja i večernje šetnje.', 'Music, short trips and evening walks.'],
    ['Wellness, dobra hrana i mirna druženja.', 'Wellness, good food and relaxed company.'],
    ['Filmovi, knjige i nova poznanstva.', 'Films, books and meeting new people.'],
    ['Priroda, fotografija i kafa uz razgovor.', 'Nature, photography and conversation over coffee.'],
    ['Pozorište, dizajn i vikendi van grada.', 'Theatre, design and weekends away.'],
  ];
  return Array.from({ length: 50 }, (_, index) => {
    const name = names[index % names.length] + (index >= names.length ? ' · 2' : '');
    const age = 26 + index % 25;
    const interest = interests[index % interests.length];
    return { id: 'demo-' + (index + 1), city: index % 2 ? 'Novi Sad' : 'Beograd', demo: true, age,
      sr: [name, age + '+ · ' + interest[0]], en: [name, age + '+ · ' + interest[1]] };
  });
}
