'use strict';
/* Trinksprüche je Sprache in vier Gruppen (Klassiker mit Herkunft, Reime, Lustig, Mit Maß), dazu "Prost" in vielen Sprachen.
   Klassiker sind alte, freie Sprüche; der Rest ist selbst geschrieben. Sie sollen gute Laune machen, nicht zum Mehrtrinken drängen. */
// Ein Eintrag ist entweder ein Text oder [Text, Herkunft].
const TOASTS = {
de: {
  classic: [
    ['Hopfen und Malz – Gott erhalt’s!', 'alter Brauerspruch'],
    ['Ein Prosit der Gemütlichkeit!', 'Wiesn-Klassiker'],
    ['Wer Sorgen hat, hat auch Likör.', 'Wilhelm Busch'],
    ['Es gibt mehr alte Weintrinker als alte Ärzte.', 'Sprichwort'],
    ['Bier auf Wein, das lass sein. Wein auf Bier, das rat ich dir.', 'Volksweisheit'],
    ['Im Wein liegt Wahrheit – im Wasser die Klarheit.', 'frei nach „In vino veritas“'],
    ['Zicke, zacke, zicke, zacke – hoi, hoi, hoi!', 'Trinkruf'],
    ['Auf die, die nicht hier sein können. Ihr fehlt.', 'Klassiker unter Freunden']
  ],
  rhyme: [
    'Hoch die Gläser, runter die Sorgen – das Aufräumen machen wir morgen.',
    'Ob Bier, ob Wein, ob Limonade – ohne euch wär’s jammerschade.',
    'Auf die Liebe, auf das Leben – und auf jeden, der heut einen ausgegeben.',
    'Das Glas ist voll, der Abend jung – auf Freundschaft und Erinnerung!',
    'Ein Glas für dich, ein Glas für mich – und Wasser gibt’s dazwischen, sicherlich.',
    'Wir stoßen an und sind uns einig: Der Abend wird gut, und morgen nicht peinlich.',
    'Prost, ihr Lieben, prost, ihr Leut’ – schön, dass ihr da seid, gerade heut.'
  ],
  funny: [
    'Auf die Diät. Sie beginnt wie immer am Montag.',
    'Auf die Arbeit – ohne sie könnten wir uns das hier gar nicht leisten.',
    'Auf die Fotos von heute Abend: Mögen sie nie den Familienchat erreichen.',
    'Auf meine Freunde. Ihr kennt alle meine Geschichten und hört trotzdem zu.',
    'Auf uns – die einzigen Menschen, die meine Witze lustig finden.',
    'Auf den Gastgeber, der morgen die Spülmaschine ausräumt.',
    'Erhebt die Gläser, nicht die Stimme – die Nachbarn schlafen schon.',
    'Wer beim Anstoßen nicht in die Augen schaut, schläft sieben Jahre schlecht. Also: Augen auf!'
  ],
  calm: [
    'Der Kater von morgen ist heute nicht eingeladen.',
    'Auf einen Abend, an den wir uns morgen noch gern erinnern.',
    'Lieber ein Glas genießen als drei bereuen.',
    'Wer sein Limit kennt, muss es niemandem beweisen.',
    'Auf das Wasser zwischendurch – den unterschätzten Helden des Abends.',
    'Auf alle, die heute fahren: Ihr bringt uns heim, wir bringen euch die Limo.',
    'Genießen heißt aufhören, bevor man muss.',
    'Auf alle, die heute nichts trinken. Ihr wisst morgen alles – bitte seid gnädig.'
  ]
},
en: {
  classic: [
    ['Here’s to us – who’s like us? Damn few!', 'Scottish toast'],
    ['Here’s to you and here’s to me, and may we never disagree. But if we do, then here’s to me!', 'traditional'],
    ['May the road rise up to meet you.', 'Irish blessing'],
    ['Work is the curse of the drinking classes.', 'Oscar Wilde'],
    ['In vino veritas – in aqua sanitas.', 'Latin: in wine truth, in water health'],
    ['Eat, drink and be merry.', 'old saying'],
    ['Good company, good wine, good welcome, can make good people.', 'Shakespeare, Henry VIII'],
    ['To absent friends.', 'classic among friends']
  ],
  rhyme: [
    'Glasses up and worries down – the dishes can wait till we’re back in town.',
    'Here’s to good friends and a glass of good cheer – I’m glad every one of you is here.',
    'To love, to life, to all the rest – and to this table, the very best.',
    'A glass for you, a glass for me, and water in between – one, two, three.',
    'Here’s to the old days and here’s to the new – and here’s to whoever buys the next round too.',
    'Raise it high and drink it slow – the night is long, there’s no rush to go.',
    'To the friends who came from near and far – you make this evening what you are.'
  ],
  funny: [
    'To the diet. Starting Monday, as always.',
    'To work – without it we couldn’t afford any of this.',
    'To tonight’s photos: may they never reach the family group chat.',
    'To my friends. You know all my stories and still listen.',
    'To us – the only people who laugh at my jokes.',
    'To the host, who’ll be emptying the dishwasher tomorrow.',
    'Raise your glasses, not your voices – the neighbours are asleep.',
    'Look each other in the eye when you clink, or it’s seven years of bad sleep.'
  ],
  calm: [
    'Tomorrow’s hangover is not invited tonight.',
    'To an evening we’ll still love remembering tomorrow.',
    'Better to enjoy one glass than regret three.',
    'If you know your limit, you don’t have to prove it.',
    'To the water in between – the unsung hero of the night.',
    'To everyone driving tonight: you get us home, we get you the lemonade.',
    'Real enjoyment means stopping before you have to.',
    'To everyone not drinking tonight: you’ll remember everything. Please be kind.'
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
