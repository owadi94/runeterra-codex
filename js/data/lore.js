// Our own lore data: written in our own words, checked against Riot's Universe site (see LORE-NOTES.md).

export const REGIONS=[
 {id:"freljord",name:"Freljord",hue:"#8fc7e8",key:"Ashe",tag:"Frozen north of Valoran",text:"A harsh land where everyone is raised a warrior. Ashe's Avarosans hope to unite the tribes, Sejuani's Winter's Claw raid the borders of Demacia and Noxus, and Lissandra's Frostguard keep old secrets buried.",champs:["Ashe","Sejuani","Braum","Lissandra"],fact:"The sisters Avarosa, Serylda and Lissandra once ruled together. Their war ended at Lissandra's citadel, where she sealed her enemies in True Ice."},
 {id:"demacia",name:"Demacia",hue:"#e9d9a6",key:"Garen",tag:"Kingdom in western Valoran",text:"A lawful kingdom that prizes justice, honor and duty. It was founded by refugees from the Rune Wars as a haven from sorcery, and its walls are built of petricite, a white stone that dulls magic.",champs:["Garen","Lux","Jarvan IV","Sylas"],fact:"Demacia crowned its first king in 292 AN. Some now whisper that its golden age has passed."},
 {id:"noxus",name:"Noxus",hue:"#d2564a",key:"Darius",tag:"Empire in eastern Valoran",text:"A brutal, expanding empire that is also surprisingly open: anyone can rise if they are strong enough, whatever their birth. Mages are prized, not feared. The old noble houses still hold real power.",champs:["Darius","Swain","Katarina","LeBlanc"],fact:"In 989 AN Jericho Swain overthrew Boram Darkwill, ended the war in Ionia and created the Trifarix council."},
 {id:"bandle",name:"Bandle City",hue:"#b9d46e",key:"Tristana",tag:"Home of the yordles",text:"No one agrees where it is. Travelers who find the hidden paths describe brighter colors, golden light and food they never forget. No two tellers describe it the same way.",champs:["Teemo","Tristana","Lulu","Veigar"],fact:"Time runs strangely there. Mortals who come back often look much older, and many never return."},
 {id:"piltover",name:"Piltover",hue:"#e2a94e",key:"Caitlyn",tag:"The City of Progress",text:"A rich city of inventors and merchant clans that controls the trade route between Valoran and Shurima through its Sun Gates. Hextech, magic fused with machinery, was born here.",champs:["Caitlyn","Jayce","Vi","Heimerdinger"],fact:"Piltover sits on the cliffs directly above its sister city, Zaun."},
 {id:"zaun",name:"Zaun",hue:"#5fcf9a",key:"Ekko",tag:"The undercity beneath Piltover",text:"A crowded city under a haze of chemical smog. Its people build with chemtech, a cheaper and more dangerous rival to hextech, and chem-barons run the streets.",champs:["Jinx","Viktor","Ekko","Warwick"],fact:"In 772 AN, digging for the Sun Gates collapsed parts of old Zaun into the caverns below."},
 {id:"targon",name:"Targon",hue:"#9eabff",key:"Leona",tag:"The great mountain in the far west",text:"The tallest peak in Runeterra, home to the Rakkor tribes. Pilgrims are drawn to climb it without knowing why. The few who reach the top may become hosts to Aspects, celestial beings of great power.",champs:["Leona","Diana","Pantheon","Taric"],fact:"Many of Runeterra's creation legends begin on Targon."},
 {id:"shurima",name:"Shurima",hue:"#e8b64f",key:"Azir",tag:"The desert empire in the south",text:"Once the greatest empire in the world. Guided by the Aspects, its people used the Sun Disc to create the first Ascended, god-warriors who ruled for thousands of years.",champs:["Azir","Nasus","Renekton","Sivir"],fact:"Around 2000 BN, Azir's Ascension was ruined by treachery and the empire lost both its emperor and the Sun Disc."},
 {id:"ixtal",name:"Ixtal",hue:"#53b27e",key:"Qiyana",tag:"Hidden jungle nation",text:"Masters of elemental magic and one of the first nations to join the Shuriman empire. They survived the Void and the Darkin by pulling the jungle around them like a shield, and they have stayed hidden ever since.",champs:["Qiyana","Malphite","Nidalee","Zyra"],fact:"From their city of Ixaocan, the Ixtali see every other nation as upstarts and pretenders."},
 {id:"void",name:"The Void",hue:"#a874e0",key:"Kai'Sa",tag:"The nothingness beyond reality",text:"A hunger as old as the universe, waiting for its masters, the Watchers, to bring the final undoing. Mortals who touch it glimpse something that can break any mind.",champs:["Kai'Sa","Cho'Gath","Kha'Zix","Vel'Koz"],fact:"Around 2500 BN, Icathia unleashed the Void in a revolt against Shurima, and its own capital was destroyed at once."},
 {id:"ionia",name:"Ionia",hue:"#e891b2",key:"Irelia",tag:"The First Lands",text:"A land of balance where the spirit realm is close, especially in the wild forests. Noxus invaded and was driven out only after years of war. Now Ionia is split over what comes next.",champs:["Irelia","Yasuo","Ahri","Karma"],fact:"The Kinkou and Shojin monks want peace and tradition. The Navori Brotherhood and Order of Shadow want to arm Ionia for revenge."},
 {id:"bilge",name:"Bilgewater",hue:"#4fb6bb",key:"Miss Fortune",tag:"Port city of the Serpent Isles",text:"A lawless harbor of pirates, smugglers and sea-monster hunters. It grew from a refuge the island's Buhru people gave to shipwrecked fortune seekers around 787 AN.",champs:["Miss Fortune","Gangplank","Twisted Fate","Graves"],fact:"Miss Fortune blew up Gangplank's ship to avenge her parents, whom he killed when she was a child."},
 {id:"shadow",name:"Shadow Isles",hue:"#6fd6bf",key:"Thresh",tag:"Once called the Blessed Isles",text:"A noble land of learning until a magical accident beneath the city of Helia tore the border between the living and spirit realms. The Black Mist now covers the isles, and it reaches farther each year.",champs:["Thresh","Kalista","Viego","Hecarim"],fact:"The Ruination began with grief. When his queen was poisoned, King Viego searched for a way to bring her back, and the magic he unleashed destroyed the isles."}
];

/* Each region's slug on Riot's Universe site */
export const U_SLUG={freljord:"freljord",demacia:"demacia",noxus:"noxus",bandle:"bandle-city",piltover:"piltover",zaun:"zaun",targon:"mount-targon",shurima:"shurima",ixtal:"ixtal",void:"void",ionia:"ionia",bilge:"bilgewater",shadow:"shadow-isles"};
REGIONS.forEach(r => { r.u = U_SLUG[r.id]; });

export const WANDERERS={id:"wanderers",u:"unaffiliated",name:"Wanderers",hue:"#c8aa6e",key:"AurelionSol",tag:"Bound to no nation",text:"Some champions answer to no crown or empire. They are travelers, exiles, lone hunters and beings far older than any border, and their stories cross the whole world.",champs:["Ryze"],fact:"Cosmic beings such as Aurelion Sol and Bard are counted here, because no single nation can claim them."};
export const GROUPS = [...REGIONS, WANDERERS];

export const QUIZ=[
 {q:"What disaster turned the Blessed Isles into the Shadow Isles?",a:"The Ruination",o:["The Darkin War","The Ruination","The Void Rising","The Rune Wars"],e:"A magical accident in the vaults beneath Helia tore the border between the realms and released the Black Mist."},
 {q:"Which city lies directly beneath Piltover?",a:"Zaun",o:["Bilgewater","Zaun","Noxus Prime","Ixaocan"],e:"Zaun is Piltover's undercity, built in the canyon below the cliffs."},
 {q:"What stone does Demacia use to block magic?",a:"Petricite",o:["Petricite","True Ice","Hextech crystal","Moonstone"],e:"Demacia was founded as a refuge from sorcery, and petricite is what makes that possible."},
 {q:"Who betrayed Emperor Azir during his Ascension?",a:"Xerath",o:["Renekton","Nasus","Xerath","Sivir"],e:"Xerath, a slave turned magus, struck during the ritual and caused Shurima's fall."},
 {q:"Which council rules Noxus after Swain took power?",a:"The Trifarix",o:["The Black Rose","The Trifarix","The Council of Nine","The Solari"],e:"Swain created the Trifarix to govern the empire. The Black Rose is a rival secret society."},
 {q:"Who ruled Noxus before Swain's coup?",a:"Boram Darkwill",o:["Boram Darkwill","Mordekaiser","Jericho Swain","Marcus Du Couteau"],e:"Swain overthrew Grand General Darkwill in 989 AN, then pulled Noxus out of Ionia within a year."},
 {q:"Which of the three Freljord sisters is still alive?",a:"Lissandra",o:["Avarosa","Serylda","Lissandra","Sejuani"],e:"Lissandra, the Ice Witch, outlived her sisters and leads the Frostguard."},
 {q:"Which fallen empire opened the way for the Void?",a:"Icathia",o:["Icathia","Camavor","Helia","Ixtal"],e:"Icathia unleashed the Void to break free of Shurima, and its own capital was destroyed instantly."},
 {q:"Who are said to be the masters of the Void?",a:"The Watchers",o:["The Darkin","The Watchers","The Aspects","The Iceborn"],e:"The Void waits for the Watchers to mark the final undoing."},
 {q:"What do Aspects need to act in the mortal world?",a:"A mortal host",o:["A Darkin weapon","A mortal host","A Sun Disc","A Watcher's blessing"],e:"Aspects descend into those who survive the climb up Mount Targon."},
 {q:"Which tribes call Mount Targon home?",a:"The Rakkor",o:["The Rakkor","The Buhru","The Avarosans","The Noxii"],e:"The Rakkor are hardy mountain people. The Buhru live in the Serpent Isles."},
 {q:"Who sank Gangplank's ship in Bilgewater's harbor?",a:"Miss Fortune",o:["Graves","Twisted Fate","Miss Fortune","Illaoi"],e:"Sarah Fortune planned the blast for years to avenge her parents."},
 {q:"What are the Darkin?",a:"Ascended imprisoned in weapons",o:["Void creatures","Fallen Aspects","Ascended imprisoned in weapons","Spirits of Ionia"],e:"Scarred by their war with the Void, many Ascended turned to conquest. The Aspects sealed them inside their own weapons."},
 {q:"Before he was Mordekaiser, he was a warlord named...",a:"Sahn-Uzal",o:["Sahn-Uzal","Tyrus","Orlon","Darkwill"],e:"Brought back by the mages he fooled, Sahn-Uzal ruled from his Immortal Bastion for almost three centuries."},
 {q:"Which mage saw the first attack of the Rune Wars with his master Tyrus?",a:"Ryze",o:["Ryze","Xerath","Veigar","Kassadin"],e:"Ryze was outside Khom when the war began, and the sight haunted his very long life."},
 {q:"What does the Noxian calendar count from?",a:"Surviving the Rune Wars",o:["The founding of Demacia","Surviving the Rune Wars","Swain's coup","The fall of Shurima"],e:"Year 0 marks the day the Noxii came out of the Immortal Bastion and became one people."},
 {q:"Which Ionian group wants to arm the land for revenge on Noxus?",a:"The Navori Brotherhood",o:["The Kinkou","The Shojin monks","The Navori Brotherhood","The Solari"],e:"The Kinkou and Shojin monks want peace. The Navori Brotherhood and the Order of Shadow want a militarized Ionia."},
 {q:"Where do the yordles come from?",a:"Bandle City",o:["Bandle City","Ixtal","Targon","Ionia"],e:"Bandle City lies deep in the spirit realm."},
 {q:"Which hero rallied Ionians against Noxus at the Placidium?",a:"Irelia",o:["Karma","Yasuo","Irelia","Shen"],e:"After the Battle of the Placidium, Ionian resistance became far more organized."}
];

export const CLUES=[
 {a:"Garen",c:["I fight in my homeland's elite military order.","My family name is Crownguard.","My little sister hides a gift my kingdom forbids.","I spin into battle shouting for Demacia."]},
 {a:"Thresh",c:["I collect what others leave behind.","I once guarded secret vaults of dangerous relics beneath Helia.","The Black Mist is my home.","My lantern holds the souls I have taken."]},
 {a:"Azir",c:["I returned after thousands of years.","I was betrayed by someone I trusted.","Soldiers of sand answer my call.","The Sun Disc rose again with me."]},
 {a:"Ashe",c:["I want to unite my people, not conquer them.","I married the last great warrior of a fallen clan to unite our peoples.","Many tribes now swear their loyalty to me.","My arrows are made of True Ice."]},
 {a:"Miss Fortune",c:["I waited years for my revenge.","My parents were killed when I was a child.","I am known as a bounty hunter in a port with no law.","I blew up the ship of the Reaver King."]},
 {a:"Kai'Sa",c:["I grew up alone in a place that wanted to eat me.","I was a child when the ground opened beneath my village in Shurima.","My armor is alive.","I hunt the creatures of the Void."]},
 {a:"Viktor",c:["I was born in the undercity with a limp and a rare illness.","Professor Heimerdinger brought me to the Academy as his assistant.","I worked beside Jayce to master magic through science.","Hextech was my life's work."]},
 {a:"Leona",c:["I was raised among the Rakkor.","I trained with a warrior order that worships the sun.","I pitied the orphan the Solari punished for asking questions.","I carry the Aspect of the Sun."]},
 {a:"Ahri",c:["I am one of the vastaya.","I can see the memories of those I drain.","I search for where my kind came from.","I have nine tails."]},
 {a:"Swain",c:["I was thrown out of the army, then took the whole empire.","I lost an arm in Ionia.","A demon whispers through my body.","Crows follow me everywhere."]},
 {a:"Ryze",c:["I have lived far longer than any mortal should.","My master was named Tyrus.","I saw the first strike of a war that nearly ended the world.","I hunt the World Runes so no one else can use them."]},
 {a:"Teemo",c:["I am a scout, and very proud of it.","I come from a city few humans find.","My weapon is a blowgun.","I am a yordle who loves the outdoors."]}
];

export const PAIRS=[
 ["Garen","Lux","Brother and sister of House Crownguard"],["Darius","Draven","Brothers who rose together in Noxus"],
 ["Nasus","Renekton","Ascended brothers of ancient Shurima"],["Yasuo","Yone","Brothers parted by Yasuo's blade"],
 ["Xayah","Rakan","Vastayan partners fighting for their people"],["Kayle","Morgana","Twin sisters with opposite ideals"],
 ["Leona","Diana","Chosen of the Sun and the Moon"],["Shen","Zed","Trained side by side, now sworn enemies"],
 ["Twisted Fate","Graves","Old partners in crime"],["Azir","Xerath","The emperor and the slave who betrayed him"],
 ["Ashe","Sejuani","Rival leaders fighting for the Freljord"]
];

/* Kinds of bond between champions */
export const BOND={
  family:{label:"Family",c:"#e9c46a"}, love:{label:"Love",c:"#ef8fb6"}, allies:{label:"Allies",c:"#4fc3c7"},
  mentor:{label:"Mentor",c:"#9eabff"}, rivals:{label:"Rivals",c:"#f08c3a"}, betrayal:{label:"Betrayal",c:"#b878e8"},
  enemies:{label:"Enemies",c:"#e84057"}, linked:{label:"Crossed paths",c:"#8a7346"}
};

/* Our own short summaries of each bond. Checked against the official biographies on Riot's Universe site, 12 Nov 2026. */
export const STORIES=[
 ["garen","lux","family","Brother and sister of the noble Crownguard family. Lux was born with magic, which Demacia outlaws, so she hides her gift even from the kingdom her brother serves."],
 ["darius","draven","family","Orphaned brothers from the Noxian port of Basilich. As boys, Darius was always the one who ended the brawls Draven picked. One became the Hand of Noxus, the other its showman executioner."],
 ["nasus","renekton","family","Brothers who both became Ascended in ancient Shurima. To stop Xerath, Renekton sealed himself in a tomb with him for thousands of years, and came out mad and blaming Nasus."],
 ["yasuo","yone","family","Half-brothers who were inseparable as children. Years later, Yasuo was blamed for a murder, Yone hunted him down and fell to his brother's blade. He has since returned from the spirit realm."],
 ["kayle","morgana","family","Twin sisters born beneath Mount Targon during the Rune Wars. Kayle, born moments earlier, chose unbending justice. Morgana chose mercy for mortals."],
 ["katarina","cassiopeia","family","Daughters of the Noxian house Du Couteau. Katarina took after their father and learned the blade; Cassiopeia followed their mother into politics."],
 ["katarina","talon","allies","Talon was a street killer until General Du Couteau, Katarina's father, beat him in a fight and offered him a place. Talon agreed, but swore his service to the general alone."],
 ["lucian","senna","love","Senna was apprenticed to Lucian's father, a Sentinel of Light, and later became Lucian's wife. When Thresh attacked, she stepped between the wraith and her husband."],
 ["senna","thresh","enemies","Thresh caught Senna's soul in his lantern when she shielded Lucian from him. She spent years trapped inside before she broke free."],
 ["lucian","thresh","enemies","Lucian charged Thresh recklessly and lost Senna saving him. He has hunted the wraith ever since."],
 ["xayah","rakan","love","Vastayan partners and rebels. Xayah first noticed Rakan while he was thrilling a crowd as a performer. She plans the fight; he turns it into a show."],
 ["ashe","tryndamere","love","To join her people with a mountain clan that was nearly wiped out, Ashe married its last great warrior, Tryndamere. He agreed reluctantly."],
 ["ashe","sejuani","rivals","Childhood friends who shared summer hunts, until a feud between their families split their tribes. Now each wants to lead the Freljord her own way."],
 ["sylas","lux","betrayal","After fifteen years in a Demacian cell, Sylas was visited by a young volunteer named Luxanna. She brought him books in exchange for his knowledge of magic, and he used her to break free."],
 ["jarvaniv","garen","allies","They met as rival youths in military training and became fast friends. Garen now leads the elite Dauntless Vanguard for his prince."],
 ["jarvaniv","shyvana","allies","Wounded and alone in the wilds, Jarvan would have died if the half-dragon Shyvana hadn't found him. She has fought at his side ever since."],
 ["taliyah","yasuo","mentor","Yasuo met Taliyah in the snow after she fled the Noxian army, and helped her master her stone magic. When they parted, he gave her a treasured maple seed."],
 ["shen","zed","rivals","Closest friends and the Kinkou's most promising students. Zed turned to forbidden shadow magic, led a coup against the order and founded the Order of Shadow."],
 ["zed","kayn","mentor","Zed found Kayn after a massacre: a Noxian child soldier armed with nothing but a harvesting tool. He saw the future of the Order of Shadow in him."],
 ["shen","akali","mentor","Shen trained Akali in stealth until she became the Fist of Shadow, but he kept urging restraint, and she drifted away from the Kinkou."],
 ["shen","kennen","allies","When Zed's coup shattered the Kinkou, the yordle Kennen held the order together while the young Shen struggled to lead."],
 ["viego","kalista","betrayal","Kalista was the king's niece and his most trusted general. She stopped an assassin's blade, but it was poisoned and cut Queen Isolde instead, and Viego's grief began the Ruination."],
 ["hecarim","kalista","betrayal","Kalista trusted Hecarim's Iron Order to guard the king while she searched for a cure for the queen. That trust ended in betrayal, and both are now bound to the Black Mist."],
 ["azir","xerath","betrayal","Azir befriended a slave boy, named him Xerath, meaning 'one who shares', and was saved by him from an assassin. Years later, Xerath destroyed Azir during his Ascension."],
 ["azir","sivir","family","Sivir woke in the desert being tended by Azir himself. She carries his bloodline, which is why Xerath wants her dead."],
 ["azir","nasus","allies","As a boy, Azir spent more time in the Great Library of Nasus than at weapons practice under Renekton."],
 ["xerath","renekton","enemies","Unable to destroy Xerath, Renekton wrestled him into the Tomb of the Emperors and had Nasus seal them inside. Their fight went on in the dark for millennia."],
 ["leona","diana","rivals","Both grew up among the sun-worshipping Solari. Leona saw the orphan Diana punished for her questions and felt for her. Now they carry the Aspects of the Sun and the Moon."],
 ["pantheon","aatrox","enemies","Aatrox goaded the Aspect of War into battle near Mount Targon, impaled it and left its mortal host, Atreus, to die. Atreus lived, and became Pantheon."],
 ["jayce","viktor","rivals","Viktor widened Jayce's horizons and they built hextech together. Jayce wanted to improve life with technology; Viktor wanted to fix humanity itself."],
 ["heimerdinger","viktor","mentor","Viktor caught the eye of Professor Heimerdinger and came to work at Piltover's Academy."],
 ["caitlyn","vi","allies","Piltover's sheriff took on a hot-headed recruit from Zaun. Rumor says the partnership has something to do with a certain blue-haired troublemaker."],
 ["caitlyn","jinx","enemies","Jinx keeps Piltover in chaos, and Caitlyn and Vi have set traps to catch her."],
 ["missfortune","gangplank","enemies","Gangplank murdered Miss Fortune's family in her mother's gun workshop. She rebuilt her mother's pistols and spent years planning his humiliation."],
 ["twistedfate","graves","betrayal","Tobias, now called Twisted Fate, met Malcolm Graves over a card table and they ran cons for years. One night went wrong: Graves was taken alive while Tobias ran free."],
 ["rengar","khazix","rivals","Rengar was sent to bring back Kha'Zix's head. The Void creature tore out one of his eyes and escaped, and each now sees the other as the only prey worth having."],
 ["swain","darius","allies","Darius had spoken up for Swain after his disgrace in Ionia. When Swain seized the throne, Darius, sworn to Noxus rather than any ruler, stood with him."],
 ["swain","leblanc","rivals","LeBlanc manipulated Swain when he was young and helped ensure his disgrace in Ionia. Then he did what she never expected and took Noxus for himself."],
 ["kaisa","kassadin","family","Kassadin lost his wife and baby daughter when the Void swallowed their village. That daughter, Kai'Sa, survived inside the Void."],
 ["kassadin","malzahar","enemies","Kassadin swore to destroy Malzahar, the prophet of the Void, and the power behind him."],
 ["warwick","singed","enemies","Warwick barely remembers the time Singed spent experimenting on him, slowly turning a man into a beast."]
];

/* Original fan art made for the Codex (see higgsfield-prompts.md). Add one line per finished image. */
export const FANART = [
  // { region: "demacia", kind: "Place", title: "The white city", src: "art/demacia-city.jpg" },
];
