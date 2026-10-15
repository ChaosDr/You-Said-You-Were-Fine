'use strict';
const $=id=>document.getElementById(id),canvas=$('game'),ctx=canvas.getContext('2d');
const F={},memories=[],visited=new Set(['dining']),art={};
let started=false,ended=false,busy=false,paused=false,room='dining',queue=[],dialogueDone=null,currentLine=null,navigation=null,event=null,cooldown=0,time=0,last=0,keys={},resumeTarget=null;
const player={x:48,y:173,dir:'down',walking:false,step:0};
const people=[
{id:'leo',name:'Leo',row:1,room:'dining',x:73,y:185,home:[73,185],dir:'right',turnAt:2.8},
{id:'mother',name:'Mom',row:2,room:'dining',x:259,y:91,home:[259,91]},
{id:'mia',name:'Mia',row:3,room:'dining',x:76,y:152,home:[76,152]},
{id:'david',name:'Uncle David',row:4,room:'dining',x:85,y:115,home:[85,115]},
{id:'nora',name:'Nora',row:5,room:'entry',x:254,y:132,home:[254,132]},
{id:'host',name:'Restaurant host',row:2,room:'entry',x:109,y:118,home:[109,118]},
{id:'rita',name:'Aunt Rita',row:6,room:'dining',x:258,y:121,home:[258,121],roam:[[250,111],[267,130]],roamAt:8},
{id:'sophie',name:'Sophie',row:7,room:'dining',x:53,y:130,home:[53,130],roam:[[40,118],[63,136]],roamAt:6},
{id:'tom',name:'Tom',row:8,room:'dining',x:254,y:178,home:[254,178],roam:[[249,161],[266,179]],roamAt:10},
{id:'celine',name:'Celine',row:9,room:'dining',x:182,y:190,home:[182,190],roam:[[155,190],[198,182]],roamAt:12}];
const rooms={
dining:{title:'THE BIRTHDAY DINNER',crop:[32,34,888,462],bounds:[17,62,307,194],blocks:[[102,64,134,110],[17,38,64,40],[282,123,23,57],[16,145,12,42],[282,48,20,25]],objects:[['water',42,84,'Pour and drink a glass of water'],['cake',168,179,'Birthday cake'],['jacket',277,171,'Leo’s jacket'],['flowers',29,145,'The flowers'],['bag',94,182,'Pick up your bag'],['booking',71,84,'The booking card'],['gift',94,130,'A present from Tom and Celine']],doors:[['hall',263,191,'Hallway',145,174,'down']]},
hall:{title:'A MINUTE IN THE HALLWAY',crop:[948,34,554,462],bounds:[46,67,300,194],blocks:[[232,111,68,62],[67,47,34,49],[275,167,25,27],[46,67,31,45]],objects:[['bench',222,150,'Sit on the bench'],['picture',75,114,'A framed photograph']],doors:[['dining',132,190,'Dining room',270,182,'down'],['bath',155,75,'Bathroom',171,144,'up'],['entry',60,153,'Entrance',50,132,'left']]},
bath:{title:'THE BATHROOM',crop:[33,532,729,446],bounds:[60,86,264,160],blocks:[[143,55,65,47],[67,59,38,64],[235,87,22,30]],objects:[['mirror',174,112,'Look in the mirror'],['sink',207,114,'Cold water']],doors:[['hall',170,154,'Hallway',168,104,'down']]},
entry:{title:'THE FRONT DOOR',crop:[800,532,702,459],bounds:[26,97,297,145],blocks:[[25,66,108,43],[176,41,25,52],[279,109,18,33]],objects:[['exit',158,146,'The front door'],['taxi',75,114,'Ask for a taxi'],['window',242,112,'The street outside']],doors:[['hall',33,130,'Hallway',82,153,'left']]}
};
function remember(text){if(!memories.includes(text))memories.push(text)}
function person(id){return people.find(n=>n.id===id)}
function setText(id,text){if($(id).textContent!==text)$(id).textContent=text}
function setSpeech(line){const el=$('speech');el.replaceChildren();const parts=line.text.split(/(\*\*.*?\*\*)/g);for(const part of parts){if(part.startsWith('**')&&part.endsWith('**')){const strong=document.createElement('strong');strong.textContent=part.slice(2,-2);el.append(strong)}else el.append(document.createTextNode(part))}}
function focusGame(){canvas.focus({preventScroll:true})}
function say(lines,done){busy=true;keys={};player.walking=false;for(const n of people)n.walking=false;navigation=null;queue=lines.map(l=>typeof l==='string'?{who:'Elena · Your thoughts',text:l}:l);dialogueDone=done||null;advance()}
function choice(who,text,options){say([{who,text,options}])}
function advance(){
 if(!queue.length){busy=false;currentLine=null;$('dialogue').hidden=true;keys={};cooldown=.65;const done=dialogueDone;dialogueDone=null;focusGame();if(done)done();return}
 currentLine=queue.shift();$('dialogue').hidden=false;setText('speaker',currentLine.who||'Elena');setSpeech(currentLine);$('choices').replaceChildren();
 const options=currentLine.options||[[queue.length?'Continue ▸':'Back to the room ▸',advance]];
 options.forEach(([label,fn],i)=>{const b=document.createElement('button');b.textContent=label;b.dataset.choice=i;b.onclick=()=>{keys={};if(currentLine?.options){busy=false;queue=[];dialogueDone=null;currentLine=null;$('dialogue').hidden=true}fn()};$('choices').append(b)});
 if(typeof window.innerWidth==='number'&&window.innerWidth<600)$('dialogue').scrollIntoView({block:'nearest',behavior:'auto'});
}
// Guests never become physical locks. Only the room and furniture block walking.
function blocked(x,y){const [l,t,r,b]=rooms[room].bounds;return x<l+3||x>r-3||y<t+3||y>b||rooms[room].blocks.some(([a,b,w,h])=>x+3>a&&x-3<a+w&&y>b&&y-3<b+h)}
function clearLine(a,b){
 if(blocked(a[0],a[1])||blocked(b[0],b[1]))return false;
 return !rooms[room].blocks.some(([x,y,w,h])=>{
  let enter=0,leave=1;const low=[x-3+.00001,y+.00001],high=[x+w+3-.00001,y+h+3-.00001];
  for(let axis=0;axis<2;axis++){const d=b[axis]-a[axis];if(Math.abs(d)<.000001){if(a[axis]<low[axis]||a[axis]>high[axis])return false;continue}const t1=(low[axis]-a[axis])/d,t2=(high[axis]-a[axis])/d;enter=Math.max(enter,Math.min(t1,t2));leave=Math.min(leave,Math.max(t1,t2));if(enter>leave)return false}
  return enter<=leave&&leave>=0&&enter<=1;
 });
}
function route(from,target,radius=12){
 const size=2,start=[Math.round(from.x/size),Math.round(from.y/size)],todo=[start],seen=new Set([start.join(',')]),prev=new Map();let goal=null;
 for(let i=0;i<todo.length;i++){const a=todo[i];if(Math.hypot(a[0]*size-target.x,a[1]*size-target.y)<=radius&&!blocked(a[0]*size,a[1]*size)){goal=a;break}
  for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){const b=[a[0]+dx,a[1]+dy],k=b.join(',');if(i===0&&!clearLine([from.x,from.y],[b[0]*size,b[1]*size])||seen.has(k)||blocked(b[0]*size,b[1]*size)||dx&&dy&&(blocked(a[0]*size,b[1]*size)||blocked(b[0]*size,a[1]*size)))continue;seen.add(k);prev.set(k,a);todo.push(b)}}
 if(!goal)return null;const raw=[];while(goal.join(',')!==start.join(',')){raw.unshift([goal[0]*size,goal[1]*size]);goal=prev.get(goal.join(','))}
 const result=[];let anchor=[from.x,from.y],i=0;while(i<raw.length){let j=i;while(j+1<raw.length&&clearLine(anchor,raw[j+1]))j++;result.push(raw[j]);anchor=raw[j];i=j+1}return result;
}
function follow(actor,path,dt,speed){let remaining=dt*speed,moved=0;while(path.length&&remaining>0){const q=path[0],dx=q[0]-actor.x,dy=q[1]-actor.y,d=Math.hypot(dx,dy);if(d<.0001){path.shift();continue}const step=Math.min(d,remaining);actor.x+=dx/d*step;actor.y+=dy/d*step;remaining-=step;moved+=step;actor.dir=Math.abs(dx)>Math.abs(dy)?dx<0?'left':'right':dy<0?'up':'down';if(step>=d-.0001)path.shift()}actor.walking=moved>0;actor.step=(actor.step||0)+moved;return path.length===0}
function targets(){return [...rooms[room].objects.filter(o=>o[0]!=='bag'||!F.bag).map(([id,x,y,label])=>({id,x,y,label})),...rooms[room].doors.map(([to,x,y,label,sx,sy,dir])=>({to,x,y,label,sx,sy,dir})),...people.filter(n=>n.room===room).map(n=>({...n,label:'Talk to '+n.name}))]}
function nearest(){return targets().map(n=>({...n,distance:Math.hypot(n.x-player.x,n.y-player.y)})).filter(n=>n.distance<24).sort((a,b)=>a.distance-b.distance)[0]||null}
function travel(to){const d=rooms[room].doors.find(d=>d[0]===to)||rooms[room].doors.find(d=>d[0]==='hall');if(!d)return null;const [dest,x,y,label,sx,sy,dir]=d;return{to:dest,x,y,label:'Go to '+label.toLowerCase(),sx,sy,dir}}
function nextTarget(){
 if(!F.water)return room==='dining'?{id:'water',x:42,y:84,label:'Get a glass of water'}:travel('dining');
 if(!F.quiet)return room==='hall'?{id:'bench',x:222,y:150,label:'Sit on the hallway bench'}:room==='bath'?{id:'mirror',x:174,y:112,label:'Look in the mirror'}:travel('hall');
 if(F.staying)return room==='dining'?{id:'cake',x:167,y:181,label:'Stay for the birthday cake'}:travel('dining');
 if(F.leo!==true)return room==='dining'?{...person('leo'),label:'Tell Leo you want to go home'}:travel('dining');
 if(!F.keys&&!F.help)return room==='dining'?{id:'jacket',x:274,y:170,label:'Slip over to Leo’s jacket for your keys'}:travel('dining');
 if(!F.bag)return room==='dining'?{id:'bag',x:94,y:182,label:'Get your bag from the birthday chair'}:travel('dining');
 if(room!=='entry')return travel('entry');
 if(!F.coat)return{...person('host'),label:'Collect your coat from the host'};
 if(!F.noraMet)return{...person('nora'),label:'Talk to Nora by the door'};
 return{id:'exit',x:158,y:146,label:'Decide whether to leave'};
}
function goTo(target){if(!target||!started||busy||paused||ended||event)return;const path=route(player,target,target.id==='jacket'&&keyStealth()?7:13);if(path===null){setText('hint','That spot is behind furniture. Approach from the open side.');return}navigation={target,path};keys={}}
function perform(target){if(target.to)change(target.to,target.sx,target.sy);else if(target.name)talk(person(target.id));else inspect(target.id)}
function change(to,x,y){room=to;player.x=x;player.y=y;player.walking=false;navigation=null;keys={};cooldown=.8;visited.add(to);setText('location',rooms[to].title);focusGame();if(to==='hall'){if(F.keys&&F.bag&&F.wantsLeave&&F.leoFollow!==true)Object.assign(person('leo'),{room:'hall',x:70,y:153,home:[176,175],dir:'right',path:[]});if(F.water&&F.hallMom!==true)Object.assign(person('mother'),{room:'hall',x:143,y:185,home:[190,103],dir:'up',path:[]});if(F.leo===true&&F.wantsLeave&&F.doorPhoto!==true)Object.assign(person('mia'),{room:'hall',x:132,y:186,home:[96,166],dir:'up',path:[]})}if(to==='dining'){for(const id of ['mother','leo'])if(person(id).room==='hall')Object.assign(person(id),{room:'dining',x:id==='mother'?259:73,y:id==='mother'?91:185,home:id==='mother'?[259,91]:[73,185],path:null})}}
function retire(n){if(!n||n.room!==room)return;n.path=route(n,{x:n.home[0],y:n.home[1]},2)||[];n.walking=false}
function startEvent(id,npcId,after){
 if(F[id]===true){if(after)after();return}if(event||busy)return;const n=person(npcId);resumeTarget=navigation?.target||null;navigation=null;keys={};player.walking=false;F[id]='running';const path=n&&n.room===room?route(n,player,17):[];event={id,n,after,t:0,path:path||[]};
}
function completeEvent(){const finished=event;if(!finished)return;F[finished.id]=true;event=null;cooldown=finished.id.startsWith('caught_')?1.8:.8;retire(finished.n);if(finished.id.startsWith('caught_')&&finished.n){finished.n.dismissed=true;finished.n.dir=opposite(finished.n.dir||'down')}if(finished.id==='leo'&&F.wantsLeave&&!F.keys){beginKeyStealth();return}const target=resumeTarget;resumeTarget=null;if(finished.after&&!ended)finished.after();else if(target&&!busy&&!ended)goTo(target)}
function eventDialogue(id){if(!event)return;event.presented=true;presentEvent(id)}
function action(){if(!started||ended||paused)return;if(busy){const b=document.activeElement?.parentElement===$('choices')?document.activeElement:$('choices').firstChild;b?.click();return}if(event)return;navigation=null;const target=nearest();if(target)perform(target);else setText('hint','Move close to a highlighted object, or use “Walk to next step”.')}
const facingVectors={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};
function turnDelay(n){return (keyStealth()?2.4:2.8)+(n.row%4)*.35}
function opposite(dir){return{up:'down',down:'up',left:'right',right:'left'}[dir]}
function keyStealth(){return F.leo===true&&F.stealth&&!F.keys&&!F.staying}
function sees(n,p=player){
 if(n.room!==room||n.dismissed)return false;
 const [vx,vy]=facingVectors[n.dir||'down'],dx=p.x-n.x,dy=p.y-n.y,forward=dx*vx+dy*vy,side=Math.abs(dx*vy-dy*vx);
 return forward>8&&forward<78&&side<6&&clearLine([n.x,n.y],[p.x,p.y]);
}
function spotter(p=player){return people.find(n=>n.room===room&&!['host','nora'].includes(n.id)&&sees(n,p))}
function beginKeyStealth(){
 F.stealth=true;F.keyInterruptions=0;resumeTarget=null;
 const facing={leo:'left',mother:'down',mia:'right',david:'down',rita:'down',sophie:'down',tom:'up',celine:'right'};
 for(const n of people.filter(n=>n.room==='dining')){n.path=[];n.walking=false;n.dir=facing[n.id]||'down';n.dismissed=false;n.turnAt=time+1.5+(n.row%4)*.4;n.roamAt=time+12}
 say(['My keys are in his jacket. **I need to stay out of their sight** or I’ll never get to them. **Wait for them to turn, then pass behind them.**']);
}
function catchGuest(n){if(!n||busy||event)return;F.keyInterruptions=(F.keyInterruptions||0)+1;startEvent('caught_'+n.id,n.id)}
function ambientEvents(){
 if(cooldown||busy||event||ended)return;
 if(room==='dining'){
  if(keyStealth()){const n=spotter();if(n){catchGuest(n);return}}
  if(!keyStealth()&&F.photo!==true&&sees(person('mia'))){startEvent('photo','mia');return}
  if(F.quiet&&F.leo!==true&&F.sophie!==true&&sees(person('sophie'))){startEvent('sophie','sophie');return}
  if(!keyStealth()&&F.quiet&&F.leo!==true&&sees(person('leo'))){startEvent('leo','leo');return}
  for(const id of ['rita','tom','celine','mother','david','leo']){const n=person(id);if(!keyStealth()&&!(id==='leo'&&F.leo===true)&&!F['greet_'+id]&&sees(n)){startEvent('greet_'+id,id);return}}
 }
 if(room==='hall'&&F.water&&F.hallMom!==true&&sees(person('mother'))){startEvent('hallMom','mother');return}
 if(room==='hall'&&F.keys&&F.bag&&F.wantsLeave&&F.leoFollow!==true&&sees(person('leo'))){startEvent('leoFollow','leo');return}
 if(room==='hall'&&F.leo===true&&F.wantsLeave&&F.doorPhoto!==true&&sees(person('mia'))){startEvent('doorPhoto','mia')}
}
function update(dt){
 dt=Math.max(0,Math.min(dt,.05));cooldown=Math.max(0,cooldown-dt);if(!started||ended||busy||paused){player.walking=false;return}time+=dt;
 for(const n of people){if(n.room!==room||event?.n===n)continue;if(n.path?.length)follow(n,n.path,dt,46);else{n.walking=false;if(time>(n.turnAt||0)){const dirs=['up','right','down','left'];n.dir=dirs[(dirs.indexOf(n.dir||'down')+1)%4];n.turnAt=time+turnDelay(n)}if(n.roam&&!keyStealth()&&time>(n.roamAt||0)){n.roamAt=time+7+(n.row%3);n.roamIndex=((n.roamIndex||0)+1)%n.roam.length;const [rx,ry]=n.roam[n.roamIndex];n.path=route(n,{x:rx,y:ry},2)||[]}const d=Math.hypot(player.x-n.x,player.y-n.y);if(d<10){const options=[[n.x-11,n.y],[n.x+11,n.y],[n.x,n.y-11],[n.x,n.y+11]].filter(([x,y])=>!blocked(x,y)).sort((a,b)=>Math.hypot(b[0]-player.x,b[1]-player.y)-Math.hypot(a[0]-player.x,a[1]-player.y));if(options.length)n.path=route(n,{x:options[0][0],y:options[0][1]},1)||[]}}}
 if(event){if(!event.presented){event.t+=dt;if(event.t>.4){if(event.n?.room===room&&event.path.length&&event.t<6)follow(event.n,event.path,dt,60);else{if(event.n?.room===room){const dx=player.x-event.n.x,dy=player.y-event.n.y;event.n.dir=Math.abs(dx)>Math.abs(dy)?dx<0?'left':'right':dy<0?'up':'down';event.n.walking=false}eventDialogue(event.id)}}}return}
 const dx=Number(!!keys.right)-Number(!!keys.left),dy=Number(!!keys.down)-Number(!!keys.up);
 if(dx||dy){navigation=null;const d=Math.hypot(dx,dy),sx=dx/d*64*dt,sy=dy/d*64*dt;let moved=0;if(!blocked(player.x+sx,player.y)){player.x+=sx;moved+=Math.abs(sx)}if(!blocked(player.x,player.y+sy)){player.y+=sy;moved+=Math.abs(sy)}player.walking=moved>.001;player.dir=dx?dx<0?'left':'right':dy<0?'up':'down';player.step+=moved}
 else if(navigation){const nav=navigation;if(follow(player,nav.path,dt,64)){navigation=null;player.walking=false;perform(nav.target);return}}
 else player.walking=false;
 if(!cooldown&&(dx||dy))for(const [to,x,y,label,sx,sy,dir]of rooms[room].doors){const toward=dir==='left'?dx<0:dir==='right'?dx>0:dir==='up'?dy<0:dy>0;if(toward&&Math.hypot(player.x-x,player.y-y)<10){change(to,sx,sy);return}}
 ambientEvents();
}
function togglePause(){if(!started||ended)return;paused=!paused;keys={};player.walking=false;$('pause').hidden=!paused;if(!paused)focusGame()}
function guide(){
 let text=!started?'A small dinner. An early finish.':!F.water?'The water is on the sideboard at the upper left.':!F.quiet?(room==='hall'?'Sit on the bench on the right, or use the bathroom ahead.':room==='bath'?'The mirror is above the sink. Press A / E nearby.':'Take a quiet minute. The hallway is at the lower right.'):F.staying?'You chose to stay. Return to the cake when you’re ready.':F.leo!==true?'Tell Leo you want to leave, or look around the party first.':!F.keys&&!F.help?'Your keys are in Leo’s jacket beside the dining-room doorway.':room==='entry'?'Nora can offer a ride. The front door is below the rug.':'You can leave now. Go through the hallway to the entrance on the left.';
 if(F.leo===true&&!F.staying&&(!F.keys||!F.bag))text=!F.keys?'Get to Leo’s jacket without being seen. The table blocks their sight.':'Get your bag from beside the birthday chair.';else if(F.keys&&F.bag&&!F.coat&&!F.staying)text=room==='entry'?'The host has your coat. Your coat ticket is in your bag.':'Bag, keys, coat. The host is at the entrance.';
 if(keyStealth()&&!busy&&!event)text='Keys: avoid the pale sightlines. Hug the table or wait for guests to turn.';if(event&&!busy)text=event.n?.name+' has spotted you…';if(busy)text='Conversation in progress. Choose a reply or press A / E to continue.';if(ended)text='The next morning';
 setText('objective',text);setText('progress',(F.water?'✓ Water':'○ Water')+'   '+(F.quiet?'✓ A quiet minute':'○ A quiet minute')+'   '+(F.keys?'✓ Keys':'○ Keys')+'   '+(F.bag?'✓ Bag':'○ Bag')+'   '+(F.coat?'✓ Coat':'○ Coat'));
 const target=nextTarget();setText('goNext',navigation?'Walking…':'Walk to next step ▸');setText('targetText',target?.label||'');$('goNext').disabled=!started||ended||busy||paused||!!event;
 for(const id of ['phone','requests'])$(id).disabled=!started||ended||busy||paused||!!event;
 $('action').disabled=!started||ended||paused;const nearby=nearest();setText('hint',busy?'Choose a response below. Movement resumes when the conversation ends.':event?'You’ve been spotted. Wait for the guest to walk over.':navigation?'Walking to '+navigation.target.label.toLowerCase()+'. Any direction key cancels.':nearby?'A / E: '+nearby.label:'Arrows / WASD to walk. A / E to interact. Guests move aside when you pass.');
}
function drawSprite(n,row){
 if(!art.cast||!art.frames)return;const direction=n.dir||'down',phase=Math.floor((n.step||0)/6)%4,col=direction==='up'?3:direction==='left'||direction==='right'?(n.walking?1+phase%2:1):0;
 const fr=art.frames[row][col],x=Math.round(n.x),y=Math.round(n.y),bob=n.walking&&(phase===1||phase===3)?1:0;
 ctx.fillStyle='#211d263d';ctx.fillRect(x-6,y-1,12,2);ctx.save();ctx.translate(x,y);ctx.scale(1.25,1.25);if(direction==='left')ctx.scale(-1,1);
 if(!n.walking)ctx.drawImage(art.cast,fr[0],fr[1],32,32,-16,-32,32,32);
 else{
  ctx.drawImage(art.cast,fr[0],fr[1],32,28,-16,-32-bob,32,28);
  const left=phase===1?2:0,right=phase===3?2:0,stride=(direction==='left'||direction==='right')?(phase===1?1:phase===3?-1:0):0;
  ctx.drawImage(art.cast,fr[0],fr[1]+26,16,6,-16+stride,-6-left,16,6);
  ctx.drawImage(art.cast,fr[0]+16,fr[1]+26,16,6,-stride,-6-right,16,6);
 }
 ctx.restore();
}
function drawProps(id){if(room!=='dining')return;
 if(id==='bag'&&!F.bag){ctx.fillStyle='#382c3c';ctx.fillRect(88,173,12,9);ctx.fillRect(91,169,6,5);ctx.fillStyle='#8b667b';ctx.fillRect(89,174,10,7);ctx.fillStyle='#dcc18b';ctx.fillRect(94,176,2,2)}
 if(id==='booking'){ctx.fillStyle='#f4e5bd';ctx.fillRect(65,55,12,7);ctx.fillStyle='#8c7359';ctx.fillRect(67,57,8,1);ctx.fillRect(67,59,5,1);}
 if(id==='gift'&&!F.gift){ctx.fillStyle='#ac687c';ctx.fillRect(143,94,11,8);ctx.fillStyle='#e8c995';ctx.fillRect(147,94,2,8);ctx.fillRect(143,96,11,2)}
}
const hitZones={dining:[['water',25,30,55,47],['cake',151,87,34,35],['jacket',281,122,25,58],['bag',87,168,15,16],['booking',64,52,15,11],['gift',141,91,16,13]],hall:[['bench',235,114,64,58]],bath:[['mirror',147,16,51,43],['sink',141,59,69,41]],entry:[['exit',134,138,57,52]]};
function markerPoint(t){const box=hitZones[room].find(b=>b[0]===t.id),[x,y]=visualPoint(t);return[x,t.name?t.y-43:box?y-7:y-15]}
function visualPoint(t){const box=hitZones[room].find(b=>b[0]===t.id);return box?[box[1]+box[3]/2,box[2]+box[4]/2]:[t.x,t.y]}
function drawNotice(x,y,color){x=Math.round(x);y=Math.max(2,Math.round(y));ctx.fillStyle='#252531b8';ctx.fillRect(x-2,y,5,9);ctx.fillStyle=color;ctx.fillRect(x,y+1,1,4);ctx.fillRect(x,y+6,1,1)}
function drawSightlines(){
 ctx.save();const [l,t,r,b]=rooms[room].bounds;ctx.beginPath();ctx.rect(l,t,r-l,b-t);ctx.clip();
 for(const n of people.filter(n=>n.room===room&&!['host','nora'].includes(n.id)&&!n.dismissed)){
  const [vx,vy]=facingVectors[n.dir||'down'];
  for(let d=12;d<78;d+=6){const x=n.x+vx*d,y=n.y+vy*d;if(!clearLine([n.x,n.y],[x,y]))break;ctx.fillStyle='#e8c19924';ctx.fillRect(Math.round(x)-(vx?2:5),Math.round(y)-(vx?5:2),vx?4:10,vx?10:4);ctx.fillStyle='#e8c19980';ctx.fillRect(Math.round(x),Math.round(y),1,1)}
 }ctx.restore();
}
function render(){
 guide();ctx.imageSmoothingEnabled=false;ctx.fillStyle='#24212a';ctx.fillRect(0,0,320,208);const [x,y,w,h]=rooms[room].crop;if(art.rooms)ctx.drawImage(art.rooms,x,y,w,h,0,0,320,208);if(keyStealth()&&!busy)drawSightlines();
 const layers=[...people.filter(n=>n.room===room).map(n=>({y:n.y,actor:n})),{y:player.y,actor:player,row:0},...rooms[room].blocks.map(b=>({y:b[1]+b[3],block:b})),...(room==='dining'?[{y:78.1,prop:'booking'},{y:174.1,prop:'gift'},{y:182,prop:'bag'}]:[])].sort((a,b)=>a.y-b.y);
 for(const layer of layers){if(layer.actor)drawSprite(layer.actor,layer.row??layer.actor.row);else if(layer.prop)drawProps(layer.prop);else if(art.rooms){const [bx,by,bw,bh]=layer.block;ctx.drawImage(art.rooms,x+bx/320*w,y+by/208*h,bw/320*w,bh/208*h,bx,by,bw,bh)}}
 if(started&&!ended){ctx.font='7px monospace';ctx.textAlign='center';for(const [,dx,dy,label]of rooms[room].doors){ctx.fillStyle='#263446e0';ctx.fillRect(dx-24,dy-5,48,10);ctx.fillStyle='#ffe2a2';ctx.fillText(label.toUpperCase(),dx,dy+2)}
 if(!busy&&!event){const target=nextTarget();for(const t of targets()){
  if(t.to||t.id==='bag'&&F.bag||t.id==='jacket'&&F.keys||t.id==='gift'&&F.gift||t.id==='booking'&&F.booking)continue;
  const important=t.id===target?.id;
  if(t.name&&!important&&t.id!=='leo'&&Math.hypot(t.x-player.x,t.y-player.y)>40)continue;
  const [mx,my]=markerPoint(t);drawNotice(mx,my,important?'#f5d697':'#dfdbc8');
 }
 if(room==='dining'&&person('leo').room==='dining'){const n=person('leo'),lx=Math.round(n.x),ly=Math.min(196,Math.round(n.y)+1);ctx.fillStyle='#28303cdd';ctx.fillRect(lx-8,ly,17,8);ctx.fillStyle='#f7e4bd';const letters=['100100100100111','111100110100111','111101101101111'];letters.forEach((glyph,i)=>{for(let p=0;p<15;p++)if(glyph[p]==='1')ctx.fillRect(lx-5+i*4+p%3,ly+1+Math.floor(p/3),1,1)})}}

 if(event&&!event.presented&&event.n?.room===room){const n=event.n;ctx.fillStyle='#fff0ce';ctx.fillRect(Math.round(n.x)-4,Math.round(n.y)-42,9,11);ctx.fillStyle='#c45e68';ctx.fillRect(Math.round(n.x),Math.round(n.y)-40,2,5);ctx.fillRect(Math.round(n.x),Math.round(n.y)-34,2,2)}}
}
function frame(t){const dt=last?Math.min((t-last)/1000,.05):0;last=t;update(dt);render();requestAnimationFrame(frame)}
function start(){started=true;setText('location',rooms[room].title);$('intro').hidden=true;remember('You arrived with a headache after asking for a small dinner and an early finish.');say(ARRIVAL)}
$('start').onclick=start;$('action').onclick=action;$('goNext').onclick=()=>goTo(nextTarget());$('menu').onclick=togglePause;$('resume').onclick=togglePause;$('restart').onclick=()=>location.reload();$('phone').onclick=$('requests').onclick=readPhone;
const keyMap={ArrowUp:'up',w:'up',ArrowDown:'down',s:'down',ArrowLeft:'left',a:'left',ArrowRight:'right',d:'right'};
window.addEventListener('keydown',e=>{if(['INPUT','TEXTAREA'].includes(e.target.tagName))return;const dir=keyMap[e.key];if(dir){e.preventDefault();if(paused)return;if(busy){const buttons=Array.from($('choices').children),i=buttons.indexOf(document.activeElement);if(buttons.length&&!e.repeat)buttons[i<0?0:(i+(['up','left'].includes(dir)?-1:1)+buttons.length)%buttons.length].focus();return}keys[dir]=true;navigation=null}if([' ','e','E','Enter'].includes(e.key)&&!e.repeat){e.preventDefault();action()}if(e.key==='Escape'&&!e.repeat){e.preventDefault();togglePause()}if(e.key==='p'&&!e.repeat&&!busy&&!event&&!paused)readPhone()});
window.addEventListener('keyup',e=>{if(keyMap[e.key])keys[keyMap[e.key]]=false});window.addEventListener('blur',()=>{keys={};last=0});document.addEventListener('visibilitychange',()=>{keys={};last=0});
for(const b of document.querySelectorAll('[data-dir]')){b.onpointerdown=e=>{e.preventDefault();if(busy||paused||event)return;b.setPointerCapture(e.pointerId);navigation=null;keys[b.dataset.dir]=true};b.onpointerup=b.onpointercancel=b.onlostpointercapture=()=>keys[b.dataset.dir]=false}
canvas.addEventListener('pointerdown',e=>{if(!started||busy||paused||event||ended)return;const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)*320/r.width,y=(e.clientY-r.top)*208/r.height;const marker=targets().find(t=>{if(t.to)return false;const [mx,my]=markerPoint(t);return Math.abs(x-mx)<6&&y>=my-2&&y<=my+11});if(marker){goTo(marker);return}const actor=targets().find(t=>t.name&&Math.abs(x-t.x)<14&&y>=t.y-39&&y<=t.y+2);if(actor){goTo(actor);return}const box=hitZones[room].find(([,bx,by,bw,bh])=>x>=bx&&x<=bx+bw&&y>=by&&y<=by+bh);if(box){const target=targets().find(t=>t.id===box[0]);if(target)goTo(target);return}const target=targets().map(t=>({...t,d:Math.hypot(x-t.x,y-t.y)})).sort((a,b)=>a.d-b.d)[0];if(target&&target.d<23)goTo(target)});
function loadImage(url){return new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=reject;im.src=url})}
const startButton=$('start');startButton.disabled=true;setText('start','Loading the restaurant…');
Promise.all([loadImage('rooms.png'),loadImage('cast-v5.png'),Promise.resolve(SPRITE_FRAMES)]).then(([maps,cast,frames])=>{art.rooms=maps;art.cast=cast;art.frames=frames;startButton.disabled=false;setText('start','Enter the restaurant ▸')}).catch(()=>{startButton.disabled=false;setText('start','Artwork didn’t load. Reload ▸');startButton.onclick=()=>location.reload()});
requestAnimationFrame(frame);
