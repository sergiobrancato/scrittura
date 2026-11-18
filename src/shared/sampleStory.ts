import type { Chapter, Character, Story, Tag, TimelineEvent } from './types';

const DAY = 86_400_000;

const iso = (offsetDays = 0, offsetHours = 0): string =>
  new Date(Date.now() - offsetDays * DAY - offsetHours * 3_600_000).toISOString();

export const SAMPLE_STORY_ID = 'storia-di-esempio';
export const SAMPLE_CARD_COLOR = '#a25634';
export const SAMPLE_COVER_FILE = 'esempio-orologiaio.svg';
export const SAMPLE_COVER_URL = `scrittura://cover/${SAMPLE_COVER_FILE}`;

const introduzione: Tag = { id: 'tag-introduzione', name: 'Introduzione', color: '#6e8f86' };
const indagine: Tag = { id: 'tag-indagine', name: 'Indagine', color: '#5f7fa3' };
const svolta: Tag = { id: 'tag-svolta', name: 'Svolta', color: '#b27a3e' };
const finale: Tag = { id: 'tag-finale', name: 'Finale', color: '#8d5a6d' };

const portraitDataUri = (svg: string): string =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

const lorenzoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="400" height="500">
  <defs>
    <linearGradient id="lorenzo-bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#e0d3b8" />
      <stop offset="1" stop-color="#c2ac89" />
    </linearGradient>
  </defs>
  <rect width="400" height="500" fill="url(#lorenzo-bg)" />
  <circle cx="200" cy="228" r="154" fill="#efe5d2" opacity="0.5" />
  <path d="M30 500 C36 414 88 356 158 338 L200 330 L242 338 C312 356 364 414 370 500 Z" fill="#5a4636" />
  <path d="M162 334 L200 336 L238 334 L224 432 L200 452 L176 432 Z" fill="#f2e8d6" />
  <path d="M195 350 h10 l6 58 -11 16 -11 -16 z" fill="#8c4a32" />
  <path d="M193 342 h14 l-4 10 h-6 z" fill="#7a3c27" />
  <path d="M176 296 h48 v52 c0 13 -48 13 -48 0 Z" fill="#ddb28b" />
  <path d="M176 300 q24 18 48 0 v13 q-24 16 -48 0 z" fill="#c99a74" opacity="0.5" />
  <ellipse cx="124" cy="250" rx="13" ry="19" fill="#e3b992" />
  <ellipse cx="276" cy="250" rx="13" ry="19" fill="#e3b992" />
  <ellipse cx="200" cy="242" rx="76" ry="90" fill="#e8c19b" />
  <path d="M124 232 C118 165 150 132 202 132 C254 132 282 168 277 234 C266 206 258 190 246 180 C222 198 176 200 156 188 C144 200 132 214 124 232 Z" fill="#453127" />
  <path d="M124 232 c-2 24 3 38 11 46 l5 -42 z" fill="#453127" />
  <path d="M276 232 c2 24 -3 38 -11 46 l-5 -42 z" fill="#453127" />
  <path d="M204 136 C197 158 196 174 198 192" stroke="#2f211a" stroke-width="3" fill="none" opacity="0.5" />
  <path d="M146 230 q18 -11 38 -3" stroke="#3a2a21" stroke-width="5" fill="none" stroke-linecap="round" />
  <path d="M216 227 q20 -8 38 3" stroke="#3a2a21" stroke-width="5" fill="none" stroke-linecap="round" />
  <circle cx="166" cy="248" r="25" fill="#fdf8ee" fill-opacity="0.18" stroke="#3b332b" stroke-width="4" />
  <circle cx="234" cy="248" r="25" fill="#fdf8ee" fill-opacity="0.18" stroke="#3b332b" stroke-width="4" />
  <path d="M191 248 h18" stroke="#3b332b" stroke-width="3.4" />
  <path d="M141 243 L127 239 M259 243 L273 239" stroke="#3b332b" stroke-width="3.4" />
  <ellipse cx="166" cy="250" rx="5.4" ry="6" fill="#33261e" />
  <ellipse cx="234" cy="250" rx="5.4" ry="6" fill="#33261e" />
  <circle cx="168" cy="248" r="1.6" fill="#fff8ef" />
  <circle cx="236" cy="248" r="1.6" fill="#fff8ef" />
  <path d="M200 250 q-7 18 2 24 q5 3 10 0" stroke="#c4966f" stroke-width="3" fill="none" stroke-linecap="round" />
  <path d="M170 295 q30 -14 60 0 q-30 13 -60 0 Z" fill="#453127" />
  <path d="M188 309 q12 6 24 0" stroke="#9c5c49" stroke-width="3.4" fill="none" stroke-linecap="round" />
  <ellipse cx="154" cy="282" rx="15" ry="8" fill="#d69a78" opacity="0.28" />
  <ellipse cx="246" cy="282" rx="15" ry="8" fill="#d69a78" opacity="0.28" />
  <path d="M158 336 L200 402 L200 452 L166 408 Z" fill="#4b3a2b" />
  <path d="M242 336 L200 402 L200 452 L234 408 Z" fill="#4b3a2b" />
  <path d="M234 398 C250 410 256 426 246 442" stroke="#c9a25c" stroke-width="2.4" fill="none" />
  <circle cx="245" cy="444" r="4.4" fill="#c9a25c" />
  <circle cx="218" cy="462" r="3" fill="#3a2d21" />
  <circle cx="218" cy="478" r="3" fill="#3a2d21" />
</svg>`;

const elenaSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="400" height="500">
  <defs>
    <linearGradient id="elena-bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#aec6bd" />
      <stop offset="1" stop-color="#87a79e" />
    </linearGradient>
  </defs>
  <rect width="400" height="500" fill="url(#elena-bg)" />
  <circle cx="200" cy="226" r="154" fill="#dbe8e1" opacity="0.45" />
  <path d="M24 500 C32 408 90 352 160 336 L200 326 L240 336 C310 352 368 408 376 500 Z" fill="#4f6064" />
  <path d="M172 336 L200 332 L228 336 L238 432 L200 474 L162 432 Z" fill="#efe6d7" />
  <path d="M177 292 h46 v50 c0 12 -46 12 -46 0 Z" fill="#e5bb95" />
  <path d="M177 296 q23 16 46 0 v12 q-23 14 -46 0 z" fill="#cf9f78" opacity="0.45" />
  <ellipse cx="128" cy="246" rx="12" ry="18" fill="#ecc5a2" />
  <ellipse cx="272" cy="246" rx="12" ry="18" fill="#ecc5a2" />
  <ellipse cx="200" cy="234" rx="72" ry="86" fill="#eec9a7" />
  <ellipse cx="200" cy="252" rx="90" ry="110" fill="#2e2825" />
  <ellipse cx="200" cy="234" rx="72" ry="86" fill="#eec9a7" />
  <path d="M110 244 C110 332 122 362 150 368 C152 332 146 300 140 268 Z" fill="#2e2825" />
  <path d="M290 244 C290 332 278 362 250 368 C248 332 254 300 260 268 Z" fill="#2e2825" />
  <path d="M128 238 C120 170 156 134 202 134 C248 134 280 168 272 238 C264 204 250 188 236 184 C220 204 196 210 174 204 C160 210 146 220 138 238 Z" fill="#332c28" />
  <path d="M146 228 q17 -9 34 -2" stroke="#3a302b" stroke-width="4.4" fill="none" stroke-linecap="round" />
  <path d="M220 226 q17 -7 34 2" stroke="#3a302b" stroke-width="4.4" fill="none" stroke-linecap="round" />
  <ellipse cx="164" cy="247" rx="9.5" ry="7" fill="#fdf9f2" />
  <ellipse cx="236" cy="247" rx="9.5" ry="7" fill="#fdf9f2" />
  <circle cx="164" cy="248" r="4.8" fill="#4f7a63" />
  <circle cx="236" cy="248" r="4.8" fill="#4f7a63" />
  <circle cx="164" cy="248" r="2.2" fill="#241f1c" />
  <circle cx="236" cy="248" r="2.2" fill="#241f1c" />
  <circle cx="166" cy="246" r="1.3" fill="#fffaf2" />
  <circle cx="238" cy="246" r="1.3" fill="#fffaf2" />
  <path d="M159 236 q6 -4 12 -1" stroke="#3a302b" stroke-width="2.4" fill="none" stroke-linecap="round" />
  <path d="M229 235 q6 -3 12 1" stroke="#3a302b" stroke-width="2.4" fill="none" stroke-linecap="round" />
  <path d="M200 248 q-6 16 1 21 q4 3 8 0" stroke="#cf9d78" stroke-width="2.8" fill="none" stroke-linecap="round" />
  <path d="M184 296 q16 -8 32 0 q-16 12 -32 0 Z" fill="#b05744" />
  <path d="M188 297 q12 4 24 0" stroke="#8f4133" stroke-width="1.6" fill="none" />
  <ellipse cx="152" cy="274" rx="14" ry="8" fill="#d99877" opacity="0.3" />
  <ellipse cx="248" cy="274" rx="14" ry="8" fill="#d99877" opacity="0.3" />
  <path d="M160 330 C176 352 224 352 240 330 L249 362 C236 392 214 400 200 400 C186 400 164 392 151 362 Z" fill="#b05a41" />
  <path d="M187 396 l16 0 l8 82 l-22 8 Z" fill="#a2503a" />
  <path d="M205 398 l12 0 l-2 66 l-14 -4 Z" fill="#994a35" />
  <circle cx="140" cy="286" r="3.6" fill="#d4a955" />
  <circle cx="260" cy="286" r="3.6" fill="#d4a955" />
</svg>`;

const malaspinaSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="400" height="500">
  <defs>
    <linearGradient id="malaspina-bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#625d68" />
      <stop offset="1" stop-color="#434049" />
    </linearGradient>
  </defs>
  <rect width="400" height="500" fill="url(#malaspina-bg)" />
  <circle cx="200" cy="222" r="150" fill="#8d8793" opacity="0.3" />
  <path d="M22 500 C32 402 92 348 162 332 L200 322 L238 332 C308 348 368 402 378 500 Z" fill="#2f3138" />
  <path d="M168 330 L200 326 L232 330 L227 368 L200 380 L173 368 Z" fill="#efe9dd" />
  <path d="M192 362 h16 l9 54 -17 14 -17 -14 Z" fill="#3d4350" />
  <path d="M190 352 h20 l-4 12 h-12 Z" fill="#343946" />
  <path d="M179 288 h42 v48 c0 12 -42 12 -42 0 Z" fill="#dfb791" />
  <path d="M179 292 q21 15 42 0 v12 q-21 13 -42 0 z" fill="#c89b75" opacity="0.5" />
  <ellipse cx="127" cy="238" rx="12" ry="18" fill="#dcb28b" />
  <ellipse cx="273" cy="238" rx="12" ry="18" fill="#dcb28b" />
  <ellipse cx="200" cy="228" rx="74" ry="88" fill="#e3bd99" />
  <path d="M126 222 C124 156 156 124 204 124 C252 124 282 154 276 224 C268 194 250 178 232 172 C212 160 184 162 164 174 C150 184 138 200 126 222 Z" fill="#c6c1b7" />
  <path d="M126 222 c0 26 4 42 12 50 l6 -46 z" fill="#c6c1b7" />
  <path d="M276 222 c0 26 -4 42 -12 50 l-6 -46 z" fill="#c6c1b7" />
  <path d="M148 220 q18 -10 36 -2" stroke="#8d877d" stroke-width="5" fill="none" stroke-linecap="round" />
  <path d="M216 218 q18 -8 36 2" stroke="#8d877d" stroke-width="5" fill="none" stroke-linecap="round" />
  <path d="M152 240 q14 -7 28 -1" stroke="#4c4a4c" stroke-width="3" fill="none" stroke-linecap="round" />
  <path d="M220 239 q14 -6 28 1" stroke="#4c4a4c" stroke-width="3" fill="none" stroke-linecap="round" />
  <ellipse cx="166" cy="244" rx="5.2" ry="4.4" fill="#3b3838" />
  <ellipse cx="234" cy="244" rx="5.2" ry="4.4" fill="#3b3838" />
  <circle cx="167.6" cy="242.6" r="1.4" fill="#f6f1e7" opacity="0.8" />
  <path d="M200 242 q-6 20 1 25 q4 3 8 0" stroke="#c99c76" stroke-width="3" fill="none" stroke-linecap="round" />
  <path d="M170 288 q30 -12 60 0 q-30 10 -60 0 Z" fill="#c6c1b7" />
  <path d="M184 308 C190 330 196 346 200 346 C204 346 210 330 216 308 C206 314 194 314 184 308 Z" fill="#c6c1b7" />
  <path d="M190 306 q10 4 20 0" stroke="#7d4a3f" stroke-width="3.2" fill="none" stroke-linecap="round" />
  <path d="M166 284 q-6 16 0 24 M234 284 q6 16 0 24" stroke="#c99c76" stroke-width="2.2" fill="none" opacity="0.6" />
  <circle cx="236" cy="240" r="24" fill="#f7f2e6" fill-opacity="0.1" stroke="#c9a34f" stroke-width="3" />
  <path d="M259 250 C270 268 268 286 258 300" stroke="#c9a34f" stroke-width="1.8" fill="none" />
  <path d="M154 360 L200 432 L200 472 L162 424 Z" fill="#262830" />
  <path d="M246 360 L200 432 L200 472 L238 424 Z" fill="#262830" />
  <circle cx="236" cy="396" r="4.4" fill="#c9a34f" />
  <path d="M236 400 C250 414 252 430 242 444" stroke="#c9a34f" stroke-width="2" fill="none" />
  <circle cx="242" cy="446" r="3.4" fill="#c9a34f" />
</svg>`;

const chapter1: Chapter = {
  id: 'esempio-capitolo-1',
  title: "L'ora ferma",
  timelineLabel: 'Notte del 3 novembre 1924',
  tags: [introduzione],
  createdAt: iso(9, 14),
  updatedAt: iso(3, 2),
  content: `Venezia, 3 novembre 1924.

La pioggia batteva sul vetro della bottega come dita impazienti. Lorenzo Valli posò la lente sulla scrivania e guardò l'orologio a muro: le sei e un quarto di sera. Fuori, il vicolo San Marco era diventato un fiume nero che portava odore di alghe e di carbone.

Quando la campanella della porta suonò, una donna entrò trascinando con sé una scia di pioggia. Era giovane, avvolta in un cappotto color fumo, e stringeva qualcosa nel pugno come si stringe un segreto.

«Il signor Valli?» chiese. «Mi chiamo Elena Moretti. Mi hanno detto che lei ripara anche le cose che gli altri hanno smesso di amare.»

Lorenzo sorrise appena. «Dipende dalle cose.»

Elena aprì la mano. Sul palmo brillava un orologio da tasca d'argento, graffiato, con il coperchio incrinato. Lo posò sul banco con delicatezza, come si depone un uccello ferito.

«Era di mio padre» disse. «Si è fermato dieci anni fa, la notte dell'incendio. Le lancette non hanno più voluto saperne di muoversi.»

Lorenzo lo prese. Sentì il peso, il freddo, il piccolo respiro di un meccanismo che non respirava più. Sotto la polvere lesse un'incisione consumata: A.M.

«Augusto Moretti» mormorò Elena. «Lavorava per il conte Malaspina. Dicevano che fosse un ladro. Dicevano che l'incendio l'avesse acceso lui.»

Lorenzo aprì il coperchio. Dentro, oltre agli ingranaggi, c'era un foglietto piegato in quattro, e sopra una scritta a inchiostro sbiadito: Riportala a chi l'ha fermata.

Guardò il quadrante. Le lancette segnavano le tre e diciassette. E in quel momento, nella bottega, il tempo sembrò trattenere il fiato.

«Non è soltanto un orologio» disse piano.`,
};

const chapter2: Chapter = {
  id: 'esempio-capitolo-2',
  title: 'La bottega dei ricordi',
  timelineLabel: 'Mattina del 4 novembre 1924',
  tags: [indagine],
  createdAt: iso(9, 12),
  updatedAt: iso(3, 1),
  content: `La mattina dopo, Venezia si svegliò sotto una nebbia color latte. Lorenzo chiuse la bottega e attraversò il ponte con l'orologio di Augusto Moretti nel taschino del panciotto.

Palazzo Malaspina sorgeva oltre il canale, una casa alta e severa con le finestre come occhi socchiusi. Ad aprirgli fu il conte Aurelio Malaspina in persona: sessant'anni portati con la schiena dritta, una spilla d'oro al colletto e il sorriso di chi sa di essere atteso.

«Un orologiaio» disse il conte, senza invitarlo a sedersi. «Vengo subito al punto. Quell'orologio mi appartiene.»

«Mi risulta che appartenesse ad Augusto Moretti.»

Il sorriso del conte non si mosse. «Moretti era un mio dipendente, e un ladro. La notte dell'incendio mi rubò l'orologio, e la mia collezione di orologi da tasca, e forse anche l'idea di essere un uomo onesto. Il fuoco lo ha punito prima che potessi farlo io.»

Lorenzo sentì il metallo freddo contro il petto. «E la sua collezione?»

«Assicurata. Come tutte le cose che si perdono, del resto.» Il conte si avvicinò. «Le offro il doppio di quanto guadagnerebbe a ripararlo. Mi consegni l'orologio e non se ne parli più.»

Lorenzo tornò in bottega con la nebbia ancora addosso. Elena lo aspettava sulla soglia, il taccuino aperto e le guance accese.

«Ho cercato negli archivi del giornale» disse. «L'incendio è scoppiato alle tre e diciassette. Il magazzino era vuoto, eppure il conte ha incassato un risarcimento enorme. E c'è una cosa strana: nel registro dei presenti non compare nessun Moretti. Compare solo una ragazza salvata dai pompieri.»

Lorenzo guardò l'orologio. «La ragazza eri tu?»

Elena non rispose. Fuori, la nebbia si spostava lungo le calli come una mano che cercava qualcosa.`,
};

const chapter3: Chapter = {
  id: 'esempio-capitolo-3',
  title: 'Il meccanismo spezzato',
  timelineLabel: 'Pomeriggio del 4 novembre 1924',
  tags: [svolta],
  createdAt: iso(9, 10),
  updatedAt: iso(2, 20),
  content: `Nel pomeriggio Lorenzo accese la lampada e aprì l'orologio come si apre una lettera troppo a lungo rimandata. Sotto il quadrante, oltre la polvere e l'olio rappreso, c'era un secondo coperchio, sottile come una lamina. Con il temperino lo sollevò.

Dentro, un pezzo di carta piegato e una fotografia sbiadita: un magazzino, casse accatastate, e in fondo un uomo con un cappello che assomigliava maledettamente al conte Malaspina. Sul retro, una data: 16 agosto 1914, due giorni prima dell'incendio.

Sul foglietto c'era la scrittura di Augusto:

Non ho bruciato io. Il conte ha svuotato il magazzino dei suoi stessi averi per incassare l'assicurazione. Mi ha chiesto di tacere. Io ho portato via la ragazza, che dormiva nella stanza accanto. Sono tornato indietro per la sua valigia, perché una ragazza senza memoria non può crescere. Il soffitto mi è caduto addosso. Riporta questo orologio a mia figlia. Lei saprà cosa farne.

Lorenzo rimase immobile. Fuori, la pioggia aveva ricominciato a cadere. Quando alzò gli occhi, Elena era sulla porta, il cappotto ancora bagnato, e piangeva senza rumore.

«L'ho sempre saputo» disse lei, con la voce che si spezzava. «Ho sempre saputo che lui era lì per me. E ho passato dieci anni a chiedermi se valesse la pena.»

«Vale la pena» disse Lorenzo, e sentì che non era una frase gentile, ma una constatazione.

Quella sera il cappello del conte apparve dietro il vetro della bottega. Un attimo dopo, la campanella suonò. E Lorenzo nascose il foglietto nella tasca interna della giacca, dove il cuore batteva forte.`,
};

const chapter4: Chapter = {
  id: 'esempio-capitolo-4',
  title: "L'alba di un nuovo tempo",
  timelineLabel: "Alba del 5 novembre 1924",
  tags: [finale],
  createdAt: iso(9, 8),
  updatedAt: iso(2, 18),
  content: `L'alba del 5 novembre trovò Venezia lucida e silenziosa, come una pagina appena vergata. Lorenzo aspettò che il cielo sopra i tetti diventasse color pesca, poi salì al giornale con il foglietto, la fotografia e la copia dell'assicurazione che Elena aveva trovato negli archivi.

Elena lesse il suo articolo ad alta voce, seduta sulla scrivania del direttore. Si intitolava L'ora ferma. Parlava di un magazzino vuoto, di un risarcimento, di una ragazza salvata due volte: una dal fuoco, l'altra dal silenzio.

Alle nove il palazzo Malaspina era circondato di curiosi. Il conte uscì senza cappello, per la prima volta in trent'anni, e la folla si aprì al suo passaggio come fa l'acqua davanti alla chiglia di una barca. Nessuno lo salutò. Il suo nome, da quel giorno, rimase appeso ai muri della città come un manifesto ingiallito.

In bottega, Lorenzo rimise il secondo coperchio al suo posto, oliò gli ingranaggi, raddrizzò la molla maestra e richiuse la cassa. Prima di avvitare l'ultima vite, lesse ancora una volta la scritta incisa sul retro: Riportala a chi l'ha fermata.

Poi appoggiò l'orologio sul banco, accanto alla tazza di caffè, e attese.

Le lancette tremarono. La piccola ruota del bilanciere si mosse, esitò, tornò a muoversi. Un ticchettio sottile riempì la bottega, come un cuore che ricomincia a battere dopo un lungo inverno.

Elena arrivò alle dieci, con il giornale piegato sotto il braccio e gli occhi ancora rossi.

«Allora?» chiese.

Lorenzo le porse l'orologio. Segnava le sei e un quarto, l'ora esatta in cui la pioggia aveva smesso di cadere.

«Riparato» disse. «Ma il tempo non torna mai indietro. Impara soltanto ad andare avanti.»

Elena se lo mise al polso come un bracciale troppo grande. Fuori, la luce dell'alba scivolava sull'acqua, e per un momento Venezia parve un orologio appena caricato.`,
};

const lorenzoPortrait = portraitDataUri(lorenzoSvg);
const elenaPortrait = portraitDataUri(elenaSvg);
const malaspinaPortrait = portraitDataUri(malaspinaSvg);

const characters: Character[] = [
  {
    id: 'esempio-personaggio-lorenzo',
    name: 'Lorenzo Valli',
    role: 'Protagonista',
    age: '34 anni',
    portrait: lorenzoPortrait,
    height: '1,78 m',
    build: 'Asciutta, spalle strette, passo prudente',
    eyeColor: 'Castano scuro',
    hairColor: 'Castani, mossi, con qualche filo grigio',
    distinguishingFeatures:
      'Una piccola cicatrice sopra il sopracciglio destro, dita macchiate d\u2019olio e un panciotto di lana color tabacco.',
    personality:
      'Paziente e metodico, più a suo agio con gli ingranaggi che con le persone. Ironico quando si sente al sicuro, silenzioso quando ha paura.',
    goals:
      'Riparare l\u2019orologio di Augusto Moretti e capire perché suo padre, Marco Valli, ne avesse firmato il meccanismo.',
    fears:
      'Perdere la bottega di famiglia e scoprire che il padre sapeva qualcosa e ha taciuto per convenienza.',
    innerConflict:
      'Vuole la verità, ma teme che raccontarla significhi tradire la memoria del padre e l\u2019unica versione della propria infanzia che conosce.',
    notes:
      'Tiene un diario delle riparazioni, con una pagina per ogni oggetto che passa dal banco. Beve caffè anche a mezzanotte.',
    chapterIds: [chapter1.id, chapter2.id, chapter3.id, chapter4.id],
    createdAt: iso(9, 6),
    updatedAt: iso(3, 4),
  },
  {
    id: 'esempio-personaggio-elena',
    name: 'Elena Moretti',
    role: 'Co-protagonista',
    age: '24 anni',
    portrait: elenaPortrait,
    height: '1,66 m',
    build: 'Esile, sempre in movimento',
    eyeColor: 'Verdi',
    hairColor: 'Castano scuro, taglio a caschetto',
    distinguishingFeatures:
      'Un cappotto color fumo, un taccuino di pelle consumata e un vecchio graffio sul mento.',
    personality:
      'Curiosa e ostinata, scrive di notte e non sa stare ferma. Usa l\u2019ironia come scudo e le domande come chiavi.',
    goals:
      'Scoprire la verità sull\u2019incendio e scrivere l\u2019articolo che restituisca dignità alla memoria di suo padre.',
    fears:
      'Che la verità distrugga l\u2019immagine che ha di sé e che, dopo averla scritta, resti sola con essa.',
    innerConflict:
      'Vorrebbe una vendetta che plachi dieci anni di dolore, ma sa che solo la verità è più forte di una vendetta.',
    notes:
      'Lavora al Gazzettino, dove la chiamano «la cronista dell\u2019alba». Conserva la valigia del padre senza averla mai aperta.',
    chapterIds: [chapter1.id, chapter2.id, chapter3.id, chapter4.id],
    createdAt: iso(9, 5),
    updatedAt: iso(3, 3),
  },
  {
    id: 'esempio-personaggio-malaspina',
    name: 'Il Conte Malaspina',
    role: 'Antagonista',
    age: '58 anni',
    portrait: malaspinaPortrait,
    height: '1,82 m',
    build: 'Imponente, portamento rigido',
    eyeColor: 'Grigi',
    hairColor: 'Argento, pettinati all\u2019indietro',
    distinguishingFeatures:
      'Una spilla d\u2019oro al colletto, guanti chiari anche in casa, un monocolo legato da una catenella.',
    personality:
      'Elegante e misurato, abituato a comprare il silenzio. Considera il tempo una proprietà e la memoria un debito degli altri.',
    goals:
      'Mantenere intatta la propria reputazione e la collezione di orologi che nessuno ha mai visto per intero.',
    fears:
      'Lo scandalo, la povertà e l\u2019idea di essere ricordato come un uomo qualunque.',
    innerConflict:
      'Sa di aver perduto l\u2019unica cosa che il denaro non può restituire: il rispetto di una città che lo osserva da lontano.',
    notes:
      'Colleziona orologi fermi. Dice che sono gli unici onesti, perché smettono di mentire sul tempo che passa.',
    chapterIds: [chapter2.id, chapter3.id, chapter4.id],
    createdAt: iso(9, 4),
    updatedAt: iso(3, 2),
  },
];

const timeline: TimelineEvent[] = [
  {
    id: 'esempio-eventi-incendio',
    label: "Notte del 17 agosto 1914 — L'incendio del magazzino",
    description:
      'Il magazzino del conte Malaspina brucia due giorni prima della denuncia assicurativa. Augusto Moretti porta in salvo la figlia e muore sotto le travi. L\u2019orologio si ferma alle 3:17.',
    color: '#6e6a75',
    chapterId: null,
    createdAt: iso(9, 3),
    updatedAt: iso(3, 3),
  },
  {
    id: 'esempio-eventi-1',
    label: chapter1.timelineLabel,
    description:
      'Nella bottega di Vicolo San Marco, Elena Moretti consegna l\u2019orologio del padre. Lorenzo scopre la scritta nascosta e la riparazione diventa un\u2019indagine.',
    color: '#5f7fa3',
    chapterId: chapter1.id,
    createdAt: iso(9, 3),
    updatedAt: iso(3, 2),
  },
  {
    id: 'esempio-eventi-2',
    label: chapter2.timelineLabel,
    description:
      'Lorenzo incontra il conte Malaspina, che rivendica l\u2019orologio e accusa Augusto di furto. Elena scopre che nell\u2019incendio fu salvata una ragazza.',
    color: '#6e8f86',
    chapterId: chapter2.id,
    createdAt: iso(9, 3),
    updatedAt: iso(3, 1),
  },
  {
    id: 'esempio-eventi-3',
    label: chapter3.timelineLabel,
    description:
      'Il doppio fondo dell\u2019orologio rivela la fotografia e la confessione di Augusto. Il conte si presenta in bottega, e la verità comincia a pesare più del metallo.',
    color: '#b27a3e',
    chapterId: chapter3.id,
    createdAt: iso(9, 3),
    updatedAt: iso(2, 20),
  },
  {
    id: 'esempio-eventi-4',
    label: chapter4.timelineLabel,
    description:
      'L\u2019articolo di Elena smaschera il conte. A bottega, l\u2019orologio riprende a ticchettare mentre l\u2019alba si allarga sulla laguna.',
    color: '#8d5a6d',
    chapterId: chapter4.id,
    createdAt: iso(9, 3),
    updatedAt: iso(2, 18),
  },
];

export interface SamplePortraitFile {
  fileName: string;
  svg: string;
}

export const sampleCoverSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 900" width="600" height="900">
  <defs>
    <linearGradient id="cover-sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#10242b" />
      <stop offset="0.55" stop-color="#1b3a41" />
      <stop offset="1" stop-color="#081317" />
    </linearGradient>
    <linearGradient id="cover-water" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#1c4146" />
      <stop offset="1" stop-color="#071114" />
    </linearGradient>
    <linearGradient id="cover-gold" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#f2d7a0" />
      <stop offset="0.48" stop-color="#d0aa67" />
      <stop offset="1" stop-color="#9a7135" />
    </linearGradient>
    <radialGradient id="cover-halo" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="#e8c98d" stop-opacity="0.3" />
      <stop offset="1" stop-color="#e8c98d" stop-opacity="0" />
    </radialGradient>
    <linearGradient id="cover-fade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#071116" stop-opacity="0" />
      <stop offset="0.3" stop-color="#071116" stop-opacity="0.9" />
      <stop offset="1" stop-color="#071116" stop-opacity="0.99" />
    </linearGradient>
  </defs>

  <rect width="600" height="900" fill="url(#cover-sky)" />
  <rect x="20" y="20" width="560" height="860" fill="none" stroke="#c9a96b" stroke-width="2" />
  <rect x="31" y="31" width="538" height="838" fill="none" stroke="#c9a96b" stroke-width="0.8" opacity="0.4" />

  <g fill="#ead9b0" opacity="0.55">
    <circle cx="88" cy="98" r="2.1" />
    <circle cx="142" cy="66" r="1.4" />
    <circle cx="198" cy="112" r="1.6" />
    <circle cx="404" cy="84" r="1.7" />
    <circle cx="512" cy="186" r="1.4" />
    <circle cx="82" cy="232" r="1.3" />
    <circle cx="470" cy="46" r="1.2" />
  </g>

  <circle cx="478" cy="118" r="35" fill="url(#cover-gold)" opacity="0.92" />
  <circle cx="464" cy="108" r="31" fill="#163039" />

  <circle cx="300" cy="222" r="158" fill="url(#cover-halo)" />

  <g>
    <circle cx="300" cy="222" r="110" fill="#0d2027" stroke="url(#cover-gold)" stroke-width="4" />
    <circle cx="300" cy="222" r="98" fill="none" stroke="#8fa29a" stroke-width="1" opacity="0.45" />
    <circle cx="300" cy="222" r="72" fill="none" stroke="#c9a96b" stroke-width="1" opacity="0.6" />
    <g stroke="#d9bc80" stroke-width="2">
      <line x1="300" y1="116" x2="300" y2="131" transform="rotate(0 300 222)" />
      <line x1="300" y1="116" x2="300" y2="131" transform="rotate(30 300 222)" />
      <line x1="300" y1="116" x2="300" y2="131" transform="rotate(60 300 222)" />
      <line x1="300" y1="116" x2="300" y2="131" transform="rotate(90 300 222)" />
      <line x1="300" y1="116" x2="300" y2="131" transform="rotate(120 300 222)" />
      <line x1="300" y1="116" x2="300" y2="131" transform="rotate(150 300 222)" />
      <line x1="300" y1="116" x2="300" y2="131" transform="rotate(180 300 222)" />
      <line x1="300" y1="116" x2="300" y2="131" transform="rotate(210 300 222)" />
      <line x1="300" y1="116" x2="300" y2="131" transform="rotate(240 300 222)" />
      <line x1="300" y1="116" x2="300" y2="131" transform="rotate(270 300 222)" />
      <line x1="300" y1="116" x2="300" y2="131" transform="rotate(300 300 222)" />
      <line x1="300" y1="116" x2="300" y2="131" transform="rotate(330 300 222)" />
    </g>
    <g fill="#c9a96b" font-family="Georgia, serif" font-size="19" text-anchor="middle" opacity="0.9">
      <text x="300" y="172">♈</text>
      <text x="367" y="229">♋</text>
      <text x="300" y="286">♎</text>
      <text x="233" y="229">♑</text>
    </g>
    <g stroke="url(#cover-gold)" stroke-linecap="round">
      <line x1="300" y1="222" x2="300" y2="148" stroke-width="6" transform="rotate(102 300 222)" />
      <line x1="300" y1="222" x2="300" y2="176" stroke-width="9" transform="rotate(98 300 222)" />
    </g>
    <circle cx="300" cy="222" r="9" fill="url(#cover-gold)" />
    <circle cx="300" cy="222" r="3.4" fill="#152b31" />
    <text x="300" y="374" fill="#d9bc80" font-family="Georgia, serif" font-size="12" letter-spacing="5" text-anchor="middle">
      VENEZIA · 1924
    </text>
  </g>

  <g fill="#0b181d">
    <path d="M0 392 L82 366 L150 384 L196 376 L214 452 L176 520 L144 640 L110 760 L0 790 Z" />
    <path d="M600 380 L520 352 L462 374 L414 364 L386 458 L424 532 L454 642 L492 768 L600 800 Z" />
    <path d="M206 372 L232 358 L252 374 L252 504 L196 512 Z" opacity="0.85" />
    <path d="M394 370 L368 356 L348 374 L350 508 L404 512 Z" opacity="0.85" />
  </g>

  <g fill="#d8ab63" opacity="0.85">
    <rect x="52" y="444" width="17" height="24" rx="2" />
    <rect x="112" y="466" width="14" height="20" rx="2" />
    <rect x="66" y="538" width="14" height="22" rx="2" />
    <rect x="516" y="432" width="18" height="26" rx="2" />
    <rect x="470" y="480" width="14" height="20" rx="2" />
    <rect x="508" y="566" width="15" height="24" rx="2" />
  </g>

  <g>
    <path d="M154 592 Q300 514 446 592 L446 690 L154 690 Z" fill="#081216" />
    <path d="M198 628 Q300 562 402 628 L402 652 Q300 592 198 652 Z" fill="#163033" opacity="0.75" />
    <path d="M226 690 L250 594 Q300 570 350 594 L374 690 Z" fill="#09171a" />
    <g stroke="#dfb36b" stroke-width="2" opacity="0.65">
      <path d="M290 694 Q300 660 310 694" fill="none" />
      <path d="M266 698 Q300 648 334 698" fill="none" />
      <path d="M240 704 Q300 636 360 704" fill="none" />
    </g>
  </g>

  <rect x="0" y="586" width="600" height="314" fill="url(#cover-fade)" />
  <rect x="0" y="720" width="600" height="180" fill="url(#cover-water)" opacity="0.55" />

  <g fill="#0f2024" opacity="0.8">
    <path d="M84 640 L126 630 L126 744 L84 752 Z" />
    <path d="M474 628 L516 638 L516 748 L474 740 Z" />
  </g>

  <g stroke="#c9a96b" opacity="0.8">
    <line x1="196" y1="774" x2="404" y2="774" stroke-width="0.8" />
    <circle cx="300" cy="774" r="3.2" fill="#c9a96b" stroke="none" />
  </g>

  <text x="300" y="552" fill="#d9bc80" font-family="Georgia, serif" font-size="13" letter-spacing="7" text-anchor="middle">
    UN MISTERO VENEZIANO
  </text>

  <text x="300" y="644" fill="#f4e8d2" font-family="Georgia, 'Palatino Linotype', serif" font-size="60" letter-spacing="2" text-anchor="middle">
    L’OROLOGIAIO
  </text>
  <text x="300" y="696" fill="#d9bc80" font-family="Georgia, 'Palatino Linotype', serif" font-size="27" font-style="italic" text-anchor="middle">
    di Vicolo San Marco
  </text>

  <text x="300" y="838" fill="#cdb17a" font-family="Georgia, serif" font-size="11" letter-spacing="6" text-anchor="middle">
    RACCONTO DI ESEMPIO
  </text>
</svg>`;

export const samplePortraitFiles: SamplePortraitFile[] = [
  { fileName: 'esempio-lorenzo-valli.svg', svg: lorenzoSvg },
  { fileName: 'esempio-elena-moretti.svg', svg: elenaSvg },
  { fileName: 'esempio-conte-malaspina.svg', svg: malaspinaSvg },
];

export function createSampleStory(): Story {
  return {
    id: SAMPLE_STORY_ID,
    title: "L'Orologiaio di Vicolo San Marco",
    synopsis:
      'Venezia, novembre 1924. Il giovane orologiaio Lorenzo Valli riceve da una giornalista un orologio da tasca fermo alle 3:17 da dieci anni. Dentro, una scritta e un segreto riportano a un incendio mai dimenticato, a un conte troppo elegante e a una verità che aspetta soltanto di essere rimessa in ora.',
    genre: 'Mistero storico',
    status: 'Completato',
    cover: SAMPLE_COVER_URL,
    cardColor: SAMPLE_CARD_COLOR,
    chapters: [chapter1, chapter2, chapter3, chapter4],
    characters,
    timeline,
    tags: [introduzione, indagine, svolta, finale],
    createdAt: iso(9, 8),
    updatedAt: iso(2, 2),
    isSample: true,
  };
}
