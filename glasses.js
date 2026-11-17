'use strict';
/* Gläser für den Becher auf der Startseite. Gezeigt wird das Glas des zuletzt getrunkenen Getränks, ohne Getränk eine Halbe.
   Jedes Glas: body = Innenraum (darin steht die Flüssigkeit), top/bottom = Höhe von Rand und Boden,
   extra = Stiel, Fuß, Henkel oder dicker Boden (nur Linie), deco = Noppen, shine = Lichtreflex. Koordinaten im viewBox "0 -34 210 244". */
const DIMPLES = (pts) => pts.map(([x, y]) => `M${x - 9} ${y}a9 12 0 1 0 18 0a9 12 0 1 0 -18 0`).join('');
const FOOT = (y) => `M58 ${y}a42 7 0 1 0 84 0a42 7 0 1 0 -84 0`;
const GLASSES = {
  halbe: { // Halbe: Glaskrug mit Henkel und Noppen, wie im Biergarten
    body: 'M50 26H150V150A16 16 0 0 1 134 166H66A16 16 0 0 1 50 150Z',
    top: 26, bottom: 166, extra: 'M150 50h9a24 24 0 0 1 24 24v28a24 24 0 0 1-24 24h-9M54 166Q56 173 65 173H135Q144 173 146 166', shine: 'M60 44V92',
    deco: DIMPLES([[70, 50], [100, 50], [130, 50], [85, 80], [115, 80], [70, 110], [100, 110], [130, 110], [85, 140], [115, 140]]) },
  mass: { // Maßkrug
    body: 'M36 12H160V150A16 16 0 0 1 144 166H52A16 16 0 0 1 36 150Z',
    top: 12, bottom: 166, extra: 'M160 42h10a26 26 0 0 1 26 26v34a26 26 0 0 1-26 26h-10', shine: 'M54 36V140M72 36V140' },
  weizen: {
    body: 'M63 -20C60 -6 56 8 58 24C60 50 76 84 78 110C80 136 76 154 76 162Q76 168 82 168H118Q124 168 124 162C124 154 120 136 122 110C124 84 140 50 142 24C144 8 140 -6 137 -20Z',
    top: -20, bottom: 168, extra: 'M78 168Q80 174 86 174H114Q120 174 122 168', shine: 'M70 4C68 30 80 70 86 110' },
  tulpe: { // Pilstulpe
    body: 'M62 6C58 22 52 40 56 58C60 82 78 100 86 112H114C122 100 140 82 144 58C148 40 142 22 138 6Z',
    top: 6, bottom: 112, extra: `M95 112V160M105 112V160${FOOT(164)}`, shine: 'M68 26C66 46 70 66 80 84' },
  stange: { // Kölsch-Stange
    body: 'M74 -10H126V156Q126 164 118 164H82Q74 164 74 156Z',
    top: -10, bottom: 164, extra: 'M74 158Q74 172 84 172H116Q126 172 126 158', shine: 'M84 10V140' },
  pint: {
    body: 'M52 0C50 8 48 16 48 24C49 30 52 34 52 40L64 158Q65 166 73 166H127Q135 166 136 158L148 40C148 34 151 30 152 24C152 16 150 8 148 0Z',
    top: 0, bottom: 166, extra: 'M66 166Q68 173 76 173H124Q132 173 134 166', shine: 'M62 44L72 140' },
  wein: {
    body: 'M58 0C52 20 48 40 50 56C53 82 74 96 100 96C126 96 147 82 150 56C152 40 148 20 142 0Z',
    top: 0, bottom: 96, extra: `M100 96V160${FOOT(164)}`, shine: 'M64 18C60 40 64 60 76 76' },
  rot: { // großer Rotwein- und Spritzkelch
    body: 'M62 -6C50 16 40 40 42 60C45 90 70 104 100 104C130 104 155 90 158 60C160 40 150 16 138 -6Z',
    top: -6, bottom: 104, extra: `M100 104V160${FOOT(164)}`, shine: 'M58 18C52 42 56 66 70 84' },
  flute: { // Sektflöte
    body: 'M75 -24C73 10 71 40 72 64C73 88 86 104 100 104C114 104 127 88 128 64C129 40 127 10 125 -24Z',
    top: -24, bottom: 104, extra: `M100 104V160${FOOT(164)}`, shine: 'M82 -6C80 30 80 60 86 86' },
  tasse: { // Glühweintasse
    body: 'M52 68H148V136A30 30 0 0 1 118 166H82A30 30 0 0 1 52 136Z',
    top: 68, bottom: 166, extra: 'M148 84h8a18 18 0 0 1 0 36h-10', shine: 'M66 86V136' },
  shot: { // Stamperl
    body: 'M66 78L73 148H127L134 78Z',
    top: 78, bottom: 148, extra: 'M73 148L75 166H125L127 148', shine: 'M78 92L83 136' },
  tumbler: {
    body: 'M42 50L48 150H152L158 50Z',
    top: 50, bottom: 150, extra: 'M48 150L50 166H150L152 150', shine: 'M58 66L62 136' },
  longdrink: {
    body: 'M58 -4L60 150H140L142 -4Z',
    top: -4, bottom: 150, extra: 'M60 150L61 166H139L140 150', shine: 'M70 14V136' },
  cocktail: {
    body: 'M30 20L100 96L170 20Z',
    top: 20, bottom: 96, extra: `M100 96V160${FOOT(164)}`, shine: 'M48 30L74 58' }
};
// Welches Glas zu welchem Getränk gehört (Namen wie in der Datenbank)
const GLASS_OF = (() => {
  const m = {}, put = (g, names) => names.split(',').forEach((n) => { m[n.trim().toLowerCase()] = g; });
  put('halbe', 'Helles,Export,Schwarzbier,Radler,Alkoholfreies Bier,Colabier,Biermischgetränk');
  put('halbe', 'Kellerbier'); put('mass', 'Festbier'); put('weizen', 'Weizenbier'); put('tulpe', 'Pils,Bockbier'); put('stange', 'Kölsch,Altbier,Mexikanisches Lager');
  put('pint', 'Pale Ale,IPA,Stout,Cider,Apfelwein'); put('rot', 'Rotwein,Sangria,Berliner Weiße,Aperol Spritz,Hugo,Limoncello Spritz,Wild Berry Spritz');
  put('wein', 'Weißwein,Rosé,Weinschorle,Federweißer,Lambrusco,Met,Wermut,Sherry,Portwein'); put('flute', 'Sekt,Prosecco,Champagner,Mimosa,Bellini');
  put('tasse', 'Glühwein,Feuerzangenbowle'); put('shot', 'Sake');
  put('tumbler', 'Whisky,Bourbon,Cognac,Weinbrand,Mojito,Caipirinha,Old Fashioned,Whisky Sour,Negroni,Bowle');
  put('longdrink', 'Gin Tonic,Cuba Libre,Moscow Mule,Piña Colada,Sex on the Beach,Tequila Sunrise,Swimming Pool,Long Island Iced Tea,Zombie,Mai Tai,Bloody Mary,Hard Seltzer,Alkopop,Longdrink aus der Dose');
  put('cocktail', 'Martini,Espresso Martini,Margarita,Cosmopolitan');
  return m;
})();
const SPARKLE = /bier|pils|helles|export|weizen|kölsch|alt|lager|ale|ipa|stout|radler|sekt|prosecco|champagner|cider|seltzer|spritz|hugo|mimosa|bellini|lambrusco|alkopop/i;
// Glas, Farben, Eis, Strohhalm und Schaum für einen Eintrag
function glassFor(name, kind, amount, mixer, mixAmt) {
  const n = String(name || '').toLowerCase(), beer = kind === 'beer' || /bier|pils|helles|export|kölsch|ale|ipa|stout|lager/.test(n);
  let g = GLASS_OF[n] || ({ beer: 'halbe', wine: 'wein', spirit: 'shot', mixed: 'longdrink' })[kind] || 'halbe';
  if (beer && amount >= 900 && g !== 'pint') g = 'mass'; // ein Liter Bier gibt es in der Maß
  if (mixer && (kind === 'spirit' || g === 'shot')) g = 'longdrink'; // Schnaps mit Mixer kommt ins Longdrinkglas
  const rgb = name ? drinkRGB(name, kind, amount, mixer, mixAmt) : GOLD;
  const ice = g === 'longdrink' || (g === 'tumbler' && (kind === 'mixed' || !!mixer)) || (g === 'rot' && /spritz|hugo|sangria/.test(n));
  return { g, rgb, ice, straw: g === 'longdrink' && n !== 'hard seltzer', foam: beer, sparkle: SPARKLE.test(n) || !!mixer || !name };
}
