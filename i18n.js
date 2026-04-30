(function () {
  'use strict';

  const STORAGE_KEY = 'bu-language';
  const SUPPORTED_LANGUAGES = [
    { code: 'en', label: 'English', nativeLabel: 'English', dir: 'ltr' },
    { code: 'ar', label: 'Arabic', nativeLabel: 'العربية', dir: 'rtl' },
    { code: 'fr', label: 'French', nativeLabel: 'Français', dir: 'ltr' },
    { code: 'sw', label: 'Swahili', nativeLabel: 'Swahili', dir: 'ltr' },
  ];

  const LANGUAGE_META = Object.fromEntries(
    SUPPORTED_LANGUAGES.map((language) => [language.code, language])
  );

  const EXACT_TRANSLATIONS = Object.fromEntries([
    ['Language', { ar: 'اللغة', fr: 'Langue', sw: 'Lugha' }],
    ['Home', { ar: 'الرئيسية', fr: 'Accueil', sw: 'Nyumbani' }],
    ['About', { ar: 'حول البوابة', fr: 'À propos', sw: 'Kuhusu' }],
    ['Activities', { ar: 'الأنشطة', fr: 'Activités', sw: 'Shughuli' }],
    ['Community', { ar: 'المجتمع', fr: 'Communauté', sw: 'Jamii' }],
    ['Events', { ar: 'الفعاليات', fr: 'Événements', sw: 'Matukio' }],
    ['Memberships', { ar: 'العضويات', fr: 'Adhésions', sw: 'Uanachama' }],
    ['Opportunities', { ar: 'الفرص', fr: 'Opportunités', sw: 'Fursa' }],
    ['Sign In', { ar: 'تسجيل الدخول', fr: 'Se connecter', sw: 'Ingia' }],
    ['Sign Up', { ar: 'إنشاء حساب', fr: 'Créer un compte', sw: 'Jisajili' }],
    ['Donate', { ar: 'تبرع', fr: 'Faire un don', sw: 'Toa mchango' }],
    ['Donate Now', { ar: 'تبرع الآن', fr: 'Faire un don maintenant', sw: 'Toa mchango sasa' }],
    ['Learn More', { ar: 'اعرف المزيد', fr: 'En savoir plus', sw: 'Jifunze zaidi' }],
    ['View All', { ar: 'عرض الكل', fr: 'Voir tout', sw: 'Tazama yote' }],
    ['View All Events', { ar: 'عرض كل الفعاليات', fr: 'Voir tous les événements', sw: 'Tazama matukio yote' }],
    ['View All Posts', { ar: 'عرض كل المقالات', fr: 'Voir tous les articles', sw: 'Tazama machapisho yote' }],
    ['View Calendar', { ar: 'عرض التقويم', fr: 'Voir le calendrier', sw: 'Tazama kalenda' }],
    ['Browse Events', { ar: 'تصفح الفعاليات', fr: 'Parcourir les événements', sw: 'Vinjari matukio' }],
    ['Latest News', { ar: 'أحدث الأخبار', fr: 'Dernières actualités', sw: 'Habari za hivi punde' }],
    ['Give Back', { ar: 'رد الجميل', fr: 'Redonner', sw: 'Changia jamii' }],
    ['Join Network', { ar: 'انضم إلى الشبكة', fr: 'Rejoindre le réseau', sw: 'Jiunge na mtandao' }],
    ['Join the Network', { ar: 'انضم إلى الشبكة', fr: 'Rejoindre le réseau', sw: 'Jiunge na mtandao' }],
    ['Join the network →', { ar: 'انضم إلى الشبكة ←', fr: 'Rejoindre le réseau →', sw: 'Jiunge na mtandao →' }],
    ['Explore opportunities →', { ar: 'استكشف الفرص ←', fr: 'Découvrir les opportunités →', sw: 'Chunguza fursa →' }],
    ['Career resources →', { ar: 'موارد المهنة ←', fr: 'Ressources carrière →', sw: 'Rasilimali za kazi →' }],
    ['Open the event form →', { ar: 'افتح نموذج الفعالية ←', fr: 'Ouvrir le formulaire événement →', sw: 'Fungua fomu ya tukio →' }],
    ['Support the mission →', { ar: 'ادعم الرسالة ←', fr: 'Soutenir la mission →', sw: 'Saidia dhamira →' }],
    ['Register →', { ar: 'سجل الآن ←', fr: 'S’inscrire →', sw: 'Jisajili →' }],
    ['Read Article →', { ar: 'اقرأ المقال ←', fr: 'Lire l’article →', sw: 'Soma makala →' }],
    ['Apply Now', { ar: 'قدّم الآن', fr: 'Postuler maintenant', sw: 'Omba sasa' }],
    ['Details', { ar: 'التفاصيل', fr: 'Détails', sw: 'Maelezo' }],
    ['Post Opportunity', { ar: 'انشر فرصة', fr: 'Publier une opportunité', sw: 'Chapisha fursa' }],
    ['Post Another', { ar: 'انشر واحدة أخرى', fr: 'Publier une autre', sw: 'Chapisha nyingine' }],
    ['Clear Form', { ar: 'مسح النموذج', fr: 'Effacer le formulaire', sw: 'Futa fomu' }],
    ['Subscribe', { ar: 'اشترك', fr: 'S’abonner', sw: 'Jiunge' }],
    ['Privacy Policy', { ar: 'سياسة الخصوصية', fr: 'Politique de confidentialité', sw: 'Sera ya faragha' }],
    ['Terms of Use', { ar: 'شروط الاستخدام', fr: 'Conditions d’utilisation', sw: 'Masharti ya matumizi' }],
    ['Get alumni news and events in your inbox.', { ar: 'احصل على أخبار وفعاليات الخريجين في بريدك.', fr: 'Recevez les actualités et événements des alumni par e-mail.', sw: 'Pokea habari na matukio ya wahitimu kwenye barua pepe yako.' }],
    ['You are subscribed!', { ar: 'تم اشتراكك!', fr: 'Vous êtes abonné(e) !', sw: 'Umejiunga!' }],
    ['You\'re subscribed!', { ar: 'تم اشتراكك!', fr: 'Vous êtes abonné(e) !', sw: 'Umejiunga!' }],
    ['Fostering lifelong relationships and opportunities for every BU graduate.', { ar: 'نبني علاقات وفرصًا مستدامة لكل خريج من BU.', fr: 'Nous cultivons des relations et des opportunités durables pour chaque diplômé BU.', sw: 'Tunaimarisha mahusiano ya kudumu na fursa kwa kila mhitimu wa BU.' }],
    ['Career Guide', { ar: 'دليل المسار المهني', fr: 'Guide carrière', sw: 'Mwongozo wa kazi' }],
    ['Welcome Home', { ar: 'مرحبًا بعودتك', fr: 'Bon retour', sw: 'Karibu nyumbani' }],
    ['Connecting Our Past to Your Future.', { ar: 'نربط ماضينا بمستقبلك.', fr: 'Relier notre passé à votre avenir.', sw: 'Tunaunganisha yaliyopita na mustakabali wako.' }],
    ['Explore alumni opportunities, reconnect with classmates, and support the next generation of BU leaders.', { ar: 'استكشف فرص الخريجين، وأعد التواصل مع زملائك، وادعم الجيل القادم من قادة BU.', fr: 'Découvrez les opportunités alumni, renouez avec vos camarades et soutenez la prochaine génération de leaders BU.', sw: 'Chunguza fursa za wahitimu, ungana tena na wanafunzi wenzako, na uunge mkono kizazi kijacho cha viongozi wa BU.' }],
    ['Ready to reconnect?', { ar: 'هل أنت مستعد لإعادة التواصل؟', fr: 'Prêt à vous reconnecter ?', sw: 'Uko tayari kuungana tena?' }],
    ['Join thousands of BU graduates building careers, communities, and legacies together.', { ar: 'انضم إلى آلاف خريجي BU الذين يبنون مسيرات مهنية ومجتمعات وإرثًا معًا.', fr: 'Rejoignez des milliers de diplômés BU qui bâtissent ensemble carrières, communautés et héritages.', sw: 'Jiunge na maelfu ya wahitimu wa BU wanaojenga taaluma, jamii na urithi pamoja.' }],
    ['Register Now', { ar: 'سجل الآن', fr: 'S’inscrire maintenant', sw: 'Jisajili sasa' }],
    ['Browse Opportunities', { ar: 'تصفح الفرص', fr: 'Parcourir les opportunités', sw: 'Vinjari fursa' }],
    ['Alumni Experience', { ar: 'تجربة الخريجين', fr: 'Expérience alumni', sw: 'Uzoefu wa wahitimu' }],
    ['Everything you can do from one portal', { ar: 'كل ما يمكنك القيام به من بوابة واحدة', fr: 'Tout ce que vous pouvez faire depuis un seul portail', sw: 'Kila kitu unachoweza kufanya kutoka kwenye lango moja' }],
    ['Reconnect with classmates, discover career opportunities, show up for events, and give back to the next generation of Bugema University leaders.', { ar: 'أعد التواصل مع زملائك، واكتشف فرص العمل، وشارك في الفعاليات، ورد الجميل للجيل القادم من قادة جامعة بوغيما.', fr: 'Retrouvez vos camarades, découvrez des opportunités de carrière, participez aux événements et soutenez la prochaine génération de leaders de Bugema University.', sw: 'Ungana tena na wanafunzi wenzako, gundua fursa za kazi, shiriki kwenye matukio, na changia kizazi kijacho cha viongozi wa Chuo Kikuu cha Bugema.' }],
    ['Grow Your Network', { ar: 'وسّع شبكتك', fr: 'Développez votre réseau', sw: 'Panua mtandao wako' }],
    ['Career Support', { ar: 'دعم المسار المهني', fr: 'Accompagnement carrière', sw: 'Msaada wa kazi' }],
    ['Attend Signature Events', { ar: 'احضر الفعاليات الرئيسية', fr: 'Participez aux événements phares', sw: 'Hudhuria matukio muhimu' }],
    ['Support scholarships, volunteer in outreach programs, and help current students thrive.', { ar: 'ادعم المنح الدراسية، وتطوع في برامج التوعية، وساعد الطلاب الحاليين على النجاح.', fr: 'Soutenez les bourses, participez aux programmes solidaires et aidez les étudiants actuels à réussir.', sw: 'Saidia ufadhili wa masomo, jitolee katika programu za jamii, na uwasaidie wanafunzi wa sasa kufanikiwa.' }],
    ['Our Community', { ar: 'مجتمعنا', fr: 'Notre communauté', sw: 'Jamii yetu' }],
    ['Welcome to the BU Alumni Portal', { ar: 'مرحبًا بك في بوابة خريجي BU', fr: 'Bienvenue sur le portail des alumni BU', sw: 'Karibu kwenye lango la wahitimu wa BU' }],
    ['Community First', { ar: 'المجتمع أولًا', fr: 'La communauté d’abord', sw: 'Jamii kwanza' }],
    ['This portal is your dedicated space to stay connected with classmates, discover alumni opportunities, and continue building your BU legacy long after graduation.', { ar: 'هذه البوابة هي مساحتك المخصصة للبقاء على اتصال بزملائك، واكتشاف فرص الخريجين، ومواصلة بناء إرثك في BU بعد التخرج بوقت طويل.', fr: 'Ce portail est votre espace dédié pour rester en contact avec vos camarades, découvrir des opportunités alumni et prolonger votre héritage BU bien après l’obtention de votre diplôme.', sw: 'Lango hili ni nafasi yako maalum ya kuendelea kuwasiliana na wanafunzi wenzako, kugundua fursa za wahitimu, na kuendelea kujenga urithi wako wa BU baada ya kuhitimu.' }],
    ['Whether you are looking to mentor students, expand your professional network, or contribute to community causes, you will find resources here to help you engage in meaningful ways.', { ar: 'سواء كنت ترغب في إرشاد الطلاب، أو توسيع شبكتك المهنية، أو الإسهام في قضايا المجتمع، ستجد هنا الموارد التي تساعدك على المشاركة بطرق مؤثرة.', fr: 'Que vous souhaitiez mentorer des étudiants, élargir votre réseau professionnel ou contribuer à des causes communautaires, vous trouverez ici les ressources nécessaires pour agir utilement.', sw: 'Iwe unataka kuwalea wanafunzi, kupanua mtandao wako wa kitaaluma, au kuchangia shughuli za jamii, utapata hapa rasilimali za kukusaidia kushiriki kwa njia yenye maana.' }],
    ['About the Portal', { ar: 'حول البوابة', fr: 'À propos du portail', sw: 'Kuhusu lango' }],
    ['BU Alumni at a Glance', { ar: 'لمحة سريعة عن خريجي BU', fr: 'Les alumni BU en un coup d’œil', sw: 'Muhtasari wa wahitimu wa BU' }],
    ['registered alumni members', { ar: 'عضوًا من الخريجين المسجلين', fr: 'anciens membres inscrits', sw: 'wanachama wa wahitimu waliosajiliwa' }],
    ['jobs posted this year', { ar: 'وظيفة نُشرت هذا العام', fr: 'offres publiées cette année', sw: 'nafasi zilizochapishwa mwaka huu' }],
    ['active alumni chapters', { ar: 'فصلًا نشطًا للخريجين', fr: 'chapitres actifs des alumni', sw: 'matawi hai ya wahitimu' }],
    ['mentorship connections made', { ar: 'صلة إرشاد تم إنشاؤها', fr: 'mises en relation de mentorat', sw: 'miunganisho ya ushauri iliyofanyika' }],
    ['raised for scholarships', { ar: 'جُمعت للمنح الدراسية', fr: 'collectés pour les bourses', sw: 'zilizokusanywa kwa ufadhili wa masomo' }],
    ['partner recruiters', { ar: 'جهة توظيف شريكة', fr: 'recruteurs partenaires', sw: 'waajiri washirika' }],
    ['Become a Member', { ar: 'كن عضوًا', fr: 'Devenir membre', sw: 'Kuwa mwanachama' }],
    ['Upcoming Events', { ar: 'الفعاليات القادمة', fr: 'Événements à venir', sw: 'Matukio yajayo' }],
    ['Don\'t miss what\'s happening in the BU alumni community.', { ar: 'لا تفوّت ما يحدث في مجتمع خريجي BU.', fr: 'Ne manquez pas ce qui se passe dans la communauté des alumni BU.', sw: 'Usikose kinachoendelea katika jamii ya wahitimu wa BU.' }],
    ['Reserve your seat', { ar: 'احجز مقعدك', fr: 'Réservez votre place', sw: 'Hifadhi nafasi yako' }],
    ['Complete the form below so the team can send your ticket and contact you with any final event updates.', { ar: 'أكمل النموذج أدناه حتى يتمكن الفريق من إرسال تذكرتك والتواصل معك بشأن أي تحديثات نهائية للفعالية.', fr: 'Remplissez le formulaire ci-dessous afin que l’équipe puisse vous envoyer votre billet et vous contacter pour toute mise à jour finale.', sw: 'Jaza fomu iliyo hapa chini ili timu iweze kukutumia tiketi yako na kuwasiliana nawe kuhusu mabadiliko yoyote ya mwisho ya tukio.' }],
    ['Selected event', { ar: 'الفعالية المختارة', fr: 'Événement sélectionné', sw: 'Tukio lililochaguliwa' }],
    ['Full Name', { ar: 'الاسم الكامل', fr: 'Nom complet', sw: 'Jina kamili' }],
    ['Email Address', { ar: 'البريد الإلكتروني', fr: 'Adresse e-mail', sw: 'Barua pepe' }],
    ['Phone Number', { ar: 'رقم الهاتف', fr: 'Numéro de téléphone', sw: 'Nambari ya simu' }],
    ['Submit Registration', { ar: 'إرسال التسجيل', fr: 'Soumettre l’inscription', sw: 'Wasilisha usajili' }],
    ['Alumni Leadership', { ar: 'قيادة الخريجين', fr: 'Direction des alumni', sw: 'Uongozi wa wahitimu' }],
    ['Patron', { ar: 'الراعي', fr: 'Patron', sw: 'Mlezi' }],
    ['President', { ar: 'الرئيس', fr: 'Président', sw: 'Rais' }],
    ['General Secretary', { ar: 'الأمين العام', fr: 'Secrétaire général', sw: 'Katibu mkuu' }],
    ['Finance', { ar: 'المالية', fr: 'Finances', sw: 'Fedha' }],
    ['Where donations go', { ar: 'أين تذهب التبرعات', fr: 'Où vont les dons', sw: 'Michango inaenda wapi' }],
    ['Donation Form', { ar: 'نموذج التبرع', fr: 'Formulaire de don', sw: 'Fomu ya mchango' }],
    ['Complete your contribution details', { ar: 'أكمل تفاصيل مساهمتك', fr: 'Renseignez les détails de votre contribution', sw: 'Jaza maelezo ya mchango wako' }],
    ['Provide the required donor details below and choose the payment method you want to use.', { ar: 'أدخل بيانات المتبرع المطلوبة أدناه واختر طريقة الدفع التي تريد استخدامها.', fr: 'Renseignez les informations requises sur le donateur et choisissez le mode de paiement souhaité.', sw: 'Weka taarifa zinazohitajika za mtoaji na uchague njia ya malipo unayotaka kutumia.' }],
    ['Your full name', { ar: 'اسمك الكامل', fr: 'Votre nom complet', sw: 'Jina lako kamili' }],
    ['you@example.com', { ar: 'you@example.com', fr: 'vous@exemple.com', sw: 'wewe@example.com' }],
    ['Donor Type', { ar: 'نوع المتبرع', fr: 'Type de donateur', sw: 'Aina ya mtoaji' }],
    ['Select donor type', { ar: 'اختر نوع المتبرع', fr: 'Sélectionnez le type de donateur', sw: 'Chagua aina ya mtoaji' }],
    ['Alumnus/Alumna', { ar: 'خريج / خريجة', fr: 'Ancien / Ancienne', sw: 'Mhitimu' }],
    ['Parent/Guardian', { ar: 'ولي أمر / وصي', fr: 'Parent / Tuteur', sw: 'Mzazi / Mlezi' }],
    ['Friend of BU', { ar: 'صديق لـ BU', fr: 'Ami de BU', sw: 'Rafiki wa BU' }],
    ['Corporate Partner', { ar: 'شريك مؤسسي', fr: 'Partenaire institutionnel', sw: 'Mshirika wa shirika' }],
    ['Graduation Year', { ar: 'سنة التخرج', fr: 'Année de promotion', sw: 'Mwaka wa kuhitimu' }],
    ['Organization / Employer', { ar: 'المؤسسة / جهة العمل', fr: 'Organisation / Employeur', sw: 'Shirika / Mwajiri' }],
    ['Support Area', { ar: 'مجال الدعم', fr: 'Domaine de soutien', sw: 'Eneo la msaada' }],
    ['Choose where your donation goes', { ar: 'اختر الجهة التي يذهب إليها تبرعك', fr: 'Choisissez où votre don sera affecté', sw: 'Chagua mchango wako uende wapi' }],
    ['Scholarship Fund', { ar: 'صندوق المنح الدراسية', fr: 'Fonds de bourses', sw: 'Mfuko wa ufadhili wa masomo' }],
    ['Alumni Activities and Events', { ar: 'أنشطة وفعاليات الخريجين', fr: 'Activités et événements alumni', sw: 'Shughuli na matukio ya wahitimu' }],
    ['Community Outreach', { ar: 'خدمة المجتمع', fr: 'Action communautaire', sw: 'Huduma kwa jamii' }],
    ['Mentorship and Career Support', { ar: 'الإرشاد والدعم المهني', fr: 'Mentorat et accompagnement carrière', sw: 'Ushauri na msaada wa kazi' }],
    ['General Alumni Fund', { ar: 'الصندوق العام للخريجين', fr: 'Fonds général des alumni', sw: 'Mfuko mkuu wa wahitimu' }],
    ['Donation Amount (UGX)', { ar: 'مبلغ التبرع (UGX)', fr: 'Montant du don (UGX)', sw: 'Kiasi cha mchango (UGX)' }],
    ['Enter amount', { ar: 'أدخل المبلغ', fr: 'Saisir le montant', sw: 'Weka kiasi' }],
    ['Quick Amounts', { ar: 'مبالغ سريعة', fr: 'Montants rapides', sw: 'Kiasi cha haraka' }],
    ['Payment Method', { ar: 'طريقة الدفع', fr: 'Mode de paiement', sw: 'Njia ya malipo' }],
    ['Transaction Reference', { ar: 'مرجع العملية', fr: 'Référence de transaction', sw: 'Kumbukumbu ya muamala' }],
    ['Optional reference or transfer code', { ar: 'مرجع اختياري أو رمز التحويل', fr: 'Référence ou code de transfert facultatif', sw: 'Kumbukumbu au nambari ya uhamisho (si lazima)' }],
    ['Message / Dedication', { ar: 'رسالة / إهداء', fr: 'Message / Dédicace', sw: 'Ujumbe / Wakfu' }],
    ['Optional note', { ar: 'ملاحظة اختيارية', fr: 'Note facultative', sw: 'Dokezo la hiari' }],
    ['Keep this donation anonymous in public acknowledgements.', { ar: 'اجعل هذا التبرع مجهولًا في رسائل الشكر العلنية.', fr: 'Garder ce don anonyme dans les remerciements publics.', sw: 'Fanya mchango huu ubaki bila kutajwa hadharani.' }],
    ['I confirm the donor details and payment method above are correct.', { ar: 'أؤكد أن بيانات المتبرع وطريقة الدفع أعلاه صحيحة.', fr: 'Je confirme que les informations du donateur et le mode de paiement ci-dessus sont corrects.', sw: 'Ninathibitisha kuwa taarifa za mtoaji na njia ya malipo hapo juu ni sahihi.' }],
    ['Submit Donation', { ar: 'إرسال التبرع', fr: 'Soumettre le don', sw: 'Wasilisha mchango' }],
    ['Payment Instructions', { ar: 'تعليمات الدفع', fr: 'Instructions de paiement', sw: 'Maelekezo ya malipo' }],
    ['Donation Checklist', { ar: 'قائمة التبرع', fr: 'Checklist du don', sw: 'Orodha ya mchango' }],
    ['Need Help?', { ar: 'هل تحتاج إلى مساعدة؟', fr: 'Besoin d’aide ?', sw: 'Unahitaji msaada?' }],
    ['Finance and donor support', { ar: 'الدعم المالي ودعم المتبرعين', fr: 'Support finance et donateurs', sw: 'Msaada wa fedha na wachangiaji' }],
    ['For payment confirmation or donor assistance, contact the alumni office directly.', { ar: 'للتأكيد على الدفع أو للحصول على مساعدة للمتبرعين، تواصل مباشرة مع مكتب الخريجين.', fr: 'Pour confirmer un paiement ou obtenir une assistance donateur, contactez directement le bureau des alumni.', sw: 'Kwa uthibitisho wa malipo au msaada wa wachangiaji, wasiliana moja kwa moja na ofisi ya wahitimu.' }],
    ['Join the Alumni Network', { ar: 'انضم إلى شبكة الخريجين', fr: 'Rejoindre le réseau alumni', sw: 'Jiunge na mtandao wa wahitimu' }],
    ['Create Your Account', { ar: 'أنشئ حسابك', fr: 'Créez votre compte', sw: 'Fungua akaunti yako' }],
    ['Fill in your details to get started', { ar: 'أدخل بياناتك للبدء', fr: 'Renseignez vos informations pour commencer', sw: 'Jaza taarifa zako kuanza' }],
    ['Password', { ar: 'كلمة المرور', fr: 'Mot de passe', sw: 'Nenosiri' }],
    ['Confirm Password', { ar: 'تأكيد كلمة المرور', fr: 'Confirmer le mot de passe', sw: 'Thibitisha nenosiri' }],
    ['Program/Faculty *', { ar: 'البرنامج / الكلية *', fr: 'Programme / Faculté *', sw: 'Programu / Kitivo *' }],
    ['Select your program...', { ar: 'اختر برنامجك...', fr: 'Sélectionnez votre programme...', sw: 'Chagua programu yako...' }],
    ['I agree to the Terms and Conditions and Privacy Policy', { ar: 'أوافق على الشروط والأحكام وسياسة الخصوصية', fr: 'J’accepte les conditions générales et la politique de confidentialité', sw: 'Ninakubali masharti na sera ya faragha' }],
    ['Already have an account? Sign in', { ar: 'لديك حساب بالفعل؟ سجل الدخول', fr: 'Vous avez déjà un compte ? Connectez-vous', sw: 'Una akaunti tayari? Ingia' }],
    ['Welcome Back!', { ar: 'مرحبًا بعودتك!', fr: 'Bon retour !', sw: 'Karibu tena!' }],
    ['Remember me', { ar: 'تذكرني', fr: 'Se souvenir de moi', sw: 'Nikumbuke' }],
    ['Forgot password?', { ar: 'هل نسيت كلمة المرور؟', fr: 'Mot de passe oublié ?', sw: 'Umesahau nenosiri?' }],
    ['Don\'t have an account? Create an account', { ar: 'ليس لديك حساب؟ أنشئ حسابًا', fr: 'Vous n’avez pas de compte ? Créez-en un', sw: 'Huna akaunti? Fungua akaunti' }],
    ['Events & News', { ar: 'الفعاليات والأخبار', fr: 'Événements et actualités', sw: 'Matukio na habari' }],
    ['Stay up to date with alumni events, chapter news, and community stories from across the BU network.', { ar: 'ابقَ على اطلاع بفعاليات الخريجين وأخبار الفروع وقصص المجتمع عبر شبكة BU.', fr: 'Restez informé des événements alumni, des actualités des chapitres et des histoires de la communauté BU.', sw: 'Endelea kupata taarifa za matukio ya wahitimu, habari za matawi, na hadithi za jamii kutoka mtandao wa BU.' }],
    ['Featured Event', { ar: 'الفعالية المميزة', fr: 'Événement phare', sw: 'Tukio maalum' }],
    ['Latest Blog Posts', { ar: 'أحدث المقالات', fr: 'Derniers articles', sw: 'Machapisho ya hivi punde' }],
    ['Fundraising Spotlight', { ar: 'أبرز حملة جمع التبرعات', fr: 'Focus collecte de fonds', sw: 'Mwangaza wa uchangishaji' }],
    ['Help us reach 100% and support more students!', { ar: 'ساعدنا على الوصول إلى 100٪ ودعم مزيد من الطلاب!', fr: 'Aidez-nous à atteindre 100 % et à soutenir davantage d’étudiants !', sw: 'Tusaidie kufikia 100% na kusaidia wanafunzi zaidi!' }],
    ['Jobs, Internships & Bursaries', { ar: 'الوظائف والتدريب والمنح', fr: 'Emplois, stages et bourses', sw: 'Kazi, mafunzo na ufadhili' }],
    ['Explore career opportunities posted by alumni and partner organisations. Filter by type and location to find your next step.', { ar: 'استكشف الفرص المهنية التي ينشرها الخريجون والشركاء. صفِّ بحسب النوع والموقع للعثور على خطوتك التالية.', fr: 'Découvrez les opportunités de carrière publiées par les alumni et les organisations partenaires. Filtrez par type et lieu pour trouver votre prochaine étape.', sw: 'Chunguza fursa za kazi zilizochapishwa na wahitimu na mashirika washirika. Chuja kwa aina na eneo ili kupata hatua yako inayofuata.' }],
    ['Type', { ar: 'النوع', fr: 'Type', sw: 'Aina' }],
    ['Location', { ar: 'الموقع', fr: 'Lieu', sw: 'Eneo' }],
    ['Search', { ar: 'بحث', fr: 'Rechercher', sw: 'Tafuta' }],
    ['Looking for a Mentor?', { ar: 'هل تبحث عن مرشد؟', fr: 'Vous cherchez un mentor ?', sw: 'Unatafuta mshauri?' }],
    ['Upgrade to VVP', { ar: 'الترقية إلى VVP', fr: 'Passer à VVP', sw: 'Panda hadi VVP' }],
    ['Job Givers Portal', { ar: 'بوابة أصحاب الفرص', fr: 'Portail recruteurs', sw: 'Lango la waajiri' }],
    ['Members Only', { ar: 'للأعضاء فقط', fr: 'Réservé aux membres', sw: 'Kwa wanachama pekee' }],
    ['You need to be a registered BU Alumni member to post an opportunity. Sign up or sign in to continue.', { ar: 'يجب أن تكون عضوًا مسجلاً في خريجي BU لنشر فرصة. أنشئ حسابًا أو سجل الدخول للمتابعة.', fr: 'Vous devez être membre alumni BU enregistré pour publier une opportunité. Inscrivez-vous ou connectez-vous pour continuer.', sw: 'Ni lazima uwe mwanachama aliyesajiliwa wa wahitimu wa BU ili kuchapisha fursa. Jisajili au ingia ili kuendelea.' }],
    ['Contact / Apply Email *', { ar: 'بريد التواصل / التقديم *', fr: 'E-mail de contact / candidature *', sw: 'Barua pepe ya mawasiliano / maombi *' }],
    ['Privacy & Terms', { ar: 'الخصوصية والشروط', fr: 'Confidentialité et conditions', sw: 'Faragha na masharti' }],
    ['Our commitment to your privacy and the terms governing use of the BU Alumni Portal. Your data, your rights.', { ar: 'التزامنا بخصوصيتك والشروط التي تحكم استخدام بوابة خريجي BU. بياناتك وحقوقك.', fr: 'Notre engagement envers votre vie privée et les conditions d’utilisation du portail BU Alumni. Vos données, vos droits.', sw: 'Ahadi yetu kwa faragha yako na masharti yanayosimamia matumizi ya lango la BU Alumni. Data yako, haki zako.' }],
    ['Last updated: April 2026', { ar: 'آخر تحديث: أبريل 2026', fr: 'Dernière mise à jour : avril 2026', sw: 'Ilisasishwa mara ya mwisho: Aprili 2026' }],
    ['Information We Collect', { ar: 'المعلومات التي نجمعها', fr: 'Informations collectées', sw: 'Taarifa tunazokusanya' }],
    ['How We Use Your Information', { ar: 'كيف نستخدم معلوماتك', fr: 'Utilisation de vos informations', sw: 'Jinsi tunavyotumia taarifa zako' }],
    ['Data Sharing', { ar: 'مشاركة البيانات', fr: 'Partage des données', sw: 'Ushirikishaji wa data' }],
    ['Your Rights', { ar: 'حقوقك', fr: 'Vos droits', sw: 'Haki zako' }],
    ['Cookies', { ar: 'ملفات تعريف الارتباط', fr: 'Cookies', sw: 'Vidakuzi' }],
    ['Eligibility', { ar: 'الأهلية', fr: 'Admissibilité', sw: 'Ustahiki' }],
    ['Acceptable Use', { ar: 'الاستخدام المقبول', fr: 'Utilisation acceptable', sw: 'Matumizi yanayokubalika' }],
    ['Intellectual Property', { ar: 'الملكية الفكرية', fr: 'Propriété intellectuelle', sw: 'Mali miliki' }],
    ['Memberships & Payments', { ar: 'العضويات والمدفوعات', fr: 'Adhésions et paiements', sw: 'Uanachama na malipo' }],
    ['Limitation of Liability', { ar: 'تحديد المسؤولية', fr: 'Limitation de responsabilité', sw: 'Ukomo wa dhima' }],
    ['Changes to These Terms', { ar: 'التغييرات على هذه الشروط', fr: 'Modifications de ces conditions', sw: 'Mabadiliko ya masharti haya' }],
    ['Contact', { ar: 'اتصل بنا', fr: 'Contact', sw: 'Wasiliana nasi' }],
    ['Open menu', { ar: 'افتح القائمة', fr: 'Ouvrir le menu', sw: 'Fungua menyu' }],
    ['Mobile navigation', { ar: 'التنقل عبر الهاتف', fr: 'Navigation mobile', sw: 'Urambazaji wa simu' }],
    ['Go to homepage', { ar: 'الانتقال إلى الصفحة الرئيسية', fr: 'Aller à l’accueil', sw: 'Nenda ukurasa wa kwanza' }],
    ['Change language', { ar: 'تغيير اللغة', fr: 'Changer de langue', sw: 'Badili lugha' }],
    ['Select language', { ar: 'اختر اللغة', fr: 'Sélectionner la langue', sw: 'Chagua lugha' }],
    ['BU Alumni Portal | Home', { ar: 'بوابة خريجي BU | الرئيسية', fr: 'Portail Alumni BU | Accueil', sw: 'Lango la Wahitimu wa BU | Nyumbani' }],
    ['BU Alumni Portal | About', { ar: 'بوابة خريجي BU | حول البوابة', fr: 'Portail Alumni BU | À propos', sw: 'Lango la Wahitimu wa BU | Kuhusu' }],
    ['BU Alumni Portal | Donate', { ar: 'بوابة خريجي BU | التبرع', fr: 'Portail Alumni BU | Faire un don', sw: 'Lango la Wahitimu wa BU | Toa mchango' }],
    ['BU Alumni Portal | Events', { ar: 'بوابة خريجي BU | الفعاليات', fr: 'Portail Alumni BU | Événements', sw: 'Lango la Wahitimu wa BU | Matukio' }],
    ['BU Alumni Portal | Memberships', { ar: 'بوابة خريجي BU | العضويات', fr: 'Portail Alumni BU | Adhésions', sw: 'Lango la Wahitimu wa BU | Uanachama' }],
    ['BU Alumni Portal | Opportunities', { ar: 'بوابة خريجي BU | الفرص', fr: 'Portail Alumni BU | Opportunités', sw: 'Lango la Wahitimu wa BU | Fursa' }],
    ['BU Alumni Portal | Legal', { ar: 'بوابة خريجي BU | الشؤون القانونية', fr: 'Portail Alumni BU | Mentions légales', sw: 'Lango la Wahitimu wa BU | Sheria' }],
  ]);

  const PATTERN_TRANSLATIONS = [
    {
      pattern: /^Thanks\. (.+) will now receive BU alumni updates\.$/,
      render: {
        ar: (match) => `شكرًا. سيتلقى ${match[1]} الآن تحديثات خريجي BU.`,
        fr: (match) => `Merci. ${match[1]} recevra désormais les actualités des alumni BU.`,
        sw: (match) => `Asante. ${match[1]} sasa atapokea taarifa za wahitimu wa BU.`,
      },
    },
    {
      pattern: /^Registration received for (.+)\. Ticket reference (.+) has been prepared for (.+)\. We will use (.+) and (.+) for ticket delivery and attendee follow-up\.$/,
      render: {
        ar: (match) => `تم استلام التسجيل لفعالية ${match[1]}. تم تجهيز مرجع التذكرة ${match[2]} باسم ${match[3]}. سنستخدم ${match[4]} و${match[5]} لإرسال التذكرة والمتابعة مع الحضور.`,
        fr: (match) => `Inscription reçue pour ${match[1]}. La référence billet ${match[2]} a été préparée pour ${match[3]}. Nous utiliserons ${match[4]} et ${match[5]} pour l’envoi du billet et le suivi.`,
        sw: (match) => `Usajili umepokelewa kwa ${match[1]}. Rejea ya tiketi ${match[2]} imeandaliwa kwa ajili ya ${match[3]}. Tutatumia ${match[4]} na ${match[5]} kutuma tiketi na kufanya ufuatiliaji.`,
      },
    },
    {
      pattern: /^Welcome,\s*(.+)\s*!$/,
      render: {
        ar: (match) => `مرحبًا، ${match[1]}!`,
        fr: (match) => `Bienvenue, ${match[1]} !`,
        sw: (match) => `Karibu, ${match[1]}!`,
      },
    },
    {
      pattern: /^Your Account ID:\s*(.+)$/,
      render: {
        ar: (match) => `معرّف حسابك: ${match[1]}`,
        fr: (match) => `Votre identifiant de compte : ${match[1]}`,
        sw: (match) => `Kitambulisho cha akaunti yako: ${match[1]}`,
      },
    },
    {
      pattern: /^Redirecting to homepage\.\.\.$/,
      render: {
        ar: () => 'جارٍ التحويل إلى الصفحة الرئيسية...',
        fr: () => 'Redirection vers la page d’accueil...',
        sw: () => 'Inaelekeza kwenye ukurasa wa kwanza...',
      },
    },
    {
      pattern: /^Payment prompt sent to (.+)\.$/,
      render: {
        ar: (match) => `تم إرسال طلب الدفع إلى ${match[1]}.`,
        fr: (match) => `La demande de paiement a été envoyée à ${match[1]}.`,
        sw: (match) => `Ombi la malipo limetumwa kwa ${match[1]}.`,
      },
    },
  ];

  const originalTextNodes = new WeakMap();
  const originalAttributes = new WeakMap();
  const ATTRIBUTE_NAMES = ['placeholder', 'title', 'aria-label', 'alt', 'value'];
  const observerConfig = {
    childList: true,
    characterData: true,
    subtree: true,
    attributes: true,
    attributeFilter: ATTRIBUTE_NAMES,
  };

  function getCurrentLanguage() {
    const stored = localStorage.getItem(STORAGE_KEY) || 'en';
    return LANGUAGE_META[stored] ? stored : 'en';
  }

  function getDirection(language) {
    return LANGUAGE_META[language]?.dir || 'ltr';
  }

  function setDocumentLanguage(language) {
    document.documentElement.setAttribute('lang', language);
    document.documentElement.setAttribute('dir', getDirection(language));
  }

  function getSupportedLanguages() {
    return SUPPORTED_LANGUAGES.slice();
  }

  function normalizeText(value) {
    return String(value || '')
      .replace(/\u00a0/g, ' ')
      .replace(/Â·/g, '·')
      .replace(/â€™/g, '’')
      .replace(/â€œ/g, '“')
      .replace(/â€�/g, '”')
      .replace(/â€“/g, '–')
      .replace(/â€”/g, '—')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function translateExact(text, language) {
    const normalized = normalizeText(text);
    const entry = EXACT_TRANSLATIONS[normalized];
    if (!entry) return null;
    return entry[language] || normalized;
  }

  function translatePattern(text, language) {
    const normalized = normalizeText(text);
    for (const item of PATTERN_TRANSLATIONS) {
      const match = normalized.match(item.pattern);
      if (!match) continue;
      const renderer = item.render[language];
      if (!renderer) return normalized;
      return renderer(match);
    }
    return null;
  }

  function translateText(text, language) {
    if (language === 'en') return text;
    const exact = translateExact(text, language);
    if (exact) return exact;
    const pattern = translatePattern(text, language);
    if (pattern) return pattern;
    return text;
  }

  function preserveWhitespace(source, replacement) {
    const match = String(source).match(/^(\s*)([\s\S]*?)(\s*)$/);
    if (!match) return replacement;
    return `${match[1]}${replacement}${match[3]}`;
  }

  function shouldSkipNode(node) {
    const parent = node.parentElement;
    if (!parent) return true;
    if (parent.closest('script, style, noscript, template')) return true;
    if (parent.closest('.material-icons-round, .material-icons, .mi-check')) return true;
    if (parent.closest('[data-i18n-skip]')) return true;
    return false;
  }

  function rememberTextNode(node) {
    if (node.nodeType !== Node.TEXT_NODE || shouldSkipNode(node)) return;
    if (!originalTextNodes.has(node)) {
      originalTextNodes.set(node, node.nodeValue);
    }
  }

  function rememberAttribute(element, attributeName) {
    if (!element || !element.hasAttribute(attributeName)) return;
    if (!originalAttributes.has(element)) {
      originalAttributes.set(element, {});
    }
    const store = originalAttributes.get(element);
    if (!(attributeName in store)) {
      store[attributeName] = element.getAttribute(attributeName);
    }
  }

  function rememberElementAttributes(element) {
    ATTRIBUTE_NAMES.forEach((attributeName) => rememberAttribute(element, attributeName));
  }

  function translateTextNode(node, language) {
    rememberTextNode(node);
    const original = originalTextNodes.get(node);
    if (typeof original !== 'string') return;
    const translated = translateText(original, language);
    node.nodeValue = preserveWhitespace(original, translated);
  }

  function translateElementAttributes(element, language) {
    rememberElementAttributes(element);
    const store = originalAttributes.get(element);
    if (!store) return;

    Object.entries(store).forEach(([attributeName, originalValue]) => {
      const translated = translateText(originalValue, language);
      element.setAttribute(attributeName, translated);
      if (attributeName === 'value' && 'value' in element) {
        element.value = translated;
      }
    });
  }

  function translateTree(root, language) {
    if (!root) return;

    if (root.nodeType === Node.TEXT_NODE) {
      translateTextNode(root, language);
      return;
    }

    if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_NODE) {
      return;
    }

    if (root.nodeType === Node.ELEMENT_NODE) {
      translateElementAttributes(root, language);
    }

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    const textNodes = [];
    while (walker.nextNode()) {
      textNodes.push(walker.currentNode);
    }
    textNodes.forEach((node) => translateTextNode(node, language));

    if (root.querySelectorAll) {
      root.querySelectorAll('*').forEach((element) => translateElementAttributes(element, language));
    }
  }

  function translatePage() {
    const language = getCurrentLanguage();
    translateTree(document.body, language);
    document.title = translateText(document.title, language);
  }

  function setLanguage(language) {
    const nextLanguage = LANGUAGE_META[language] ? language : 'en';
    localStorage.setItem(STORAGE_KEY, nextLanguage);
    setDocumentLanguage(nextLanguage);
    translatePage();
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: nextLanguage } }));
  }

  function registerTree(root) {
    translateTree(root, getCurrentLanguage());
  }

  function installMutationObserver() {
    const observer = new MutationObserver((mutations) => {
      const language = getCurrentLanguage();
      mutations.forEach((mutation) => {
        if (mutation.type === 'characterData') {
          rememberTextNode(mutation.target);
          translateTextNode(mutation.target, language);
          return;
        }

        if (mutation.type === 'attributes' && mutation.target.nodeType === Node.ELEMENT_NODE) {
          rememberAttribute(mutation.target, mutation.attributeName);
          translateElementAttributes(mutation.target, language);
          return;
        }

        mutation.addedNodes.forEach((node) => registerTree(node));
      });
    });

    observer.observe(document.body, observerConfig);
  }

  function installDialogTranslation() {
    const nativeAlert = window.alert ? window.alert.bind(window) : null;
    const nativeConfirm = window.confirm ? window.confirm.bind(window) : null;

    if (nativeAlert) {
      window.alert = function translatedAlert(message) {
        nativeAlert(translateText(String(message), getCurrentLanguage()));
      };
    }

    if (nativeConfirm) {
      window.confirm = function translatedConfirm(message) {
        return nativeConfirm(translateText(String(message), getCurrentLanguage()));
      };
    }
  }

  function init() {
    setDocumentLanguage(getCurrentLanguage());
    translatePage();
    installMutationObserver();
    installDialogTranslation();

    window.addEventListener('storage', (event) => {
      if (event.key === STORAGE_KEY) {
        setDocumentLanguage(getCurrentLanguage());
        translatePage();
      }
    });
  }

  window.BUi18n = {
    getCurrentLanguage,
    getSupportedLanguages,
    getDirection,
    setLanguage,
    translateText,
    translatePage,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
