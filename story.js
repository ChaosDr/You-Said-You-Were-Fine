const ARRIVAL=[
 'Leo said five people. I count ten. Great.',
 'And Mom invited David. After I specifically asked her not to.',
 'My head is killing me. Water first. Then I’m finding somewhere quiet.'
];
const L=(who,text)=>({who,text});
function readPhone(){if(!started||busy||event||ended||paused)return;choice('Phone','What do you want to check?',[
 ['Earlier messages',()=>{remember('You had asked for a small dinner, no David, and an early finish.');say([L('Monday · Elena → Leo','Small dinner this year? Just the five of us, and home by nine. Please.'),L('Leo → Elena','Absolutely. Leave it to me :)'),L('Yesterday · Elena → Mom','Please don’t invite David. I’m still upset about him reading my messages out at the last dinner.'),L('Mom → Elena','You two can’t avoid each other forever.'),L('Today · Elena → Leo','My head hurts. I still want to come, but I might leave early.'),L('Leo → Elena','We’ll look after you. Promise.')])}],
 ['Party group chat',()=>{F.chat=true;remember('The party chat discussed your mood without asking you.');say([L('Mia','Where’s the birthday girl? Photos??'),L('Mom',F.quiet?'She needed a little break. Don’t make a fuss.':'She hasn’t eaten properly. I’m sorting it.'),L('Leo',F.wantsLeave?'She says she wants to leave. Can someone get the cake ready?':'Give her a minute. She’s had a long day.')])}]
 ])}
function eventReply(lines,done=completeEvent){say(lines,done)}
function presentEvent(id){
 if(id.startsWith('caught_')){const n=person(id.slice(7));const lines={
 leo:['Where are you going now? I thought we agreed you’d stay.','I’ll tell them you’re coming back, then.'],
 mother:['Elena! Don’t sneak off. At least come and eat something.','Fine. But I’m saving you a slice.'],
 mia:['There you are! I need you for one more picture.','Fine. I’ll ask someone else.'],
 david:['Off already? Your mother went to a lot of trouble.','All right, I was only asking.'],
 rita:['You’re not leaving, are you? I came all this way.','Go on, then. I’ll speak to your mother.'],
 sophie:['Wait, you can’t go yet. I haven’t told you what he said.','Okay. I’ll text you the whole thing.'],
 tom:['Oh, before you go, we still need to split the bill.','Okay. Leo can sort it out.'],
 celine:['Elena! They want everyone at the table.','All right. I’ll tell them you need a minute.']
 };const [opening,reply]=lines[n.id];choice(n.name,opening,[['“I’m just getting my things.”',()=>{F.boundary=true;eventReply([L(n.name,reply)])}],['“Can I have a minute, please?”',()=>eventReply([L(n.name,reply)])],['“I’ll be right back.”',()=>eventReply([L(n.name,reply)])]]);return}
 if(id.startsWith('greet_')){const n=person(id.slice(6));const line={mother:'Elena, come and eat something. I don’t want you telling everyone later that we didn’t look after you.',leo:'There she is! Go and say hello to everyone, will you? They keep asking me why you’re being so quiet.',david:'Birthday girl! Still not talking to me? We’re all family here. Let’s have a nice evening.',rita:'Birthday girl! Come and sit with me. Your mother says you’ve been stressed. When I was your age, I had two children and a full-time job.',tom:'Elena! Did you open our present? Celine says we should’ve got the green one. I’m sure you pointed at the blue one.',celine:'There you are! Leo wants everyone at the table. I thought this was going to be tiny, then he added us all to this enormous group chat.'}[n.id];eventReply([L(n.name,line),L('Elena','I’ll be there in a minute.')]);return}

 if(id==='photo')say([L('Mia','Birthday girl! Come here. The light’s good. One photo before we sit down.'),'Oh no. Please, not yet.'],()=>choice('Mia','Come on. Two seconds.',[
 ['“Water first. My head hurts.”',()=>{F.boundary=true;remember('You asked to get water before taking a photo.');eventReply([L('Mia','Oh. Are you annoyed with me? I only wanted a nice picture.')])}],
 ['Take the photo',()=>{F.photoTaken=true;remember('You stopped for a photograph on your way to get water.');eventReply([L('Mia','Wait, your eyes were shut. Again. Okay, one silly one!'),'I said one.'])}],
 ['“No photos right now, please.”',()=>{F.boundary=true;remember('You declined a photograph.');eventReply([L('Mia','Fine. But don’t complain tomorrow that nobody took any.')])}]]));
 if(id==='waterDavid')say([L('Uncle David','Your mother says you’re still upset with me. Really? It was a joke.'),'I just want a glass of water.'],()=>choice('Uncle David','We’re not going to do this all night, are we?',[
 ['“Can you move? I’m trying to get water.”',()=>{F.boundary=true;remember('David interrupted you at the jug. You asked him to move.');eventReply([L('Uncle David','All right! No need to snap.')],drinkWater)}],
 ['“You read my private messages out loud.”',()=>{F.boundary=true;remember('You reminded David why you were upset.');eventReply([L('Uncle David','And I said sorry. Sort of. Anyway, your mother invited me. Take it up with her.')],drinkWater)}],
 ['“Another time, David.”',()=>{remember('You postponed the conversation with David.');eventReply([L('Uncle David','Don’t make it awkward for your mother, that’s all.')],drinkWater)}]]));
 if(id==='hallMom')say([L('Mom','Where are you going? Leo’s asking where you are.'),'Please don’t follow me.'],()=>choice('Mom','You’ve barely said hello to anyone.',[
 ['“I need a minute alone.”',()=>{F.boundary=true;remember('You asked your mother for a minute alone.');eventReply([L('Mom','I can sit with you.'),L('Elena','Alone, Mom.'),L('Mom','You don’t have to say it like that. I’m trying to help.')])}],
 ['“My head hurts. I told you.”',()=>{remember('You explained the headache again.');eventReply([L('Mom','Then eat something. You haven’t listened to a word I’ve said.')])}],
 ['“I’m fine. I’ll be right back.”',()=>{F.fine=true;remember('You said you were fine so she would stop asking.');eventReply([L('Mom','Good. Two minutes, then. We’re all waiting.')])}]]));
 if(id==='leo')say([L('Leo','There you are. Did you eat? Mom says you didn’t eat.'),L('Elena','I want to go home. My head still hurts.'),L('Leo','Can we at least get through the cake? People keep asking me if you’re angry with me.')],()=>{
 const replies=[
 ['“I’m tired. I need to leave.”',()=>{F.wantsLeave=true;F.boundary=true;remember('You told Leo you wanted to go home.');motherDuringLeo()}],
 ['“Where are my keys?”',()=>{F.wantsLeave=true;remember('You asked Leo where your keys were.');motherDuringLeo()}],
 ['“Fine. I’ll stay for the cake.”',()=>{F.staying=true;F.wantsLeave=false;remember('You agreed to stay for the cake.');eventReply([L('Leo','Thank you. Could you try to look a little happier? Just for the photos.')])}]];
 if(F.booking)replies.push(['“You booked for twelve. You told me five.”',()=>{F.wantsLeave=true;F.boundary=true;remember('You challenged Leo about the booking for twelve people.');say([L('Leo','It was supposed to be a nice surprise. I thought you’d change your mind once you got here.')],motherDuringLeo)}]);
 choice('Leo','Fifteen more minutes. That’s all I’m asking.',replies)});
 if(id==='doorPhoto')say([L('Mia','Wait! You’re actually leaving? We still need one of all of us.'),'Oh, for fuck’s sake.'],()=>choice('Mia','You can leave straight after. Promise.',[
 ['“No. I’m going now.”',()=>{F.boundary=true;remember('You declined another photograph because you were leaving.');eventReply([L('Mia','I don’t get why you came if you didn’t want to be here.')])}],
 ['Take one last photo',()=>{F.photoTaken=true;remember('You stopped for one last photograph.');eventReply([L('Mia','See? You look happy there. That’s the one I’m posting.')])}],
 ['“Please stop asking.”',()=>{F.boundary=true;remember('You asked Mia to stop asking you to stay.');eventReply([L('Mia','Okay, okay. I heard you.')])}]]));
 if(id==='sophie')choice('Sophie','Oh my God, I’ve been trying to catch you all night. Guess who texted me. You’re going to die.',[
 ['“I’m not feeling well. Later?”',()=>{remember('You asked Sophie to save her story for another time.');eventReply([L('Sophie','Right. Sorry. It’s just… okay, later.')])}],
 ['“Give me the short version.”',()=>{remember('You listened to Sophie while trying to find Leo.');eventReply([L('Sophie','Okay, so you know how I said I was done with him? Well…'),'This is not going to be short.'])}],
 ['“I’m looking for Leo.”',()=>eventReply([L('Sophie','At the far end of the table. Is everything okay between you two?')])]]);
 if(id==='bagMom')choice('Mom','Why have you got your bag? Put it down. You’re making everyone think you’re leaving.',[
 ['“Because I am leaving.”',()=>{F.boundary=true;remember('You told your mother that you were collecting your things to leave.');eventReply([L('Mom','Rita took a train to be here. You can spare her ten minutes.')])}],
 ['“I just need my things.”',()=>eventReply([L('Mom','Nobody’s going to steal them. Honestly, you make everything so difficult.')])],
 ['Don’t answer',()=>{remember('You kept your bag and stopped explaining.');eventReply(['Just let me get my stuff.'])}]]);
 if(id==='leoFollow')say([L('Leo','Elena. Wait. Mom’s really upset now. Can you go back and tell her you’re not angry?'),'I literally just spoke to her.'],()=>choice('Leo','I’m the one who has to go back in there.',[
 ['“I’ve said goodbye. I’m going.”',()=>{F.boundary=true;remember('You told Leo you were leaving after he followed you into the hallway.');eventReply([L('Leo','Fine. I’ll sort it out, then.')])}],
 ['“You said I could leave early.”',()=>{F.boundary=true;remember('You reminded Leo of his earlier promise.');eventReply([L('Leo','I didn’t think you meant before we’d done anything.')])}],
 ['“Okay. I’ll come back for the cake.”',()=>{F.staying=true;F.wantsLeave=false;remember('You returned to the party after Leo followed you.');eventReply([L('Leo','Thank you. That’s all I wanted.')])}]]));
 if(id==='bathMom')choice('Mom · Outside the bathroom','Elena? Are you in there? Everyone’s asking where you are.',[
 ['“I’m in the bathroom, Mom.”',()=>eventReply([L('Mom','Yes, I know. Are you going to be long?')],finishQuiet)],
 ['“Can I get five minutes?”',()=>{F.boundary=true;eventReply([L('Mom','All right. No need to shout.')],finishQuiet)}],
 ['Say nothing',()=>eventReply([L('Mom','Elena? …Fine. I’ll wait outside.')],finishQuiet)]]);
}
function motherDuringLeo(){F.motherLeo=true;remember('Your mother joined in while you were asking Leo to leave.');say([
 L('Mom','Don’t start this now. You haven’t eaten. Sit down and have something, then see how you feel.'),L('Leo','Are you sure this isn’t about David? Because you’ve been like this since you saw him.'),'Shit. Here we go.'],()=>choice('Elena','They’re both waiting.',[
 ['“I want to go home. That’s it.”',()=>{F.boundary=true;eventReply([L('Leo','Your keys are in my jacket. Same place you left them. Just don’t leave without saying goodbye.')])}],
 ['“I’ll get my bag and book a ride.”',()=>eventReply([L('Mom','So you can walk around getting your things, but you can’t sit with us for a bit?')])],
 ['“Five more minutes. Then I’m leaving.”',()=>{remember('You offered five more minutes.');eventReply([L('Leo','Okay. I’ll get the candles. Don’t disappear again.')])}]]));}
function drinkWater(){F.water=true;remember('You finally got a glass of water.');say(['Finally.'],completeEvent)}
function finishQuiet(){F.quiet=true;remember('You took a minute in the bathroom.');say(['Jesus. Even in here.'],event?completeEvent:null)}
function inspect(id){
 if(id==='water'){if(F.water){say(['Another sip.']);return}if(F.photo!==true){startEvent('photo','mia',()=>inspect('water'));return}if(F.waterDavid!==true){startEvent('waterDavid','david');return}F.water=true;say(['Finally.']);return}
 if(id==='bench'||id==='mirror'||id==='sink'){
  if(room==='hall'&&F.water&&F.hallMom!==true){Object.assign(person('mother'),{room:'hall',x:143,y:185,home:[94,133],path:null});startEvent('hallMom','mother',()=>inspect(id));return}
  if(room==='bath'&&F.bathMom!==true){say([id==='mirror'?'I look exhausted.':'Cold water. That’s better.'],()=>startEvent('bathMom','mother'));return}
  F.quiet=true;remember(id==='bench'?'You sat on the hallway bench.':'You took a minute in the bathroom.');say([id==='bench'?'Okay. Just sit here for a second.':'I need to get out of this place.']);return
 }
 if(id==='jacket'){if(F.leo!==true){startEvent('leo','leo');return}if(F.keys){say(['Got them already.']);return}if(F.staying||!F.stealth){F.staying=false;F.wantsLeave=true;beginKeyStealth();return}const watching=keyStealth()?spotter():null;if(watching){catchGuest(watching);return}F.keys=true;F.wantsLeave=true;F.sneakedKeys=!(F.keyInterruptions>0);remember(F.sneakedKeys?'You slipped past the guests and took your keys without being noticed.':'You got your keys after being stopped again on the way.');say([F.bag?'Got them. Now my coat.':'Got them. Now my bag.']);return}
 if(id==='bag'){if(F.bag){say(['Got it.']);return}F.bag=true;F.ticket=true;remember('You picked up your bag and found the coat-check ticket inside.');say([L('In your bag','Phone charger. Lip balm. Coat ticket, number 14.')],()=>{if(F.leo===true&&F.bagMom!==true)startEvent('bagMom','mother')});return}
 if(id==='booking'){F.booking=true;remember('The booking card showed that Leo reserved a room for twelve.');say([L('Reservation card','PRIVATE ROOM · LEO · 12 GUESTS\nBooked three weeks ago.'),'Twelve? He told me five.']);return}
 if(id==='gift'){F.gift=true;remember('You opened Tom and Celine’s present.');say([L('Gift tag','Happy birthday! From Tom & Celine.'),L('Inside the box','A blue scarf. The one you pointed out to Tom last month.'),'Okay, that’s actually really nice.']);return}
 if(id==='cake'){choice('Mom','Come on. Everyone’s ready. Make a wish.',[['Stay for the cake and finish the evening',()=>{remember('You stayed for the cake.');end('stay')}],['“I need to leave.”',()=>{F.wantsLeave=true;F.staying=false;F.boundary=true;say([L('Mom','I’ve been up since seven making this. One slice. Please.')])}],['Come back later',()=>say(['Not yet.'])]]);return}
 if(id==='exit'){leavePrompt();return}if(id==='taxi'){talk(person('host'));return}
 if(id==='window'){say(['A tram. A dog. People going home. Looks nice.']);return}
 if(id==='flowers'){say([L('The card','To our birthday girl. Love, Mom, David, Rita, Tom & Celine.'),'She invited everyone, then.']);return}
 say([L('Old photograph','The restaurant, twenty years ago. Four tables. A tiny bar.'),'Could’ve booked that.']);
}
function talk(n){
 if(n.id==='leo'){if(F.leo!==true){startEvent('leo','leo');return}choice('Leo','Have you got everything? Mom wants to speak to you before you go.',[[F.keys?'“I’ve already spoken to her.”':'“I’m getting my keys.”',()=>say([L('Leo','Can you just be nice about it? She’s upset.')])],['“You said we could keep this small.”',()=>say([L('Leo','And I thought it would be nice to have people who care about you there. Clearly I got it wrong.')])],['“I’m going to get my things.”',()=>say([L('Leo','Fine. Tell me before you leave.')])]]);return}
 if(n.id==='nora'){choice('Nora','Hey. What’s up?',[
 ['“Can you drive me home?”',()=>{F.help=true;F.wantsLeave=true;remember('You asked Nora for a ride.');noraFinal('help')}],
 ['“I just need to talk to someone.”',()=>noraFinal('talk')],
 ['“I’m getting a taxi. Walk me out?”',()=>{F.wantsLeave=true;noraFinal('taxi')}]]);return}
 if(n.id==='host'){choice('Restaurant host',F.coat?'Anything else?':F.ticket?'Coat number fourteen? One moment.':'Can I help you?',[
 ...(!F.coat?[[F.ticket?'Hand over ticket 14':'“Can I get my coat? It’s the gray one.”',()=>{F.coat=true;remember('You collected your coat from the host.');say([L('Restaurant host',F.ticket?'Here you are.':'Gray wool, right? Here you go.')])}]]:[]),
 ['“Could you call me a taxi?”',()=>{F.taxi=true;remember('You asked the host to call a taxi.');say([L('Restaurant host','Of course. I’ll ask them to wait outside.')])}],
 ['“Nothing else, thanks.”',()=>say([L('Restaurant host','Have a good evening.')])]]);return}
 if(n.id==='mother'){say([L('Mom',F.bag?'You’ve got your bag already? At least say goodbye to Rita. She took a train.':'You still look upset. People are going to think we’ve done something to you.')]);return}
 if(n.id==='mia'){if(F.photo!==true){startEvent('photo','mia');return}say([L('Mia',F.photoTaken?'I posted the photo. Everyone says you look gorgeous.':'You sure you don’t want one picture? Just you and Leo?')]);return}
 if(n.id==='rita'){say([L('Aunt Rita','Your mother says you’ve been stressed. You know, when I was your age I had two children and a full-time job.'),'Here we go.']);return}
 if(n.id==='sophie'){if(F.sophie!==true){startEvent('sophie','sophie');return}say([L('Sophie','Okay, but later I really need your opinion. It’s a whole thing.')]);return}
 if(n.id==='tom'){say([L('Tom','Did you open our present? Celine thinks we should’ve got the green one. I said you definitely pointed at the blue one.')]);return}
 if(n.id==='celine'){say([L('Celine','I thought it was going to be tiny tonight. Then Leo added us all to this massive group chat. Oh, was it meant to be a surprise?')]);return}
 say([L('Uncle David','Come on. Smile. It’s your birthday.')]);
}
function noraFinal(mode){
 F.noraMet=true;F.noraConfided=true;remember('You told Nora you wanted a small birthday dinner, were tired, and didn’t feel the party was for you.');
 const closing=mode==='help'?'Leave together ▸':'Head to the door ▸';
 say([L('Elena','I just wanted a small thing. A few people, dinner, then home.'),L('Nora','Yeah. That’s what you told me.'),L('Elena','I’m tired. My head hurts. I said that before we even got here.'),L('Elena','And every time I tried to get a minute, someone needed me for something else.'),L('Elena','I know they went to a lot of trouble. But this didn’t feel like it was for me.'),{who:'Elena',text:'Was that too much to ask?',options:[[closing,()=>{if(mode==='help')end('help');else{cooldown=1;focusGame();goTo({id:'exit',x:158,y:146,label:'The front door'})}}]]}]);
}
function leavePrompt(){choice('The front door',F.help?'Nora’s ready when you are.':!F.bag||!F.coat?'You can leave now, or collect the rest of your things first.':'You’ve got your things. Ready?',[
 ['Go home'+(F.taxi?' in the taxi':''),()=>{remember('You left the dinner.');end('leave')}],...(F.help?[['Leave with Nora',()=>end('help')]]:[]),
 ['Go back for my things',()=>{F.staying=false;say(['Bag, coat. Then I’m out.'])}],['Stay for the cake',()=>{F.staying=true;F.wantsLeave=false;say(['Fine. Cake. Then home.'])}]]);}
function end(type){
 ended=true;busy=false;paused=false;event=null;navigation=null;keys={};$('dialogue').hidden=true;$('pause').hidden=true;const e=$('ending');e.hidden=false;e.replaceChildren();
 function add(tag,text,cls){const n=document.createElement(tag);n.textContent=text;if(cls)n.className=cls;e.append(n);return n}
 add('span','THE NEXT MORNING','eyebrow');add('h2',{leave:'You went home.',help:'Someone listened.',stay:'You stayed for the candles.'}[type]);
 add('p',{leave:'By morning, the room had found a story about the evening.',help:'Nora drove. For a while, neither of you said anything.',stay:'You smiled for the photograph. Everyone applauded when you blew out the candles.'}[type]);
 const messages=type==='stay'?[['Mom','Such a lovely evening. See? You just needed to relax.'],['Mia','She seemed fine by the end! Photo coming :)'],['Leo','Glad we didn’t let that headache ruin your birthday.']]:[['Mom','We were all worried. She seemed upset from the beginning.'],['Mia',F.boundary?'I tried to cheer her up. I don’t think she wanted us there.':'She said she was fine. I didn’t realize it was that bad.'],['Leo','I just wish she’d told me what she wanted.']];
 for(const [who,text]of messages){const n=add('div','','chat');const b=document.createElement('b');b.textContent=who;n.append(b,document.createTextNode(text))}
 if(type==='help'){const n=add('div','','chat record');const b=document.createElement('b');b.textContent='Nora · Private message';n.append(b,document.createTextNode('You asked to leave. I’m glad you told me. How’s your head?'))}
 add('span','WHAT YOU REMEMBER','eyebrow');for(const m of memories)add('div',m,'chat record');
 add('p',type==='stay'?'The photograph looks like a good evening. You remember the effort it took to stay in it.':'Your headache is quieter. The messages are still arriving.');
 const d=add('details','');const summary=document.createElement('summary');summary.textContent='Find the other endings';d.append(summary,document.createTextNode('Go home: use the front door. Someone listened: ask Nora for a ride and leave together. Stay: return to the cake and finish the evening. Your choices change the record and the next-morning messages.'));
 add('button','Play again ▸').onclick=()=>location.reload();try{localStorage.setItem('pcp-birthday-last',JSON.stringify({ending:type,memories}))}catch{}
}
