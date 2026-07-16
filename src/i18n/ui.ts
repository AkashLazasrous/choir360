import { Language } from '../types';

/** Chrome + marketing UI copy. Falls back to English for missing keys. */
export type UiKey =
  | 'ecosystem'
  | 'search'
  | 'navOverview'
  | 'navCalendar'
  | 'navMasses'
  | 'navAttendance'
  | 'navBible'
  | 'navSongs'
  | 'navPeople'
  | 'navMinistry'
  | 'navCatholicHub'
  | 'navPlanner'
  | 'navAchievements'
  | 'navInsights'
  | 'navRehearsals'
  | 'changeParish'
  | 'syncSignIn'
  | 'syncLive'
  | 'syncConnecting'
  | 'signIn'
  | 'register'
  | 'signOut'
  | 'signInHint'
  | 'emailOrMobile'
  | 'passwordDob'
  | 'signingIn'
  | 'newToChoir'
  | 'submitRegistration'
  | 'liveSyncActive'
  | 'awaitingApproval'
  | 'demoMode'
  | 'mktDesign'
  | 'mktModules'
  | 'mktHow'
  | 'mktPricing'
  | 'mktFaq'
  | 'mktJoin'
  | 'mktHeroTitle1'
  | 'mktHeroTitle2'
  | 'mktHeroDesc'
  | 'mktJoinChoir'
  | 'mktBrowseSongs'
  | 'mktTrust'
  | 'mktArchdiocese'
  | 'mktServing'
  | 'mktDesignEyebrow'
  | 'mktDesignTitle1'
  | 'mktDesignTitle2'
  | 'mktDesignBody'
  | 'mktBefore1'
  | 'mktAfter1'
  | 'mktBefore2'
  | 'mktAfter2'
  | 'mktBefore3'
  | 'mktAfter3'
  | 'mktStatsEyebrow'
  | 'mktStatsTitle'
  | 'mktStatHymns'
  | 'mktStatModules'
  | 'mktStatLanguages'
  | 'mktModulesEyebrow'
  | 'mktModulesTitle'
  | 'mktModulesBody'
  | 'mktExploreHub'
  | 'mktFeatMasses'
  | 'mktFeatMassesBody'
  | 'mktFeatSongs'
  | 'mktFeatSongsBody'
  | 'mktFeatMembers'
  | 'mktFeatMembersBody'
  | 'mktFeatCalendar'
  | 'mktFeatCalendarBody'
  | 'mktFeatAttendance'
  | 'mktFeatAttendanceBody'
  | 'mktFeatAi'
  | 'mktFeatAiBody'
  | 'mktFeatCatholic'
  | 'mktFeatCatholicBody'
  | 'mktFeatInsights'
  | 'mktFeatInsightsBody'
  | 'mktHowEyebrow'
  | 'mktHowTitle'
  | 'mktStep1'
  | 'mktStep1Body'
  | 'mktStep2'
  | 'mktStep2Body'
  | 'mktStep3'
  | 'mktStep3Body'
  | 'mktStartReg'
  | 'mktPricingEyebrow'
  | 'mktPricingTitle1'
  | 'mktPricingTitle2'
  | 'mktPricingBody'
  | 'mktPerMonth'
  | 'mktGetStarted'
  | 'mktFaqTitle'
  | 'mktFaq1q'
  | 'mktFaq1a'
  | 'mktFaq2q'
  | 'mktFaq2a'
  | 'mktFaq3q'
  | 'mktFaq3a'
  | 'mktFaq4q'
  | 'mktFaq4a'
  | 'mktFaq5q'
  | 'mktFaq5a'
  | 'mktCtaTitle'
  | 'mktCtaBody'
  | 'mktRegisterMember'
  | 'mktSeeCalendar';

const en: Record<UiKey, string> = {
  ecosystem: 'Catholic Music Ecosystem',
  search: 'Search',
  navOverview: 'Overview',
  navCalendar: 'Calendar',
  navMasses: 'Liturgy & Masses',
  navAttendance: 'Attendance',
  navBible: 'Bible',
  navSongs: 'Music Library',
  navPeople: 'People',
  navMinistry: 'My Ministry',
  navCatholicHub: 'Catholic Hub',
  navPlanner: 'AI Mass Planner',
  navAchievements: 'My Achievements',
  navInsights: 'Insights',
  navRehearsals: 'Rehearsals',
  changeParish: 'Change Parish',
  syncSignIn: 'Sign in required',
  syncLive: 'Live',
  syncConnecting: 'Connecting…',
  signIn: 'Sign in',
  register: 'Register',
  signOut: 'Sign out',
  signInHint: 'Email or mobile · password = date of birth (DDMMYYYY)',
  emailOrMobile: 'Email or mobile number',
  passwordDob: 'DOB as DDMMYYYY (e.g. 01012000)',
  signingIn: 'Signing in...',
  newToChoir: 'New to the choir?',
  submitRegistration: 'Submit registration',
  liveSyncActive: 'live sync active',
  awaitingApproval: 'Awaiting parish admin approval. You can browse public pages; member portal unlocks after approval.',
  demoMode: 'Live sign in is not configured. The app is running in local demo mode.',
  mktDesign: 'Design',
  mktModules: 'Modules',
  mktHow: 'How it works',
  mktPricing: 'Pricing',
  mktFaq: 'FAQ',
  mktJoin: 'Join',
  mktHeroTitle1: "Your choir's ministry.",
  mktHeroTitle2: 'Beautifully organised.',
  mktHeroDesc: 'Masses, rehearsals, hymns, attendance, and accounts — so your parish choir spends less time coordinating and more time singing.',
  mktJoinChoir: 'Join your choir',
  mktBrowseSongs: 'Browse songs ›',
  mktTrust: 'Per-parish data isolation',
  mktArchdiocese: 'Archdiocese of Madras–Mylapore',
  mktServing: 'Serving',
  mktDesignEyebrow: 'Design',
  mktDesignTitle1: 'From WhatsApp chaos',
  mktDesignTitle2: 'to one calm desk.',
  mktDesignBody: 'Liturgy times, lyric sheets, and payment splits used to live in group chats and paper. Choir360 brings the whole ministry into one place — clear, fast, and built for parish life.',
  mktBefore1: 'Mass times buried in chats',
  mktAfter1: 'A calendar every member can check, next liturgy on top.',
  mktBefore2: 'Photocopied sheets going missing',
  mktAfter2: 'Searchable lyrics on any phone — even mid-mass.',
  mktBefore3: 'Payment splits on paper',
  mktAfter3: 'Automatic singer and instrumentalist shares, tracked.',
  mktStatsEyebrow: 'Built for ministry scale',
  mktStatsTitle: "Everything you need. Nothing you don't.",
  mktStatHymns: 'Hymns & songs',
  mktStatModules: 'Ministry modules',
  mktStatLanguages: 'Languages',
  mktModulesEyebrow: 'Modules',
  mktModulesTitle: 'One platform for the whole choir.',
  mktModulesBody: 'Every capability included — free for every parish.',
  mktExploreHub: 'Explore Catholic Hub ›',
  mktFeatMasses: 'Masses & Accounts',
  mktFeatMassesBody: 'Log every liturgy, propose payment shares, and track collections to the rupee.',
  mktFeatSongs: 'Song Library',
  mktFeatSongsBody: 'Searchable Tamil hymns with lyrics and categories — including Jebathotta Jeyageethangal.',
  mktFeatMembers: 'Member Management',
  mktFeatMembersBody: 'Self-service registration, voice-part rosters, private contacts kept private.',
  mktFeatCalendar: 'Unified Calendar',
  mktFeatCalendarBody: 'Masses, rehearsals, and parish events so nobody misses a call time.',
  mktFeatAttendance: 'Attendance',
  mktFeatAttendanceBody: 'Mark attendance in one tap. Celebrate consistency with streaks and badges.',
  mktFeatAi: 'AI Hub',
  mktFeatAiBody: 'Draft announcements, suggest hymns, answer choir questions.',
  mktFeatCatholic: 'Catholic Hub',
  mktFeatCatholicBody: 'Daily gospel, Tamil prayers, saints, and the liturgical year.',
  mktFeatInsights: 'Insights',
  mktFeatInsightsBody: 'Choir health, attendance trends, and financial summaries.',
  mktHowEyebrow: 'How it works',
  mktHowTitle: 'Singing within minutes.',
  mktStep1: 'Register',
  mktStep1Body: 'Voice part and parish in under two minutes on any phone.',
  mktStep2: 'Get approved',
  mktStep2Body: 'Your choir admin reviews — you are notified the moment it happens.',
  mktStep3: 'Sing',
  mktStep3Body: 'Masses, rehearsals, lyrics, and attendance from one calm desk.',
  mktStartReg: 'Start registration',
  mktPricingEyebrow: 'Pricing',
  mktPricingTitle1: 'Free.',
  mktPricingTitle2: 'For every parish.',
  mktPricingBody: 'A ministry tool, not a product. Masses, songs, accounts, AI hub, insights — included for every choir at no cost.',
  mktPerMonth: 'per month, forever',
  mktGetStarted: 'Get started',
  mktFaqTitle: 'Questions. Answered.',
  mktFaq1q: 'Is Choir360 free for our parish?',
  mktFaq1a: 'Yes. Free for parish choirs — no subscriptions, seat limits, or locked features.',
  mktFaq2q: 'Who can see my personal details?',
  mktFaq2a: 'Only you and your choir administrators. Contact details are stored separately and protected by per-parish security rules.',
  mktFaq3q: 'Does it work on mobile?',
  mktFaq3a: 'Yes — mobile-first, with bottom navigation, large touch targets, and offline-friendly lyrics.',
  mktFaq4q: 'Can we manage money for special masses?',
  mktFaq4a: 'Yes. Propose amounts, split singer and instrumentalist shares, and track what has been received.',
  mktFaq5q: 'Tamil and English together?',
  mktFaq5a: 'Song library, prayers, and readings support both — with phonetic search (type “anbe” to find அன்பே).',
  mktCtaTitle: 'Ready to lift your voice?',
  mktCtaBody: 'Join your parish choir on Choir360 — registration takes two minutes.',
  mktRegisterMember: 'Register as a member',
  mktSeeCalendar: 'See the calendar ›',
};

const ta: Record<UiKey, string> = {
  ecosystem: 'கத்தோலிக்க இசை சூழல்',
  search: 'தேடுக',
  navOverview: 'முகப்பு',
  navCalendar: 'நாட்காட்டி',
  navMasses: 'திருவழிபாடு & பலிகள்',
  navAttendance: 'வருகைப்பதிவு',
  navBible: 'வேதாகமம்',
  navSongs: 'பாடல் நூலகம்',
  navPeople: 'உறுப்பினர்கள்',
  navMinistry: 'என் ஊழியம்',
  navCatholicHub: 'கத்தோலிக்க மையம்',
  navPlanner: 'AI திருப்பலி திட்டம்',
  navAchievements: 'என் சாதனைகள்',
  navInsights: 'புள்ளிவிவரங்கள்',
  navRehearsals: 'பயிற்சிகள்',
  changeParish: 'பங்கை மாற்று',
  syncSignIn: 'உள்நுழைவு தேவை',
  syncLive: 'நேரலை',
  syncConnecting: 'இணைக்கிறது…',
  signIn: 'உள்நுழைக',
  register: 'பதிவு',
  signOut: 'வெளியேறு',
  signInHint: 'மின்னஞ்சல் அல்லது மொபைல் · கடவுச்சொல் = பிறந்த தேதி (DDMMYYYY)',
  emailOrMobile: 'மின்னஞ்சல் அல்லது மொபைல் எண்',
  passwordDob: 'பிறந்த தேதி DDMMYYYY (எ.கா. 01012000)',
  signingIn: 'உள்நுழைகிறது...',
  newToChoir: 'புதிய உறுப்பினரா?',
  submitRegistration: 'பதிவு சமர்ப்பிக்கவும்',
  liveSyncActive: 'நேரலை ஒத்திசைவு செயலில்',
  awaitingApproval: 'பங்கு நிர்வாகி ஒப்புதலுக்காக காத்திருக்கிறது. பொதுப் பக்கங்களைப் பார்க்கலாம்; ஒப்புதலுக்குப் பிறகு உறுப்பினர் போர்டல் திறக்கும்.',
  demoMode: 'நேரலை உள்நுழைவு அமைக்கப்படவில்லை. உள்ளூர் டெமோ முறையில் இயங்குகிறது.',
  mktDesign: 'வடிவமைப்பு',
  mktModules: 'தொகுதிகள்',
  mktHow: 'எப்படி வேலை செய்கிறது',
  mktPricing: 'விலை',
  mktFaq: 'கேள்விகள்',
  mktJoin: 'இணையுங்கள்',
  mktHeroTitle1: 'உங்கள் பாடகர் ஊழியம்.',
  mktHeroTitle2: 'அழகாக ஒழுங்கமைக்கப்பட்டது.',
  mktHeroDesc: 'திருப்பலிகள், பயிற்சிகள், பாடல்கள், வருகைப்பதிவு மற்றும் கணக்குகள் — உங்கள் பங்கு பாடகர் குழு ஒருங்கிணைப்பில் குறைவாகவும் பாடுவதில் அதிகமாகவும் இருக்கட்டும்.',
  mktJoinChoir: 'உங்கள் குழுவில் இணையுங்கள்',
  mktBrowseSongs: 'பாடல்களைப் பாருங்கள் ›',
  mktTrust: 'பங்கு வாரியான தரவுப் பாதுகாப்பு',
  mktArchdiocese: 'சென்னை–மைலாப்பூர் மறைமாவட்டம்',
  mktServing: 'சேவை செய்கிறது',
  mktDesignEyebrow: 'வடிவமைப்பு',
  mktDesignTitle1: 'வாட்ஸ்அப் குழப்பத்திலிருந்து',
  mktDesignTitle2: 'ஒரே அமைதியான மேசைக்கு.',
  mktDesignBody: 'திருப்பலி நேரங்கள், பாடல் தாள்கள், பணப் பகிர்வுகள் குழுச் செய்திகளிலும் காகிதத்திலும் இருந்தன. Choir360 முழு ஊழியத்தையும் ஒரே இடத்தில் கொண்டு வருகிறது.',
  mktBefore1: 'அரட்டைகளில் புதைந்த திருப்பலி நேரங்கள்',
  mktAfter1: 'ஒவ்வொரு உறுப்பினரும் பார்க்கும் நாட்காட்டி, அடுத்த திருவழிபாடு மேலே.',
  mktBefore2: 'காணாமல் போகும் நகல் தாள்கள்',
  mktAfter2: 'எந்த போனிலும் தேடக்கூடிய பாடல் வரிகள் — திருப்பலியிலும்.',
  mktBefore3: 'காகிதத்தில் பணப் பகிர்வு',
  mktAfter3: 'பாடகர் மற்றும் இசைக்கலைஞர் பங்குகள் தானாகக் கணக்கிடப்பட்டு கண்காணிக்கப்படும்.',
  mktStatsEyebrow: 'ஊழிய அளவிற்கு உருவாக்கப்பட்டது',
  mktStatsTitle: 'உங்களுக்குத் தேவையான அனைத்தும். தேவையற்றது எதுவுமில்லை.',
  mktStatHymns: 'பாடல் & கீர்த்தனைகள்',
  mktStatModules: 'ஊழியத் தொகுதிகள்',
  mktStatLanguages: 'மொழிகள்',
  mktModulesEyebrow: 'தொகுதிகள்',
  mktModulesTitle: 'முழு பாடகர் குழுவிற்கும் ஒரே தளம்.',
  mktModulesBody: 'அனைத்து வசதிகளும் அடங்கும் — ஒவ்வொரு பங்கிற்கும் இலவசம்.',
  mktExploreHub: 'கத்தோலிக்க மையத்தை ஆராயுங்கள் ›',
  mktFeatMasses: 'திருப்பலி & கணக்குகள்',
  mktFeatMassesBody: 'ஒவ்வொரு திருவழிபாட்டையும் பதிவு செய்து, பங்குகளை முன்மொழிந்து, வசூலைக் கண்காணிக்கவும்.',
  mktFeatSongs: 'பாடல் நூலகம்',
  mktFeatSongsBody: 'தேடக்கூடிய தமிழ் பாடல்கள் — ஜெபத்தோட்ட ஜெயகீதங்கள் உட்பட.',
  mktFeatMembers: 'உறுப்பினர் மேலாண்மை',
  mktFeatMembersBody: 'சுய பதிவு, குரல் பகுதி பட்டியல், தனிப்பட்ட தொடர்புகள் பாதுகாக்கப்படும்.',
  mktFeatCalendar: 'ஒருங்கிணைந்த நாட்காட்டி',
  mktFeatCalendarBody: 'திருப்பலிகள், பயிற்சிகள், பங்கு நிகழ்வுகள் — யாரும் நேரத்தைத் தவறவிட மாட்டார்கள்.',
  mktFeatAttendance: 'வருகைப்பதிவு',
  mktFeatAttendanceBody: 'ஒரே தட்டில் வருகையைப் பதிவு செய்யுங்கள். தொடர்ச்சியைக் கொண்டாடுங்கள்.',
  mktFeatAi: 'AI மையம்',
  mktFeatAiBody: 'அறிவிப்புகளை உருவாக்கவும், பாடல்களைப் பரிந்துரைக்கவும்.',
  mktFeatCatholic: 'கத்தோலிக்க மையம்',
  mktFeatCatholicBody: 'இன்றைய நற்செய்தி, தமிழ் ஜெபங்கள், புனிதர்கள், திருவழிபாட்டு ஆண்டு.',
  mktFeatInsights: 'புள்ளிவிவரங்கள்',
  mktFeatInsightsBody: 'குழு நலம், வருகைப் போக்குகள், நிதிச் சுருக்கங்கள்.',
  mktHowEyebrow: 'எப்படி வேலை செய்கிறது',
  mktHowTitle: 'நிமிடங்களில் பாடத் தொடங்குங்கள்.',
  mktStep1: 'பதிவு செய்யுங்கள்',
  mktStep1Body: 'குரல் பகுதி மற்றும் பங்கு — இரண்டு நிமிடங்களில் எந்த போனிலும்.',
  mktStep2: 'ஒப்புதல் பெறுங்கள்',
  mktStep2Body: 'நிர்வாகி மதிப்பாய்வு செய்கிறார் — உடனே அறிவிப்பு கிடைக்கும்.',
  mktStep3: 'பாடுங்கள்',
  mktStep3Body: 'திருப்பலிகள், பயிற்சிகள், வரிகள், வருகை — ஒரே அமைதியான மேசையில்.',
  mktStartReg: 'பதிவைத் தொடங்குங்கள்',
  mktPricingEyebrow: 'விலை',
  mktPricingTitle1: 'இலவசம்.',
  mktPricingTitle2: 'ஒவ்வொரு பங்கிற்கும்.',
  mktPricingBody: 'இது விற்பனைப் பொருள் அல்ல — ஊழியக் கருவி. திருப்பலிகள், பாடல்கள், கணக்குகள், AI, புள்ளிவிவரங்கள் — செலவில்லாமல்.',
  mktPerMonth: 'மாதத்திற்கு, என்றென்றும்',
  mktGetStarted: 'தொடங்குங்கள்',
  mktFaqTitle: 'கேள்விகள். பதில்கள்.',
  mktFaq1q: 'Choir360 எங்கள் பங்கிற்கு இலவசமா?',
  mktFaq1a: 'ஆம். பங்கு பாடகர் குழுக்களுக்கு இலவசம் — சந்தா, இருக்கை வரம்பு இல்லை.',
  mktFaq2q: 'என் தனிப்பட்ட விவரங்களை யார் பார்க்கலாம்?',
  mktFaq2a: 'நீங்களும் உங்கள் பாடகர் நிர்வாகிகளும் மட்டும். தொடர்பு விவரங்கள் தனியாகப் பாதுகாக்கப்படுகின்றன.',
  mktFaq3q: 'மொபைலில் வேலை செய்யுமா?',
  mktFaq3a: 'ஆம் — மொபைல் முதல் வடிவமைப்பு, கீழ் வழிசெலுத்தல், பெரிய தொடு இலக்குகள்.',
  mktFaq4q: 'சிறப்பு திருப்பலி பணத்தை நிர்வகிக்க முடியுமா?',
  mktFaq4a: 'ஆம். தொகையை முன்மொழிந்து, பாடகர்/இசைக்கலைஞர் பங்குகளைப் பிரித்து, பெற்றதைக் கண்காணிக்கலாம்.',
  mktFaq5q: 'தமிழும் ஆங்கிலமும் ஒன்றாகவா?',
  mktFaq5a: 'பாடல் நூலகம், ஜெபங்கள், வாசிப்புகள் இரண்டையும் ஆதரிக்கின்றன — ஒலிப்புத் தேடலுடன்.',
  mktCtaTitle: 'உங்கள் குரலை உயர்த்தத் தயாரா?',
  mktCtaBody: 'Choir360-ல் உங்கள் பங்கு பாடகர் குழுவில் இணையுங்கள் — பதிவு இரண்டு நிமிடங்கள்.',
  mktRegisterMember: 'உறுப்பினராகப் பதிவு செய்யுங்கள்',
  mktSeeCalendar: 'நாட்காட்டியைப் பாருங்கள் ›',
};

const ml: Record<UiKey, string> = {
  ecosystem: 'കത്തോലിക്കാ സംഗീത ആവാസവ്യവസ്ഥ',
  search: 'തിരയുക',
  navOverview: 'അവലോകനം',
  navCalendar: 'കലണ്ടർ',
  navMasses: 'ലിറ്റർജി & കുർബാന',
  navAttendance: 'ഹാജർ',
  navBible: 'ബൈബിൾ',
  navSongs: 'ഗാന ശേഖരം',
  navPeople: 'അംഗങ്ങൾ',
  navMinistry: 'എന്റെ ശുശ്രൂഷ',
  navCatholicHub: 'കത്തോലിക്കാ ഹബ്',
  navPlanner: 'AI മാസ് പ്ലാനർ',
  navAchievements: 'എന്റെ നേട്ടങ്ങൾ',
  navInsights: 'അനലിറ്റിക്സ്',
  navRehearsals: 'പ്രാക്ടീസുകൾ',
  changeParish: 'ഇടവക മാറ്റുക',
  syncSignIn: 'സൈൻ ഇൻ ആവശ്യമാണ്',
  syncLive: 'ലൈവ്',
  syncConnecting: 'കണക്റ്റ് ചെയ്യുന്നു…',
  signIn: 'സൈൻ ഇൻ',
  register: 'രജിസ്റ്റർ',
  signOut: 'സൈൻ ഔട്ട്',
  signInHint: 'ഇമെയിൽ അല്ലെങ്കിൽ മൊബൈൽ · പാസ്‌വേഡ് = ജനനത്തീയതി (DDMMYYYY)',
  emailOrMobile: 'ഇമെയിൽ അല്ലെങ്കിൽ മൊബൈൽ നമ്പർ',
  passwordDob: 'ജനനത്തീയതി DDMMYYYY (ഉദാ. 01012000)',
  signingIn: 'സൈൻ ഇൻ ചെയ്യുന്നു...',
  newToChoir: 'പുതിയ അംഗമാണോ?',
  submitRegistration: 'രജിസ്ട്രേഷൻ സമർപ്പിക്കുക',
  liveSyncActive: 'ലൈവ് സിങ്ക് സജീവം',
  awaitingApproval: 'ഇടവക അഡ്മിൻ അംഗീകാരത്തിനായി കാത്തിരിക്കുന്നു. പൊതു പേജുകൾ കാണാം; അംഗീകാരത്തിന് ശേഷം അംഗ പോർട്ടൽ തുറക്കും.',
  demoMode: 'ലൈവ് സൈൻ ഇൻ ക്രമീകരിച്ചിട്ടില്ല. ലോക്കൽ ഡെമോ മോഡിൽ പ്രവർത്തിക്കുന്നു.',
  mktDesign: 'ഡിസൈൻ',
  mktModules: 'മോഡ്യൂളുകൾ',
  mktHow: 'എങ്ങനെ പ്രവർത്തിക്കുന്നു',
  mktPricing: 'വില',
  mktFaq: 'ചോദ്യങ്ങൾ',
  mktJoin: 'ചേരുക',
  mktHeroTitle1: 'നിങ്ങളുടെ ക്വയർ ശുശ്രൂഷ.',
  mktHeroTitle2: 'മനോഹരമായി ക്രമീകരിച്ചത്.',
  mktHeroDesc: 'കുർബാനകൾ, പ്രാക്ടീസുകൾ, ഗാനങ്ങൾ, ഹാജർ, അക്കൗണ്ടുകൾ — നിങ്ങളുടെ ഇടവക ക്വയർ ഏകോപനത്തിൽ കുറച്ച് സമയവും പാട്ടിൽ കൂടുതൽ സമയവും ചെലവഴിക്കട്ടെ.',
  mktJoinChoir: 'നിങ്ങളുടെ ക്വയറിൽ ചേരുക',
  mktBrowseSongs: 'ഗാനങ്ങൾ കാണുക ›',
  mktTrust: 'ഇടവക തലത്തിലുള്ള ഡാറ്റ സുരക്ഷ',
  mktArchdiocese: 'മദ്രാസ്–മൈലാപ്പൂർ രൂപത',
  mktServing: 'സേവനം ചെയ്യുന്നു',
  mktDesignEyebrow: 'ഡിസൈൻ',
  mktDesignTitle1: 'വാട്‌സ്ആപ്പ് കുഴപ്പത്തിൽ നിന്ന്',
  mktDesignTitle2: 'ഒരു ശാന്തമായ ഡെസ്കിലേക്ക്.',
  mktDesignBody: 'കുർബാന സമയങ്ങൾ, ഗാന ഷീറ്റുകൾ, പണ വിഹിതങ്ങൾ ഗ്രൂപ്പ് ചാറ്റുകളിലും കടലാസിലുമായിരുന്നു. Choir360 മുഴുവൻ ശുശ്രൂഷയും ഒരിടത്ത് കൊണ്ടുവരുന്നു — വ്യക്തവും വേഗത്തിലും ഇടവക ജീവിതത്തിനായി നിർമ്മിച്ചതും.',
  mktBefore1: 'ചാറ്റുകളിൽ മറഞ്ഞ കുർബാന സമയങ്ങൾ',
  mktAfter1: 'എല്ലാ അംഗങ്ങൾക്കും കാണാവുന്ന കലണ്ടർ, അടുത്ത ലിറ്റർജി മുകളിൽ.',
  mktBefore2: 'നഷ്ടപ്പെടുന്ന ഫോട്ടോകോപ്പി ഷീറ്റുകൾ',
  mktAfter2: 'ഏത് ഫോണിലും തിരയാവുന്ന വരികൾ — കുർബാനയിലും.',
  mktBefore3: 'കടലാസിലെ പണ വിഹിതം',
  mktAfter3: 'ഗായകർ/വാദ്യകലാകാരർ വിഹിതം സ്വയം കണക്കാക്കി ട്രാക്ക് ചെയ്യുന്നു.',
  mktStatsEyebrow: 'ശുശ്രൂഷാ തോതിനായി നിർമ്മിച്ചത്',
  mktStatsTitle: 'നിങ്ങൾക്ക് വേണ്ടതെല്ലാം. അനാവശ്യമായത് ഒന്നുമില്ല.',
  mktStatHymns: 'ഗാനങ്ങളും കീർത്തനങ്ങളും',
  mktStatModules: 'ശുശ്രൂഷാ മോഡ്യൂളുകൾ',
  mktStatLanguages: 'ഭാഷകൾ',
  mktModulesEyebrow: 'മോഡ്യൂളുകൾ',
  mktModulesTitle: 'മുഴുവൻ ക്വയറിനും ഒരു പ്ലാറ്റ്ഫോം.',
  mktModulesBody: 'എല്ലാ സൗകര്യങ്ങളും ഉൾപ്പെടുന്നു — എല്ലാ ഇടവകകൾക്കും സൗജന്യം.',
  mktExploreHub: 'കത്തോലിക്കാ ഹബ് പരിശോധിക്കുക ›',
  mktFeatMasses: 'കുർബാന & അക്കൗണ്ടുകൾ',
  mktFeatMassesBody: 'ഓരോ ലിറ്റർജിയും രേഖപ്പെടുത്തുക, വിഹിതം നിർദ്ദേശിക്കുക, വരവ് ട്രാക്ക് ചെയ്യുക.',
  mktFeatSongs: 'ഗാന ശേഖരം',
  mktFeatSongsBody: 'തിരയാവുന്ന തമിഴ് ഗാനങ്ങൾ — ജെബത്തോട്ട ജയഗീതങ്ങൾ ഉൾപ്പെടെ.',
  mktFeatMembers: 'അംഗ മാനേജ്മെന്റ്',
  mktFeatMembersBody: 'സ്വയം രജിസ്ട്രേഷൻ, ശബ്ദ ഭാഗ ലിസ്റ്റുകൾ, സ്വകാര്യ കോൺടാക്റ്റുകൾ സുരക്ഷിതം.',
  mktFeatCalendar: 'ഏകീകൃത കലണ്ടർ',
  mktFeatCalendarBody: 'കുർബാനകൾ, പ്രാക്ടീസുകൾ, ഇടവക ഇവന്റുകൾ — ആരും സമയം നഷ്ടപ്പെടുത്തില്ല.',
  mktFeatAttendance: 'ഹാജർ',
  mktFeatAttendanceBody: 'ഒറ്റ ടാപ്പിൽ ഹാജർ രേഖപ്പെടുത്തുക. സ്ഥിരത ആഘോഷിക്കുക.',
  mktFeatAi: 'AI ഹബ്',
  mktFeatAiBody: 'അറിയിപ്പുകൾ തയ്യാറാക്കുക, ഗാനങ്ങൾ നിർദ്ദേശിക്കുക.',
  mktFeatCatholic: 'കത്തോലിക്കാ ഹബ്',
  mktFeatCatholicBody: 'ദൈനംദിന സുവിശേഷം, തമിഴ് പ്രാർത്ഥനകൾ, വിശുദ്ധർ, ലിറ്റർജിക്കൽ വർഷം.',
  mktFeatInsights: 'അനലിറ്റിക്സ്',
  mktFeatInsightsBody: 'ക്വയർ ആരോഗ്യം, ഹാജർ ട്രെൻഡുകൾ, സാമ്പത്തിക സംഗ്രഹങ്ങൾ.',
  mktHowEyebrow: 'എങ്ങനെ പ്രവർത്തിക്കുന്നു',
  mktHowTitle: 'മിനിറ്റുകൾക്കുള്ളിൽ പാടാൻ തുടങ്ങൂ.',
  mktStep1: 'രജിസ്റ്റർ ചെയ്യുക',
  mktStep1Body: 'ശബ്ദ ഭാഗവും ഇടവകയും — രണ്ട് മിനിറ്റിനുള്ളിൽ ഏത് ഫോണിലും.',
  mktStep2: 'അംഗീകാരം നേടുക',
  mktStep2Body: 'അഡ്മിൻ പരിശോധിക്കുന്നു — ഉടൻ അറിയിപ്പ് ലഭിക്കും.',
  mktStep3: 'പാടുക',
  mktStep3Body: 'കുർബാനകൾ, പ്രാക്ടീസുകൾ, വരികൾ, ഹാജർ — ഒരു ശാന്തമായ ഡെസ്കിൽ നിന്ന്.',
  mktStartReg: 'രജിസ്ട്രേഷൻ ആരംഭിക്കുക',
  mktPricingEyebrow: 'വില',
  mktPricingTitle1: 'സൗജന്യം.',
  mktPricingTitle2: 'എല്ലാ ഇടവകകൾക്കും.',
  mktPricingBody: 'ഇത് ഉൽപ്പന്നമല്ല — ശുശ്രൂഷാ ഉപകരണമാണ്. കുർബാനകൾ, ഗാനങ്ങൾ, അക്കൗണ്ടുകൾ, AI, അനലിറ്റിക്സ് — ചെലവില്ലാതെ.',
  mktPerMonth: 'മാസത്തിൽ, എന്നെന്നേക്കും',
  mktGetStarted: 'ആരംഭിക്കുക',
  mktFaqTitle: 'ചോദ്യങ്ങൾ. ഉത്തരങ്ങൾ.',
  mktFaq1q: 'Choir360 ഞങ്ങളുടെ ഇടവകയ്ക്ക് സൗജന്യമാണോ?',
  mktFaq1a: 'അതെ. ഇടവക ക്വയറുകൾക്ക് സൗജന്യം — സബ്‌സ്ക്രിപ്ഷനോ സീറ്റ് പരിധിയോ ഇല്ല.',
  mktFaq2q: 'എന്റെ വ്യക്തിഗത വിവരങ്ങൾ ആർക്ക് കാണാം?',
  mktFaq2a: 'നിങ്ങളും ക്വയർ അഡ്മിനുകളും മാത്രം. കോൺടാക്റ്റ് വിവരങ്ങൾ പ്രത്യേകം സംരക്ഷിച്ചിരിക്കുന്നു.',
  mktFaq3q: 'മൊബൈലിൽ പ്രവർത്തിക്കുമോ?',
  mktFaq3a: 'അതെ — മൊബൈൽ ഫസ്റ്റ്, ബോട്ടം നാവിഗേഷൻ, വലിയ ടച്ച് ടാർഗെറ്റുകൾ.',
  mktFaq4q: 'പ്രത്യേക കുർബാനയുടെ പണം നിയന്ത്രിക്കാമോ?',
  mktFaq4a: 'അതെ. തുക നിർദ്ദേശിക്കുക, ഗായകർ/വാദ്യകലാകാരർ വിഹിതം വിഭജിക്കുക, ലഭിച്ചത് ട്രാക്ക് ചെയ്യുക.',
  mktFaq5q: 'തമിഴും ഇംഗ്ലീഷും ഒരുമിച്ചോ?',
  mktFaq5a: 'ഗാന ശേഖരം, പ്രാർത്ഥനകൾ, വായനകൾ രണ്ടും പിന്തുണയ്ക്കുന്നു — ഫോണറ്റിക് സെർച്ചോടെ.',
  mktCtaTitle: 'നിങ്ങളുടെ ശബ്ദം ഉയർത്താൻ തയ്യാറാണോ?',
  mktCtaBody: 'Choir360-ൽ നിങ്ങളുടെ ഇടവക ക്വയറിൽ ചേരുക — രജിസ്ട്രേഷൻ രണ്ട് മിനിറ്റ്.',
  mktRegisterMember: 'അംഗമായി രജിസ്റ്റർ ചെയ്യുക',
  mktSeeCalendar: 'കലണ്ടർ കാണുക ›',
};

const te: Record<UiKey, string> = {
  ecosystem: 'కాథలిక్ సంగీత వ్యవస్థ',
  search: 'వెతకండి',
  navOverview: 'అవలోకనం',
  navCalendar: 'క్యాలెండర్',
  navMasses: 'లిటర్జీ & మాస్‌లు',
  navAttendance: 'హాజరు',
  navBible: 'బైబిల్',
  navSongs: 'పాటల లైబ్రరీ',
  navPeople: 'సభ్యులు',
  navMinistry: 'నా సేవ',
  navCatholicHub: 'కాథలిక్ హబ్',
  navPlanner: 'AI మాస్ ప్లానర్',
  navAchievements: 'నా విజయాలు',
  navInsights: 'విశ్లేషణలు',
  navRehearsals: 'రిహార్సల్స్',
  changeParish: 'పారిష్ మార్చండి',
  syncSignIn: 'సైన్ ఇన్ అవసరం',
  syncLive: 'లైవ్',
  syncConnecting: 'కనెక్ట్ అవుతోంది…',
  signIn: 'సైన్ ఇన్',
  register: 'నమోదు',
  signOut: 'సైన్ అవుట్',
  signInHint: 'ఇమెయిల్ లేదా మొబైల్ · పాస్‌వర్డ్ = పుట్టిన తేదీ (DDMMYYYY)',
  emailOrMobile: 'ఇమెయిల్ లేదా మొబైల్ నంబర్',
  passwordDob: 'పుట్టిన తేదీ DDMMYYYY (ఉదా. 01012000)',
  signingIn: 'సైన్ ఇన్ అవుతోంది...',
  newToChoir: 'కొత్త సభ్యులా?',
  submitRegistration: 'నమోదు సమర్పించండి',
  liveSyncActive: 'లైవ్ సింక్ చురుకుగా ఉంది',
  awaitingApproval: 'పారిష్ అడ్మిన్ ఆమోదం కోసం వేచి ఉంది. పబ్లిక్ పేజీలు చూడవచ్చు; ఆమోదం తర్వాత సభ్య పోర్టల్ తెరుచుకుంటుంది.',
  demoMode: 'లైవ్ సైన్ ఇన్ కాన్ఫిగర్ చేయలేదు. లోకల్ డెమో మోడ్‌లో నడుస్తోంది.',
  mktDesign: 'డిజైన్',
  mktModules: 'మాడ్యూల్స్',
  mktHow: 'ఎలా పని చేస్తుంది',
  mktPricing: 'ధర',
  mktFaq: 'ప్రశ్నలు',
  mktJoin: 'చేరండి',
  mktHeroTitle1: 'మీ కోయిర్ సేవ.',
  mktHeroTitle2: 'అందంగా నిర్వహించబడింది.',
  mktHeroDesc: 'మాస్‌లు, రిహార్సల్స్, పాటలు, హాజరు, ఖాతాలు — మీ పారిష్ కోయిర్ సమన్వయంపై తక్కువ సమయం, పాటపై ఎక్కువ సమయం వెచ్చించనివ్వండి.',
  mktJoinChoir: 'మీ కోయిర్‌లో చేరండి',
  mktBrowseSongs: 'పాటలు చూడండి ›',
  mktTrust: 'పారిష్ స్థాయి డేటా రక్షణ',
  mktArchdiocese: 'మద్రాస్–మైలాపూర్ ఆర్చ్‌డయాసిస్',
  mktServing: 'సేవ చేస్తోంది',
  mktDesignEyebrow: 'డిజైన్',
  mktDesignTitle1: 'వాట్సాప్ గందరగోళం నుండి',
  mktDesignTitle2: 'ఒక ప్రశాంత డెస్క్‌కు.',
  mktDesignBody: 'మాస్ సమయాలు, పాట షీట్లు, చెల్లింపు వాటాలు చాట్‌లు, కాగితాల్లో ఉండేవి. Choir360 మొత్తం సేవను ఒకే చోటకు తెస్తుంది — స్పష్టంగా, వేగంగా, పారిష్ జీవితానికి నిర్మించబడింది.',
  mktBefore1: 'చాట్‌ల్లో కూరుకుపోయిన మాస్ సమయాలు',
  mktAfter1: 'ప్రతి సభ్యుడు చూడగల క్యాలెండర్, తదుపరి లిటర్జీ పైన.',
  mktBefore2: 'కనుమరుగయ్యే ఫోటోకాపీ షీట్లు',
  mktAfter2: 'ఏ ఫోన్‌లోనైనా వెతికే సాహిత్యం — మాస్ మధ్యలో కూడా.',
  mktBefore3: 'కాగితంపై చెల్లింపు వాటాలు',
  mktAfter3: 'గాయకులు/వాద్యకారుల వాటాలు స్వయంచాలకంగా లెక్కించి ట్రాక్ చేయబడతాయి.',
  mktStatsEyebrow: 'సేవా స్థాయికి నిర్మించబడింది',
  mktStatsTitle: 'మీకు కావలసింది అంతా. అనవసరమైనది ఏదీ లేదు.',
  mktStatHymns: 'పాటలు & కీర్తనలు',
  mktStatModules: 'సేవా మాడ్యూల్స్',
  mktStatLanguages: 'భాషలు',
  mktModulesEyebrow: 'మాడ్యూల్స్',
  mktModulesTitle: 'మొత్తం కోయిర్‌కు ఒకే ప్లాట్‌ఫారమ్.',
  mktModulesBody: 'అన్ని సౌకర్యాలు ఉన్నాయి — ప్రతి పారిష్‌కు ఉచితం.',
  mktExploreHub: 'కాథలిక్ హబ్ చూడండి ›',
  mktFeatMasses: 'మాస్‌లు & ఖాతాలు',
  mktFeatMassesBody: 'ప్రతి లిటర్జీని నమోదు చేసి, వాటాలు ప్రతిపాదించి, వసూళ్లను ట్రాక్ చేయండి.',
  mktFeatSongs: 'పాటల లైబ్రరీ',
  mktFeatSongsBody: 'వెతికే తమిళ పాటలు — జెబత్తోట్ట జయగీతాలు సహా.',
  mktFeatMembers: 'సభ్య నిర్వహణ',
  mktFeatMembersBody: 'స్వయం నమోదు, వాయిస్ పార్ట్ జాబితాలు, వ్యక్తిగత వివరాలు సురక్షితం.',
  mktFeatCalendar: 'ఏకీకృత క్యాలెండర్',
  mktFeatCalendarBody: 'మాస్‌లు, రిహార్సల్స్, పారిష్ ఈవెంట్లు — ఎవరూ సమయం కోల్పోరు.',
  mktFeatAttendance: 'హాజరు',
  mktFeatAttendanceBody: 'ఒక్క ట్యాప్‌తో హాజరు నమోదు. నిలకడను జరుపుకోండి.',
  mktFeatAi: 'AI హబ్',
  mktFeatAiBody: 'ప్రకటనలు రాయండి, పాటలు సూచించండి.',
  mktFeatCatholic: 'కాథలిక్ హబ్',
  mktFeatCatholicBody: 'రోజువారీ సువార్త, తమిళ ప్రార్థనలు, సంతులు, లిటర్జికల్ సంవత్సరం.',
  mktFeatInsights: 'విశ్లేషణలు',
  mktFeatInsightsBody: 'కోయిర్ ఆరోగ్యం, హాజరు ధోరణులు, ఆర్థిక సారాంశాలు.',
  mktHowEyebrow: 'ఎలా పని చేస్తుంది',
  mktHowTitle: 'నిమిషాల్లో పాడటం ప్రారంభించండి.',
  mktStep1: 'నమోదు చేసుకోండి',
  mktStep1Body: 'వాయిస్ పార్ట్ మరియు పారిష్ — రెండు నిమిషాల్లో ఏ ఫోన్‌లోనైనా.',
  mktStep2: 'ఆమోదం పొందండి',
  mktStep2Body: 'అడ్మిన్ సమీక్షిస్తారు — వెంటనే నోటిఫికేషన్ వస్తుంది.',
  mktStep3: 'పాడండి',
  mktStep3Body: 'మాస్‌లు, రిహార్సల్స్, సాహిత్యం, హాజరు — ఒక ప్రశాంత డెస్క్ నుండి.',
  mktStartReg: 'నమోదు ప్రారంభించండి',
  mktPricingEyebrow: 'ధర',
  mktPricingTitle1: 'ఉచితం.',
  mktPricingTitle2: 'ప్రతి పారిష్‌కు.',
  mktPricingBody: 'ఇది ఉత్పత్తి కాదు — సేవా సాధనం. మాస్‌లు, పాటలు, ఖాతాలు, AI, విశ్లేషణలు — ఖర్చు లేకుండా.',
  mktPerMonth: 'నెలకు, ఎప్పటికీ',
  mktGetStarted: 'ప్రారంభించండి',
  mktFaqTitle: 'ప్రశ్నలు. సమాధానాలు.',
  mktFaq1q: 'Choir360 మా పారిష్‌కు ఉచితమా?',
  mktFaq1a: 'అవును. పారిష్ కోయిర్‌లకు ఉచితం — సబ్‌స్క్రిప్షన్లు లేదా సీట్ పరిమితులు లేవు.',
  mktFaq2q: 'నా వ్యక్తిగత వివరాలు ఎవరు చూడగలరు?',
  mktFaq2a: 'మీరు మరియు మీ కోయిర్ అడ్మిన్‌లు మాత్రమే. కాంటాక్ట్ వివరాలు ప్రత్యేకంగా రక్షించబడతాయి.',
  mktFaq3q: 'మొబైల్‌లో పని చేస్తుందా?',
  mktFaq3a: 'అవును — మొబైల్-ఫస్ట్, బాటమ్ నావిగేషన్, పెద్ద టచ్ టార్గెట్లు.',
  mktFaq4q: 'ప్రత్యేక మాస్ డబ్బును నిర్వహించవచ్చా?',
  mktFaq4a: 'అవును. మొత్తాలు ప్రతిపాదించి, గాయకులు/వాద్యకారుల వాటాలు విభజించి, అందినది ట్రాక్ చేయండి.',
  mktFaq5q: 'తమిళం మరియు ఇంగ్లీష్ కలిసా?',
  mktFaq5a: 'పాటల లైబ్రరీ, ప్రార్థనలు, పఠనాలు రెండింటినీ మద్దతు ఇస్తాయి — ఫొనెటిక్ సెర్చ్‌తో.',
  mktCtaTitle: 'మీ గొంతును ఎత్తడానికి సిద్ధమా?',
  mktCtaBody: 'Choir360లో మీ పారిష్ కోయిర్‌లో చేరండి — నమోదు రెండు నిమిషాలు.',
  mktRegisterMember: 'సభ్యునిగా నమోదు చేసుకోండి',
  mktSeeCalendar: 'క్యాలెండర్ చూడండి ›',
};

const hi: Record<UiKey, string> = {
  ecosystem: 'कैथोलिक संगीत पारिस्थितिकी',
  search: 'खोजें',
  navOverview: 'अवलोकन',
  navCalendar: 'कैलेंडर',
  navMasses: 'लिटुरजी और मिस्सा',
  navAttendance: 'उपस्थिति',
  navBible: 'बाइबिल',
  navSongs: 'संगीत पुस्तकालय',
  navPeople: 'सदस्य',
  navMinistry: 'मेरी सेवा',
  navCatholicHub: 'कैथोलिक हब',
  navPlanner: 'AI मिस्सा योजनाकार',
  navAchievements: 'मेरी उपलब्धियाँ',
  navInsights: 'विश्लेषण',
  navRehearsals: 'रिहर्सल',
  changeParish: 'पारिश बदलें',
  syncSignIn: 'साइन इन आवश्यक',
  syncLive: 'लाइव',
  syncConnecting: 'कनेक्ट हो रहा है…',
  signIn: 'साइन इन',
  register: 'पंजीकरण',
  signOut: 'साइन आउट',
  signInHint: 'ईमेल या मोबाइल · पासवर्ड = जन्म तिथि (DDMMYYYY)',
  emailOrMobile: 'ईमेल या मोबाइल नंबर',
  passwordDob: 'जन्म तिथि DDMMYYYY (उदा. 01012000)',
  signingIn: 'साइन इन हो रहा है...',
  newToChoir: 'नए सदस्य हैं?',
  submitRegistration: 'पंजीकरण जमा करें',
  liveSyncActive: 'लाइव सिंक सक्रिय',
  awaitingApproval: 'पारिश एडमिन की मंजूरी प्रतीक्षित है। सार्वजनिक पृष्ठ देख सकते हैं; मंजूरी के बाद सदस्य पोर्टल खुलेगा।',
  demoMode: 'लाइव साइन इन कॉन्फ़िगर नहीं है। ऐप स्थानीय डेमो मोड में चल रहा है।',
  mktDesign: 'डिज़ाइन',
  mktModules: 'मॉड्यूल',
  mktHow: 'कैसे काम करता है',
  mktPricing: 'मूल्य',
  mktFaq: 'प्रश्न',
  mktJoin: 'जुड़ें',
  mktHeroTitle1: 'आपकी क्वायर सेवा।',
  mktHeroTitle2: 'सुंदरता से व्यवस्थित।',
  mktHeroDesc: 'मिस्सा, रिहर्सल, भजन, उपस्थिति और खाते — ताकि आपकी पारिश क्वायर समन्वय में कम और गाने में अधिक समय बिताए।',
  mktJoinChoir: 'अपनी क्वायर में जुड़ें',
  mktBrowseSongs: 'गीत देखें ›',
  mktTrust: 'पारिश-स्तरीय डेटा सुरक्षा',
  mktArchdiocese: 'मद्रास–मैलापुर आर्चडायोसीस',
  mktServing: 'सेवा कर रहा है',
  mktDesignEyebrow: 'डिज़ाइन',
  mktDesignTitle1: 'व्हाट्सऐप अव्यवस्था से',
  mktDesignTitle2: 'एक शांत डेस्क तक।',
  mktDesignBody: 'मिस्सा समय, गीत पत्रक और भुगतान विभाजन चैट और कागज़ में रहते थे। Choir360 पूरी सेवा को एक स्थान पर लाता है।',
  mktBefore1: 'चैट में दबे मिस्सा समय',
  mktAfter1: 'हर सदस्य के लिए कैलेंडर, अगला लिटुरजी सबसे ऊपर।',
  mktBefore2: 'गायब होते फोटोकॉपी पत्रक',
  mktAfter2: 'किसी भी फ़ोन पर खोजने योग्य बोल — मिस्सा के बीच भी।',
  mktBefore3: 'कागज़ पर भुगतान विभाजन',
  mktAfter3: 'गायक और वादक अंश स्वतः गणना और ट्रैक।',
  mktStatsEyebrow: 'सेवा के पैमाने के लिए बना',
  mktStatsTitle: 'जो चाहिए सब। जो नहीं चाहिए कुछ नहीं।',
  mktStatHymns: 'भजन और गीत',
  mktStatModules: 'सेवा मॉड्यूल',
  mktStatLanguages: 'भाषाएँ',
  mktModulesEyebrow: 'मॉड्यूल',
  mktModulesTitle: 'पूरी क्वायर के लिए एक मंच।',
  mktModulesBody: 'हर सुविधा शामिल — हर पारिश के लिए निःशुल्क।',
  mktExploreHub: 'कैथोलिक हब देखें ›',
  mktFeatMasses: 'मिस्सा और खाते',
  mktFeatMassesBody: 'हर लिटुरजी दर्ज करें, अंश प्रस्तावित करें, वसूली ट्रैक करें।',
  mktFeatSongs: 'गीत पुस्तकालय',
  mktFeatSongsBody: 'खोजने योग्य तमिल भजन — जेबथोट्टा जयगीतंगल सहित।',
  mktFeatMembers: 'सदस्य प्रबंधन',
  mktFeatMembersBody: 'स्व-पंजीकरण, स्वर भाग सूची, निजी संपर्क सुरक्षित।',
  mktFeatCalendar: 'एकीकृत कैलेंडर',
  mktFeatCalendarBody: 'मिस्सा, रिहर्सल, पारिश कार्यक्रम — कोई समय न चूके।',
  mktFeatAttendance: 'उपस्थिति',
  mktFeatAttendanceBody: 'एक टैप में उपस्थिति दर्ज करें। निरंतरता का उत्सव मनाएँ।',
  mktFeatAi: 'AI हब',
  mktFeatAiBody: 'घोषणाएँ लिखें, भजन सुझाएँ।',
  mktFeatCatholic: 'कैथोलिक हब',
  mktFeatCatholicBody: 'दैनिक सुसमाचार, तमिल प्रार्थनाएँ, संत, लिटुरजिकल वर्ष।',
  mktFeatInsights: 'विश्लेषण',
  mktFeatInsightsBody: 'क्वायर स्वास्थ्य, उपस्थिति रुझान, वित्तीय सारांश।',
  mktHowEyebrow: 'कैसे काम करता है',
  mktHowTitle: 'मिनटों में गाना शुरू करें।',
  mktStep1: 'पंजीकरण करें',
  mktStep1Body: 'स्वर भाग और पारिश — दो मिनट में किसी भी फ़ोन पर।',
  mktStep2: 'मंजूरी पाएँ',
  mktStep2Body: 'एडमिन समीक्षा करता है — तुरंत सूचना मिलती है।',
  mktStep3: 'गाएँ',
  mktStep3Body: 'मिस्सा, रिहर्सल, बोल, उपस्थिति — एक शांत डेस्क से।',
  mktStartReg: 'पंजीकरण शुरू करें',
  mktPricingEyebrow: 'मूल्य',
  mktPricingTitle1: 'निःशुल्क।',
  mktPricingTitle2: 'हर पारिश के लिए।',
  mktPricingBody: 'यह उत्पाद नहीं — सेवा उपकरण है। मिस्सा, गीत, खाते, AI, विश्लेषण — बिना लागत।',
  mktPerMonth: 'प्रति माह, हमेशा के लिए',
  mktGetStarted: 'शुरू करें',
  mktFaqTitle: 'प्रश्न। उत्तर।',
  mktFaq1q: 'क्या Choir360 हमारी पारिश के लिए निःशुल्क है?',
  mktFaq1a: 'हाँ। पारिश क्वायर के लिए निःशुल्क — कोई सदस्यता या सीट सीमा नहीं।',
  mktFaq2q: 'मेरे निजी विवरण कौन देख सकता है?',
  mktFaq2a: 'केवल आप और आपके क्वायर एडमिन। संपर्क विवरण अलग से सुरक्षित हैं।',
  mktFaq3q: 'क्या यह मोबाइल पर काम करता है?',
  mktFaq3a: 'हाँ — मोबाइल-प्रथम, नीचे नेविगेशन, बड़े टच लक्ष्य।',
  mktFaq4q: 'क्या विशेष मिस्सा का पैसा प्रबंधित कर सकते हैं?',
  mktFaq4a: 'हाँ। राशि प्रस्तावित करें, गायक/वादक अंश बाँटें, प्राप्त राशि ट्रैक करें।',
  mktFaq5q: 'तमिल और अंग्रेज़ी साथ?',
  mktFaq5a: 'गीत पुस्तकालय, प्रार्थनाएँ और पाठ दोनों का समर्थन करते हैं — ध्वन्यात्मक खोज के साथ।',
  mktCtaTitle: 'अपनी आवाज़ उठाने को तैयार?',
  mktCtaBody: 'Choir360 पर अपनी पारिश क्वायर में जुड़ें — पंजीकरण दो मिनट।',
  mktRegisterMember: 'सदस्य के रूप में पंजीकरण करें',
  mktSeeCalendar: 'कैलेंडर देखें ›',
};

const TABLES: Record<Language, Record<UiKey, string>> = { en, ta, ml, te, hi };

const HTML_LANG: Record<Language, string> = {
  en: 'en',
  ta: 'ta',
  ml: 'ml',
  te: 'te',
  hi: 'hi',
};

export function t(lang: Language, key: UiKey): string {
  return TABLES[lang]?.[key] ?? TABLES.en[key] ?? key;
}

export function applyDocumentLanguage(lang: Language) {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = HTML_LANG[lang] ?? 'en';
}

export const NAV_LABEL_KEYS: Record<string, UiKey> = {
  landing: 'navOverview',
  calendar: 'navCalendar',
  masses: 'navMasses',
  attendance: 'navAttendance',
  bible: 'navBible',
  song_library: 'navSongs',
  registration: 'navPeople',
  dashboard_member: 'navMinistry',
  catholic_hub: 'navCatholicHub',
  liturgical_planner: 'navPlanner',
  gamification: 'navAchievements',
  analytics: 'navInsights',
  rehearsals: 'navRehearsals',
};

const LANG_STORAGE_KEY = 'choir360.uiLang';

export function loadStoredLanguage(): Language {
  try {
    const raw = localStorage.getItem(LANG_STORAGE_KEY);
    if (raw === 'en' || raw === 'ta' || raw === 'ml' || raw === 'te' || raw === 'hi') return raw;
  } catch { /* ignore */ }
  return 'en';
}

export function storeLanguage(lang: Language) {
  try {
    localStorage.setItem(LANG_STORAGE_KEY, lang);
  } catch { /* ignore */ }
}
