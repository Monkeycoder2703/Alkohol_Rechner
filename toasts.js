'use strict';
/* Trinksprüche: eigene, kurze Sprüche je Sprache, dazu "Prost" in vielen Sprachen.
   Sie sollen gute Laune machen, nicht zum Mehrtrinken drängen. Neue Sprüche einfach in die Listen schreiben. */
const TOASTS = {
de: {
  classic: [
    'Auf uns – und auf alle, die heute nicht dabei sein können.',
    'Zum Wohl! Auf die Gesundheit, die Freundschaft und diesen Abend.',
    'Hoch die Gläser auf alles, was wir heute zu feiern haben.',
    'Auf die Leute an diesem Tisch. Bessere gibt’s nicht.',
    'Auf das, was war, und auf das, was noch kommt.',
    'Auf die Gastgeber – ohne euch säßen wir jetzt auf dem Sofa.',
    'Auf alte Freunde, neue Geschichten und gute Gespräche.',
    'Auf den Grund, warum wir heute alle hier sind.'
  ],
  funny: [
    'Auf die Freundschaft! Die hält länger als jeder Kater.',
    'Auf unsere Leber: Sie arbeitet still – heute sagen wir mal Danke.',
    'Auf die Diät. Sie beginnt wie immer morgen.',
    'Auf alle Pläne, die wir heute schmieden und morgen vergessen.',
    'Das Glas ist halb voll. Optimisten, Prost!',
    'Auf den Montag! Möge er noch ganz weit weg sein.',
    'Auf die Gruppenfotos von heute – mögen sie nie online landen.',
    'Beim Anstoßen in die Augen schauen, sonst gibt’s sieben Jahre schlechten Schlaf.',
    'Auf die Leute, die morgen früh noch wissen, wie der Abend war.',
    'Auf das WLAN-Passwort dieser Wohnung – das Wichtigste hier.'
  ],
  calm: [
    'Auf einen Abend, an den wir uns morgen noch gern erinnern.',
    'Lieber ein Glas, das man genießt, als drei, die man bereut.',
    'Prost aufs Limit: Wer’s kennt, feiert länger.',
    'Auf das Wasser zwischendurch – den heimlichen Helden des Abends.',
    'Auf alle, die heute fahren: Die erste Runde Limo geht auf uns.',
    'Mit Freunden und mit Maß – so schmeckt’s am besten.',
    'Auf die, die heute gar nichts trinken. Ihr seid trotzdem die Besten.'
  ]
},
en: {
  classic: [
    'To us – and to everyone who couldn’t make it tonight.',
    'Cheers to good health, good friends and a good evening.',
    'Raise your glasses to everything we have to celebrate today.',
    'To the people at this table. You can’t beat them.',
    'To what was, and to what’s still to come.',
    'To our hosts – without you we’d be on the sofa right now.',
    'To old friends, new stories and good conversations.',
    'To the reason we’re all here tonight.'
  ],
  funny: [
    'To friendship – it lasts longer than any hangover.',
    'To our livers: they work quietly, so tonight we say thank you.',
    'To the diet. Starting tomorrow, as always.',
    'To all the plans we make tonight and forget tomorrow.',
    'The glass is half full. Optimists, cheers!',
    'To Monday – may it stay far away for a little longer.',
    'To tonight’s group photos – may they never make it online.',
    'Look each other in the eye when you clink, or it’s seven years of bad sleep.',
    'To everyone who’ll still remember tonight tomorrow morning.',
    'To the Wi-Fi password of this flat – the most important thing here.'
  ],
  calm: [
    'To an evening we’ll still love remembering tomorrow.',
    'Better one glass you enjoy than three you regret.',
    'Cheers to knowing your limit – those who do, party longer.',
    'To the water in between – the secret hero of the night.',
    'To everyone driving tonight: the first round of lemonade is on us.',
    'With friends and in moderation – that’s how it tastes best.',
    'To those not drinking tonight. You’re still the best.'
  ]
}};
// "Prost" in vielen Sprachen: Wort, Aussprache (falls nötig), Sprache auf Deutsch und Englisch
const CHEERS = [
  ['Prost! / Zum Wohl!', '', 'Deutsch', 'German'], ['Cheers!', '', 'Englisch', 'English'], ['Santé !', 'sonn-TEH', 'Französisch', 'French'],
  ['Salute! / Cin cin!', 'sa-LU-te / tschin tschin', 'Italienisch', 'Italian'], ['¡Salud!', 'sa-LUD', 'Spanisch', 'Spanish'], ['Saúde!', 'sa-U-dsche', 'Portugiesisch', 'Portuguese'],
  ['Proost!', '', 'Niederländisch', 'Dutch'], ['Skål!', 'skohl', 'Schwedisch, Dänisch, Norwegisch', 'Swedish, Danish, Norwegian'], ['Kippis!', '', 'Finnisch', 'Finnish'],
  ['Na zdrowie!', 'na SDRO-wje', 'Polnisch', 'Polish'], ['Na zdraví!', 'na SDRA-wie', 'Tschechisch', 'Czech'], ['Egészségedre!', 'E-gehs-schee-ged-re', 'Ungarisch', 'Hungarian'],
  ['Noroc!', 'no-ROK', 'Rumänisch', 'Romanian'], ['Živjeli!', 'SCHI-wje-li', 'Kroatisch, Serbisch', 'Croatian, Serbian'], ['За здоровье!', 'sa sda-ROW-je', 'Russisch', 'Russian'],
  ['Şerefe!', 'sche-re-FE', 'Türkisch', 'Turkish'], ['Γειά μας!', 'JA mas', 'Griechisch', 'Greek'], ['Sláinte!', 'SLAHN-tsche', 'Irisch', 'Irish'],
  ['L’chaim!', 'le-CHA-jim', 'Hebräisch', 'Hebrew'], ['乾杯!', 'kan-pai', 'Japanisch', 'Japanese'], ['干杯!', 'gan-bei', 'Chinesisch', 'Chinese'],
  ['건배!', 'gon-bä', 'Koreanisch', 'Korean'], ['Terviseks!', '', 'Estnisch', 'Estonian'], ['Į sveikatą!', 'i swei-ka-TA', 'Litauisch', 'Lithuanian']
];
