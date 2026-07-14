// Tamil Catholic prayers shown in the Catholic Hub Prayers tab.
export interface TamilPrayer {
  id: string;
  title: string;
  category: string;
  tamil: string;
  english: string;
}

export const TAMIL_PRAYERS: TamilPrayer[] = [
  {
    id: 'our_father',
    title: 'Our Father (விண்ணுலகில் இருக்கிற எங்கள் தந்தையே)',
    category: 'Daily Prayers',
    tamil: `விண்ணுலகில் இருக்கிற எங்கள் தந்தையே
உமது பெயர் தூயது எனப் போற்றப்பெறுக!
உமது ஆட்சி வருக
உமது திருவுளம் விண்ணுலகில் நிறைவேறுவது போல
மண்ணுலகிலும் நிறைவேறுக

எங்கள் அன்றாட உணவை இன்று எங்களுக்குத் தாரும் 
எங்களுக்கு எதிராக குற்றம் செய்வோரை
நாங்கள் மன்னிப்பது போல எங்கள் குற்றங்களை மன்னியும்
எங்களைச் சோதனைக்கு உட்படுத்தாதேயும்,
தீயோனிடமிருந்து எங்களை விடுவித்தருளும்.ஆமென்.`,
    english: `Our Father, who art in heaven, hallowed be Thy name; Thy kingdom come; Thy will be done on earth as it is in heaven. Give us this day our daily bread; and forgive us our trespasses as we forgive those who trespass against us; and lead us not into temptation, but deliver us from evil. Amen.`,
  },
  {
    id: 'hail_mary',
    title: 'Hail Mary (அருள் மிகப்பெற்ற மரியே வாழ்க)',
    category: 'Marian Prayers',
    tamil: `அருள் மிகப்பெற்ற மரியே வாழ்க!ஆண்டவர் உம்முடனே.
பெண்களுக்குள் ஆசி பெற்றவர் நீரே,
உம்முடைய திருவயிற்றின் கனியாகிய இயேசுவும் ஆசி பெற்றவரே.

தூய மரியே, இறைவனின் தாயே,
பாவிகளாய் இருக்கிற எங்களுக்காக,
இப்பொழுதும் எங்கள் இறப்பின் வேளையிலும் வேண்டிக்கொள்ளும்.ஆமென்.`,
    english: `Hail Mary, full of grace, the Lord is with thee. Blessed art thou amongst women, and blessed is the fruit of thy womb, Jesus. Holy Mary, Mother of God, pray for us sinners, now and at the hour of our death. Amen.`,
  },
  {
    id: 'glory_be',
    title: 'Glory Be (மும்மூர்த்திக்கு மகிமை)',
    category: 'Daily Prayers',
    tamil: `தந்தைக்கும் மகனுக்கும் தூய ஆவியாருக்கும் மகிமை உண்டாவதாக.
தொடக்கத்தில் இருந்தது போலவே
இப்போதும் என்றும் என்றென்றும் இருப்பதாக. ஆமென்.`,
    english: `Glory be to the Father, and to the Son, and to the Holy Spirit. As it was in the beginning, is now, and ever shall be, world without end. Amen.`,
  },
  {
    id: 'apostles_creed',
    title: "Apostles' Creed (நம்பிக்கை அறிக்கை)",
    category: 'Creed & Faith',
    tamil: `விண்ணகத்தையும் மண்ணகத்தையும் படைத்த எல்லாம் வல்ல தந்தையாகிய கடவுளை நம்புகின்றேன்.
அவருடைய ஒரே மகனாகிய நம் ஆண்டவர் இயேசு கிறிஸ்துவை நம்புகின்றேன்.
('பிறந்தார்" எனச் சொல்லும் வரை எல்லாரும் தலை வணங்கவும்)
இவர் தூய ஆவியால் கருவுற்று கன்னி மரியாவிடமிருந்து பிறந்தார்.
பொந்தியு பிலாத்தின் அதிகாரத்தில் பாடுபட்டுச் சிலுவையில் அறையப்பட்டு, இறந்து, அடக்கம் செய்யப்பட்டார்.
பாதாளத்தில் இறங்கி, மூன்றாம் நாள் இறந்தோரிடமிருந்து உயிர்த்தெழுந்தார்.
விண்ணகத்திற்கு எழுந்தருளி எல்லாம் வல்ல தந்தையாகிய கடவுளின் வலப்பக்கத்தில் வீற்றிருக்கின்றார்.
அங்கிருந்து வாழ்வோருக்கும் இறந்தோருக்கும் தீர்ப்பு வழங்க வருவார்.
தூய ஆவியாரை நம்புகின்றேன்.
புனித, கத்தோலிக்கத் திரு அவையை நம்புகின்றேன்.
புனிதர்களின் உறவு ஒன்றிப்பை நம்புகின்றேன்.
பாவ மன்னிப்பை நம்புகின்றேன்.
உடலின் உயிர்ப்பை நம்புகின்றேன்.
நிலை வாழ்வை நம்புகின்றேன். ஆமென்.

நம்பிக்கை அறிக்கை (பாடும் போது)

1. விண்ணையும் மண்ணையும் படைத்தவராம்
கடவுள் ஒருவர் இருக்கின்றார்
தந்தை, மகன், தூய ஆவியராய்
ஒன்றாய் வாழ்வோரை நம்புகிறேன்.

2. தூய ஆவியின் வல்லமையால்
இறைமகன் நமக்காய் மனிதரானார்
கன்னி மரியிடம் பிறந்தவராம்
இயேசுவை உறுதியாய் நம்புகிறேன்

3. பிலாத்துவின் ஆட்சியில் பாடுபட்டார்
சிலுவையில் இறந்து அடக்கப்பட்டார்
மூன்றாம் நாளில் உயிர்த்தெழுந்தார்
இறப்பின் மீதே வெற்றி கொண்டார்.

4. விண்ணகம் வாழும் தந்தையிடம்
அரியணைக் கொண்டு இருக்கின்றார்
உலகம் முடியும் காலத்திலே
நடுவராய் திரும்பவும் வந்திடுவார்

5. தூய ஆவியாரை நம்புகிறேன்
பாரினில் அவர் துணை வேண்டுகிறேன ;
பாவ மன்னிப்பில் தூய்மை பெற்று
பரிகார வாழ்வில் நிலைத்திடுவேன்.

6. திரு அவை உரைப்பதை நம்புகிறேன்
புனிதர்கள் உறவை நம்புகிறேன்
உடலின் உயிர்ப்பை நிலைவாழ்வை
உறுதியுடனே நம்புகிறேன் - ஆமென்`,
    english: `I believe in God, the Father almighty, Creator of heaven and earth, and in Jesus Christ, His only Son, our Lord, who was conceived by the Holy Spirit, born of the Virgin Mary, suffered under Pontius Pilate, was crucified, died and was buried; He descended into hell; on the third day He rose again from the dead; He ascended into heaven, and is seated at the right hand of God the Father almighty; from there He will come to judge the living and the dead. I believe in the Holy Spirit, the holy catholic Church, the communion of saints, the forgiveness of sins, the resurrection of the body, and life everlasting. Amen.`,
  },
  {
    id: 'act_of_contrition',
    title: 'Act of Contrition (மனஸ்தாப செபம்)',
    category: 'Penitential Prayers',
    tamil: `என் இறைவா! என் குற்றங்கள் அனைத்திற்காகவும் மனமுருகி வருந்துகிறேன்.
நீர் நன்மைத்தனத்திற்காகவும், பாவம் உம்மை வருத்துகிறதால்
மனஸ்தாபப்படுகிறேன்.
தயவுசெய்து என்னை மன்னித்தருளும்.
உம் உதவியால் எனது வாழ்க்கையை திருத்திக்கொள்கிறேன். ஆமென்.`,
    english: `O my God, I am heartily sorry for having offended Thee, and I detest all my sins because of Thy just punishments, but most of all because they offend Thee, my God, who art all good and deserving of all my love. I firmly resolve, with the help of Thy grace, to sin no more and to avoid the near occasions of sin. Amen.`,
  },
  {
    id: 'divine_mercy',
    title: 'Divine Mercy Chaplet (தெய்வீக இரக்க செபமாலை)',
    category: 'Chaplets',
    tamil: `(ஒவ்வொரு மணியிலும்):
நிரந்தர பிதாவே, உம் மகனாகிய இயேசுவின்
மிகவும் வேதனையுள்ள திரு ஆவி மற்றும் திரு ரத்தத்தை
எங்களுடைய பாவங்களுக்கும் உலகம் முழுவதும் உள்ளவர்களின்
பாவங்களுக்கும் பரிகாரமாக உமக்கு ஒப்புக்கொடுக்கிறோம்.

(திரும்பி சொல்லும் பகுதி):
உமது பாடுகளைக் கொண்டு எங்களிடமும்
உலகம் முழுவதும் இரக்கமாக இரும். ஆமென்.`,
    english: `Eternal Father, I offer You the Body and Blood, Soul and Divinity of Your dearly beloved Son, Our Lord Jesus Christ, in atonement for our sins and those of the whole world. (repeat) For the sake of His sorrowful Passion, have mercy on us and on the whole world. Amen.`,
  },
  {
    id: 'matha_prayer',
    title: 'The Litany of the Blessed Virgin Mary (மாதா பிரார்த்தனை)',
    category: 'Marian Prayers',
    tamil: `சுவாமி கிருபையாயிரும்
கிறிஸ்துவே கிருபையாயிரும்
கிறிஸ்துவே பிரார்த்தனை கேட்டருளும்
கிறிஸ்த்துவே தயவாய் கேட்டருளும்

விண்ணகத் தந்தை பிதாவே
உலகத்தை மீட்ட சுதன் தேவா
பரிசுத்த ஆவி இறைவனே
எம்மேல் இரக்கம் வைத்தருளும்

புனிதம் நிறைந்த மாமரியே
இறைவனின் புனித மாதாவே
கன்னியரில் உயர் கன்னிகையே
குழு: எங்களுக்காக வேண்டிக்கொள்ளும்

கிறிஸ்துவை ஈன்ற மாதாவே
திருச்சபையோரின் மாதாவே
திருவருட்கொடைகளின் மாதாவே
குழு: எங்களுக்காக வேண்டிக்கொள்ளும்

மாகா பரிசுத்த மாதாவே
பழுதற்ற கன்னி மாதாவே
மாசற்ற கன்னி மாதாவே
குழு: எங்களுக்காக வேண்டிக்கொள்ளும்

கன்னிமை வழுவா மாதாவே
பேரன்பிற்குரிய மாதாவே
பெரும்வியப்பான மாதாவே
குழு: எங்களுக்காக வேண்டிக்கொள்ளும்

நல்ல ஆலோசனை மாதாவே
சிருஷ்டிகருடைய மாதாவே
எங்கள் மீட்பரின் மாதாவே
குழு: எங்களுக்காக வேண்டிக்கொள்ளும்

திருச்சபையினுடைய மாதாவே
வணக்கத்திற்குரிய மாதாவே
துதிகளுக்குரிய மாதாவே
குழு: எங்களுக்காக வேண்டிக்கொள்ளும்

சக்திமிகுந்த கன்னிகையே
இறக்கமிகுந்த கன்னிகையே
விசுவாசியான கன்னிகையே
குழு: எங்களுக்காக வேண்டிக்கொள்ளும்

தருமத்தினுடைய கண்ணாடியே
ஞானத்தின் நல்ல பிறப்பிடமே
எங்கள் மகிழ்வின் காரணமே
குழு: எங்களுக்காக வேண்டிக்கொள்ளும்

ஞானம் மிகுந்த பாத்திரமே
மகிமை விளங்கும் பாத்திரமே
உன்னத பக்தியின் பாத்திரமே
குழு: எங்களுக்காக வேண்டிக்கொள்ளும்

மறைபொருளான ரோஜாவே
தாவீது அரசரின் கோபுரமே
தந்த மயமான கோபுரமே
குழு: எங்களுக்காக வேண்டிக்கொள்ளும்

தங்க மயமான ஆலயமே
வாக்குத்தத்தின் நல் பெட்டகமே
வானக எழில்மிகு வாசலே
குழு: எங்களுக்காக வேண்டிக்கொள்ளும்

விடியற்காலத்தின் விண்மீனே
வியாதியுற்றோருக்கு ஆரோக்கியமே
பாவிகள் யாவர்க்கும் அடைக்கலமே
குழு: எங்களுக்காக வேண்டிக்கொள்ளும்

துண்புறுவோருக்கு தேற்றரவே
கிறிஸ்தவருடைய சகாயமே
சம்மனசுக்களின் ராக்கினியே
குழு: எங்களுக்காக வேண்டிக்கொள்ளும்

பிதா பிதாக்களின் ராக்கினியே
தீர்க்க-தரிசிகளின் ராக்கினியே
அப்போஸ்தலர்களின் ராக்கினியே
குழு: எங்களுக்காக வேண்டிக்கொள்ளும்

மறைசாட்சியரின் ராக்கினியே
துதியர்களுடைய ராக்கினியே
கன்னியருடைய ராக்கினியே
குழு: எங்களுக்காக வேண்டிக்கொள்ளும்

புனிதர்களுடைய ராக்கினியே
பிறவிபாவமற்ற ராக்கினியே
விண்ணேற்படைந்த ராக்கினியே
குழு: எங்களுக்காக வேண்டிக்கொள்ளும்

திருச்செபமாலையின் ராக்கினியே
சமாதானத்தின் ராக்கினியே
புனித ஆரோக்கிய மாதாவே
குழு: எங்களுக்காக வேண்டிக்கொள்ளும்

உலகின் பாவங்களைப் போக்கும் உத்தம இறைவனின் செம்மறியே-3

குழு: எங்கள் பாவங்கள் பொறுத்தருளும் – 2
குழு: எங்கள் மன்றாட்டைக் கேட்டருளும் – 2
குழு: எம்மேல் இரக்கம் வைத்தருளும் – 2`,
    english: `Lord, have mercy on us.
Christ, have mercy on us.
Lord, have mercy on us.
Christ, hear us.
Christ, graciously hear us.

God the Father of Heaven, have mercy on us.
God the Son, Redeemer of the world, have mercy on us.
God the Holy Ghost, have mercy on us.
Holy Trinity, one God, have mercy on us.

Holy Mary, pray for us.
Holy Mother of God, pray for us.
Holy Virgin of virgins, pray for us.

Mother of Christ, pray for us.
Mother of the Church, pray for us.
Mother of divine grace, pray for us.

Mother most pure, pray for us.
Mother most chaste, pray for us.
Mother inviolate, pray for us.

Mother undefiled, pray for us.
Mother most amiable, pray for us.
Mother most admirable, pray for us.

Mother of good counsel, pray for us.
Mother of our Creator, pray for us.
Mother of our Saviour, pray for us.

Virgin most prudent, pray for us.
Virgin most venerable, pray for us.
Virgin most renowned, pray for us.

Virgin most powerful, pray for us.
Virgin most merciful, pray for us.
Virgin most faithful, pray for us.

Mirror of justice, pray for us.
Seat of wisdom, pray for us.
Cause of our joy, pray for us.

Spiritual vessel, pray for us.
Vessel of honour, pray for us.
Singular vessel of devotion, pray for us.

Mystical rose, pray for us.
Tower of David, pray for us.
Tower of ivory, pray for us.

House of gold, pray for us.
Ark of the covenant, pray for us.
Gate of heaven, pray for us.

Morning star, pray for us.
Health of the sick, pray for us.
Refuge of sinners, pray for us.

Comforter of the afflicted, pray for us.
Help of Christians, pray for us.
Queen of Angels, pray for us.

Queen of Patriarchs, pray for us.
Queen of Prophets, pray for us.
Queen of Apostles, pray for us.

Queen of Martyrs, pray for us.
Queen of Confessors, pray for us.
Queen of Virgins, pray for us.

Queen of all Saints, pray for us.
Queen conceived without original sin, pray for us.
Queen assumed into heaven, pray for us.

Queen of the most holy Rosary, pray for us.
Queen of peace, pray for us.
Queen of Our Lady of Good Health, pray for us. (Note: This specific title reflects the Velankanni health devotion mentioned in the Tamil text).

Concluding Prayers
Lamb of God, who takest away the sins of the world, spare us, O Lord.
Lamb of God, who takest away the sins of the world, graciously hear us, O Lord.
Lamb of God, who takest away the sins of the world, have mercy on us.`,
  },
];
