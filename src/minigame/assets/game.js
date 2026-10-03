(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const canvas = $('gameCanvas');
  const ctx = canvas.getContext('2d', { alpha: false });
  const wrap = $('canvasWrap');
  const BASE_SPEED=320, MAX_SPEED=760, GRAVITY=2100, JUMP_SPEED=760;
  const STAGE_LENGTHS=[180,230,280,330,380];
  const STAGE_ENDS=STAGE_LENGTHS.map((_,i)=>STAGE_LENGTHS.slice(0,i+1).reduce((a,b)=>a+b,0));
  const sprites={};
  const scenery = window.MACH_GAME_BACKGROUND?.create();
  let assetsReady=false;
  const spriteLoad=Promise.all(Object.entries(window.GAME_SPRITES).map(([key,url])=>new Promise((resolve,reject)=>{
    const image=new Image();image.onload=()=>{sprites[key]=image;resolve()};image.onerror=()=>reject(new Error(`Không tải được sprite ${key}`));image.src=url;
  })));
  const stageNames = [
    'Nông nghiệp truyền thống',
    'Cơ giới hóa & công nghiệp',
    'Tự động hóa công nghiệp',
    'Kinh tế số & CMCN 4.0',
    'Kỷ nguyên vươn mình'
  ];
  const palettes = [
    {sky:'#cce9d4',sun:'#ffe1a0',back:'#a9d1a9',mid:'#85bd8b',ground:'#5d965e',soil:'#d5b883',accent:'#f3d176'},
    {sky:'#d9e5d7',sun:'#ffe0aa',back:'#b9c9b2',mid:'#899e91',ground:'#6e947a',soil:'#b9ae91',accent:'#e7a65d'},
    {sky:'#d5e6e9',sun:'#f4d0ac',back:'#a9c6cc',mid:'#719da8',ground:'#4f8791',soil:'#a9bec0',accent:'#eea46b'},
    {sky:'#cfdff0',sun:'#f9d6a9',back:'#adcae7',mid:'#80abc9',ground:'#508aa2',soil:'#a0b9c6',accent:'#97e0e7'},
    {sky:'#d9e6ef',sun:'#ffcf9a',back:'#a8c3d8',mid:'#789ab8',ground:'#517c9d',soil:'#a3b5bb',accent:'#f2b877'}
  ];
  const questions = [
    [
      {q:'Nông nghiệp truyền thống chủ yếu dựa vào nguồn năng lượng nào?',a:['Sức người và sức kéo động vật','Động cơ đốt trong','Điện toán đám mây','Dây chuyền robot'],correct:0,explain:'Giai đoạn này sử dụng sức lao động cơ bắp và sức kéo của trâu, bò, ngựa.'},
      {q:'Công cụ lao động tiêu biểu của nông nghiệp truyền thống là gì?',a:['Thuật toán AI','Cày, cuốc, liềm','Máy CNC','Vi xử lý'],correct:1,explain:'Cày, cuốc, liềm là các công cụ cầm tay thô sơ bằng sắt và gỗ.'},
      {q:'Kiến thức của người lao động thời kỳ này chủ yếu đến từ đâu?',a:['Dữ liệu lớn','Kinh nghiệm dân gian truyền qua nhiều thế hệ','Mạng Internet','Robot công nghiệp'],correct:1,explain:'Người lao động chủ yếu dựa vào kinh nghiệm dân gian được truyền lại.'},
      {q:'Đặc điểm của nền sản xuất nông nghiệp truyền thống là gì?',a:['Sản xuất quy mô toàn cầu','Tự cung tự cấp, quy mô nông hộ','Nền tảng số xuyên biên giới','Tự động hóa hoàn toàn'],correct:1,explain:'Sản xuất nhỏ, phân tán, tự cung tự cấp là nét đặc trưng của giai đoạn này.'}
    ],
    [
      {q:'Điều gì thay thế dần lao động thủ công trong giai đoạn cơ giới hóa?',a:['Máy móc cơ khí','Dữ liệu số','Hệ thống AI','Sức kéo động vật'],correct:0,explain:'Máy móc cơ khí thay thế nhiều thao tác thủ công và thúc đẩy đại công nghiệp.'},
      {q:'Phát minh nào gắn với bước nhảy của Cách mạng công nghiệp lần thứ nhất?',a:['Điện toán đám mây','Máy hơi nước','Internet vạn vật','Công nghệ bán dẫn'],correct:1,explain:'Máy hơi nước là thành tựu tiêu biểu của Cách mạng công nghiệp lần thứ nhất.'},
      {q:'Lực lượng lao động nào hình thành rõ nét trong đại công nghiệp?',a:['Công nhân công nghiệp','Nông hộ tự cung tự cấp','Người săn bắt hái lượm','Nhà phát triển AI'],correct:0,explain:'Sản xuất tập trung tạo ra đội ngũ công nhân có kỹ năng vận hành máy và kỷ luật lao động.'},
      {q:'Lực lượng sản xuất trong giai đoạn cơ giới hóa bắt đầu mang tính gì?',a:['Khép kín trong từng nông hộ','Xã hội hóa cao','Hoàn toàn phi vật chất','Không cần người lao động'],correct:1,explain:'Đại công nghiệp đưa nhiều người vào quá trình sản xuất chung, làm tăng tính xã hội hóa.'}
    ],
    [
      {q:'Công cụ tiêu biểu của giai đoạn tự động hóa công nghiệp là gì?',a:['Cày và liềm','Dây chuyền tự động và robot công nghiệp','Sức kéo trâu bò','Chỉ có ứng dụng di động'],correct:1,explain:'Dây chuyền tự động và robot công nghiệp là công cụ đặc trưng.'},
      {q:'Nền tảng kỹ thuật nào thúc đẩy tự động hóa giữa thế kỷ XX?',a:['Điện tử, máy tính và vi xử lý','Máy hơi nước đơn thuần','Công cụ cầm tay','Sức kéo động vật'],correct:0,explain:'Điện tử, máy tính và vi xử lý tạo bước nhảy trong tự động hóa.'},
      {q:'Nhóm lao động nào tăng nhanh khi sản xuất được tự động hóa?',a:['Kỹ sư và kỹ thuật viên','Chỉ lao động cơ bắp','Chỉ nông dân tự cung tự cấp','Người vận chuyển bằng sức kéo'],correct:0,explain:'Tỷ trọng lao động trí tuệ, kỹ sư và kỹ thuật viên tăng nhanh.'},
      {q:'Máy móc tự động bắt đầu đảm nhận thêm loại thao tác nào?',a:['Thao tác trí óc đơn giản, lặp lại','Mọi sáng tạo của con người','Chỉ sức kéo trên đồng ruộng','Không có thao tác nào mới'],correct:0,explain:'Máy móc bắt đầu thực hiện một phần thao tác trí óc đơn giản và lặp lại.'}
    ],
    [
      {q:'Tư liệu sản xuất đặc biệt quan trọng trong kinh tế số là gì?',a:['Dữ liệu và tri thức số','Chỉ sức kéo động vật','Cày gỗ','Máy hơi nước'],correct:0,explain:'Dữ liệu và tri thức số trở thành đầu vào then chốt của nền kinh tế tri thức.'},
      {q:'Công nghệ nào gắn với Cách mạng công nghiệp 4.0?',a:['AI, Big Data và IoT','Chỉ công cụ bằng sắt','Chỉ máy hơi nước','Chỉ sức người'],correct:0,explain:'AI, dữ liệu lớn và Internet vạn vật là những công nghệ tiêu biểu.'},
      {q:'Người lao động trong kinh tế số cần nổi bật ở năng lực nào?',a:['Kỹ năng số, sáng tạo và thích ứng','Chỉ sức khỏe thể chất','Chỉ kinh nghiệm truyền miệng','Không cần học công nghệ mới'],correct:0,explain:'Tri thức khoa học, kỹ năng số, sáng tạo và khả năng thích ứng trở nên quan trọng.'},
      {q:'Kinh tế số đặt ra yêu cầu nào đối với quan hệ sở hữu?',a:['Pháp lý hóa tài sản và dữ liệu số','Quay về tự cung tự cấp','Bỏ mọi quan hệ phân phối','Không cần quyền sở hữu trí tuệ'],correct:0,explain:'Các hình thức sở hữu tài sản số, dữ liệu và quyền sở hữu trí tuệ cần được công nhận.'}
    ],
    [
      {q:'Để lực lượng sản xuất mới phát triển, quan hệ sản xuất cần như thế nào?',a:['Phù hợp với trình độ lực lượng sản xuất','Cố định mãi mãi','Vượt trước vô căn cứ','Chỉ thay đổi công cụ lao động'],correct:0,explain:'Quan hệ sản xuất phù hợp sẽ thúc đẩy lực lượng sản xuất phát triển.'},
      {q:'Ba mặt của quan hệ sản xuất gồm những gì?',a:['Sở hữu, tổ chức quản lý, phân phối','Đất, nước, không khí','AI, IoT, Big Data','Nông nghiệp, công nghiệp, dịch vụ'],correct:0,explain:'Ba mặt là quan hệ sở hữu tư liệu sản xuất, tổ chức quản lý và phân phối sản phẩm.'},
      {q:'Cơ chế nào được đề xuất để thử nghiệm mô hình kinh doanh công nghệ mới?',a:['Sandbox linh hoạt','Cơ chế xin – cho','Đóng cửa mọi thị trường','Quay lại lao động thủ công'],correct:0,explain:'Cơ chế thử nghiệm linh hoạt giúp các mô hình công nghệ mới có không gian phát triển.'},
      {q:'Bài học phương pháp luận quan trọng khi điều chỉnh quan hệ sản xuất là gì?',a:['Xuất phát từ trình độ thực tế của lực lượng sản xuất','Chủ quan duy ý chí','Trì trệ, bảo thủ','Chỉ chạy theo công nghệ'],correct:0,explain:'Việc điều chỉnh quan hệ sản xuất phải dựa trên trình độ thực tế của lực lượng sản xuất.'}
    ]
  ];

  questions.forEach((list,i)=>list.push(...window.GAME_EXTRA_QUESTIONS[i],...window.GAME_DOCUMENT_QUESTIONS[i]));
  const bosses = [
    {name:'Golem Rơm',move:'Bão rơm',intro:'Người gác cánh đồng đang chặn đường. Vận dụng kiến thức về sản xuất thủ công để vượt qua.',lesson:'Từ sức người và sức kéo động vật, sự cải tiến công cụ mở đường cho cơ giới hóa.'},
    {name:'Cỗ Máy Hơi Nước',move:'Luồng hơi áp suất',intro:'Cỗ máy khổng lồ đã thức giấc. Làm chủ kiến thức về cơ giới hóa để mở cánh cửa tự động hóa.',lesson:'Máy móc cơ khí và sản xuất tập trung tạo bước nhảy từ tiểu nông sang đại công nghiệp.'},
    {name:'Robot Dây Chuyền',move:'Cánh tay thép',intro:'Robot bảo vệ nhà máy đang khóa lối ra. Dùng kiến thức về tự động hóa để vô hiệu hóa nó.',lesson:'Khoa học trở thành lực lượng sản xuất trực tiếp; lao động trí tuệ ngày càng quan trọng.'},
    {name:'Vệ Binh Dữ Liệu',move:'Xung dữ liệu',intro:'Vệ binh số đang bảo vệ cổng mạng. Hiểu AI, dữ liệu và kỹ năng số để bước vào kỷ nguyên mới.',lesson:'Dữ liệu và tri thức số trở thành đầu vào quan trọng, đòi hỏi hình thức sở hữu và quản trị mới.'},
    {name:'Người Gác Điểm Nghẽn',move:'Lá chắn trì trệ',intro:'Cửa ải cuối cùng đã xuất hiện. Kết hợp kiến thức về lực lượng sản xuất và quan hệ sản xuất để khai thông con đường.',lesson:'Phát triển LLSX mới phải đi cùng hoàn thiện QHSX và thể chế phù hợp để khơi thông nguồn lực.'}
  ];
  const bossModes=['boss-intro','boss-question','boss-feedback','boss-victory'];
  const state = {
    mode:'ready', hearts:3, score:0, world:0, sceneWorld:0, clock:0, speed:BASE_SPEED, stage:0, runTime:0, immunity:0, pattern:0,
    player:{y:0,vy:0,duck:false}, obstacles:[], spawnIn:1.5,
    lastTime:0, questionDecks:[], lastQuestions:[null,null,null,null,null], activeQuestion:null,
    answered:false, quizContext:'collision', toastUntil:0, flash:0,
    boss:null, cleared:[false,false,false,false,false], resumeMode:null, effect:null
  };
  let W=1000, scale=1, dpr=1;
  const groundY=333;
  const motionPreference=window.matchMedia('(prefers-reduced-motion: reduce)');
  const FX_LIMIT=window.innerWidth<700?64:120;
  const effects={particles:[],landingAt:-1000,shake:null,transition:null,dustIn:0,win:false};
  // While the exhibit guide talks it holds the campaign still (holding) and may run a separate practice runner (practice).
  const guideHold={holding:false,practice:null};
  const guideConfig=window.MACH_GAME_CONFIG||null;
  // Cosmetic randomness is separate from obstacle and question generation.
  let fxSeed=7391;
  function fxRandom(){fxSeed=(Math.imul(fxSeed,1664525)+1013904223)>>>0;return fxSeed/4294967296}
  function animateElement(element,name){element.classList.remove(name);void element.offsetWidth;element.classList.add(name)}
  function resetEffects(){
    effects.particles=[];effects.landingAt=-1000;effects.shake=null;effects.transition=null;effects.dustIn=0;effects.win=false;
    hide('transitionBanner');$('celebration').replaceChildren();
    wrap.classList.remove('fx-collision');
    ['impactBorder','heartLoss','hearts','bossVictory'].forEach(id=>$(id).classList.remove('fx-hit','fx-break','fx-win'));
  }
  function burst(x,y,count,color,kind='spark'){
    if(motionPreference.matches)return;
    const limit=Math.min(count,FX_LIMIT-effects.particles.length);
    for(let i=0;i<limit;i++){
      const angle=kind==='dust'?Math.PI+fxRandom()*Math.PI:fxRandom()*Math.PI*2;
      const speed=kind==='dust'?35+fxRandom()*100:70+fxRandom()*190;
      const life=kind==='dust'?.35+fxRandom()*.3:.55+fxRandom()*.6;
      effects.particles.push({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,life,maxLife:life,size:kind==='dust'?3+fxRandom()*5:2+fxRandom()*4,color,kind,angle});
    }
  }
  function loseHeart(){
    animateElement($('heartLoss'),'fx-break');animateElement($('hearts'),'fx-hit');
    animateElement($('impactBorder'),'fx-hit');
  }
  function celebrate(){
    const host=$('celebration');host.replaceChildren();
    if(motionPreference.matches)return;
    const colors=['#b51f2a','#b78a46','#55734b','#fffaf0'];
    for(let i=0;i<(window.innerWidth<700?28:44);i++){
      const piece=document.createElement('i');piece.style.left=`${fxRandom()*100}%`;
      piece.style.background=colors[i%colors.length];piece.style.setProperty('--drift',`${(fxRandom()-.5)*150}px`);
      piece.style.setProperty('--spin',`${(fxRandom()-.5)*1000}deg`);piece.style.animationDelay=`${fxRandom()*.5}s`;
      piece.style.animationDuration=`${2.1+fxRandom()*1.2}s`;piece.addEventListener('animationend',()=>piece.remove(),{once:true});host.append(piece);
    }
  }
  function visualStage(){return effects.transition&&state.clock-effects.transition.started<675?effects.transition.from:state.stage}
  function updateEffects(dt){
    if(motionPreference.matches)effects.particles=[];
    if(effects.transition&&state.mode==='transition'&&(motionPreference.matches||state.clock-effects.transition.started>=1350)){
      effects.transition=null;hide('transitionBanner');state.mode='running';state.immunity=1;state.spawnIn=1.7;
      state.lastTime=performance.now();state.toastUntil=state.lastTime+1800;updateHud();
    }
    if(runnerActive()&&state.player.y===0&&!state.player.duck){
      effects.dustIn-=dt;
      if(effects.dustIn<=0){burst(playerBox().x+18,groundY,2,palettes[state.stage].soil,'dust');effects.dustIn=.12}
    }
    if(state.effect&&!state.effect.impacted&&state.clock-state.effect.started>=440){
      state.effect.impacted=true;
      const hit=state.effect.kind==='hit',x=hit?playerBox().x+25:bossX();
      burst(x,groundY-55,hit?18:26,hit?'#b51f2a':'#e7b955');
      if(!hit&&state.boss?.hp===0)burst(x,groundY-80,44,palettes[state.stage].accent,'fragment');
      effects.shake={started:state.clock,strength:hit?5:3};
    }
    for(const p of effects.particles){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=(p.kind==='dust'?90:240)*dt;p.angle+=dt*4}
    effects.particles=effects.particles.filter(p=>p.life>0);
  }

  function resize(){
    const rect=wrap.getBoundingClientRect();
    const cssW=rect.width, cssH=rect.height;
    if(cssW<=0||cssH<=0)return;
    dpr=Math.min(window.devicePixelRatio||1,cssW<700?1:1.5);
    if(canvas.width===Math.round(cssW*dpr)&&canvas.height===Math.round(cssH*dpr))return;
    canvas.width=Math.round(cssW*dpr);
    canvas.height=Math.round(cssH*dpr);
    scale=cssH/430;
    W=cssW/scale;
    scenery?.invalidate();
    ctx.setTransform(dpr*scale,0,0,dpr*scale,0,0);
    draw();
  }
  function show(id){$(id).classList.remove('hidden')}
  function hide(id){$(id).classList.add('hidden')}
  function padded(value){return String(Math.floor(value)).padStart(4,'0')}
  function shuffle(items){
    const result=[...items];
    for(let i=result.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}
    return result;
  }
  function nextQuestion(){
    const stage=state.stage;
    if(!state.questionDecks[stage].length){
      state.questionDecks[stage]=shuffle(questions[stage]);
      if(state.questionDecks[stage].at(-1)===state.lastQuestions[stage])state.questionDecks[stage].reverse();
    }
    const original=state.questionDecks[stage].pop();state.lastQuestions[stage]=original;
    const order=shuffle([0,1,2,3]);
    return {...original,a:order.map(i=>original.a[i]),correct:order.indexOf(original.correct)};
  }
  function runnerActive(){return state.mode==='running'}
  function sceneActive(){return runnerActive()||state.mode==='transition'||bossModes.includes(state.mode)}
  function canPause(){return sceneActive()}
  function bossActive(){return bossModes.includes(state.mode)||(state.mode==='paused'&&bossModes.includes(state.resumeMode))}
  function buttonLabel(id,text){$(id).firstChild.textContent=text+' '}
  let lastHudUpdate=-Infinity;
  function updateHud(force=true){
    const now=performance.now();
    if(!force&&now-lastHudUpdate<100)return;
    lastHudUpdate=now;
    $('stageNumber').textContent=`${String(state.stage+1).padStart(2,'0')} / 05`;
    $('stageName').textContent=stageNames[state.stage];
    $('score').textContent=padded(state.score);
    $('speed').textContent=`${(state.speed/BASE_SPEED).toFixed(1)}×`;
    $('hearts').textContent='♥ '.repeat(state.hearts)+'♡ '.repeat(3-state.hearts);
    $('hearts').setAttribute('aria-label',`Còn ${state.hearts} trái tim`);
    const length=STAGE_LENGTHS[state.stage],start=STAGE_ENDS[state.stage]-length;
    const progress=Math.min(length,Math.max(0,state.score-start));
    $('stageProgressFill').style.width=`${progress/length*100}%`;
    $('stageProgressText').textContent=`${Math.floor(progress)} / ${length}`;
    $('stageProgressLabel').textContent=state.cleared[state.stage]?'BOSS ĐÃ BỊ ĐÁNH BẠI':bossActive()?'CỬA ẢI CUỐI GIAI ĐOẠN':'ĐƯỜNG ĐẾN BOSS';
    $('pauseButton').disabled=!canPause()&&state.mode!=='paused';
    $('pauseButton').textContent=state.mode==='paused'?'▶':'Ⅱ';
    $('pauseButton').setAttribute('aria-label',state.mode==='paused'?'Tiếp tục':'Tạm dừng');
    $('jumpButton').disabled=!runnerActive()&&state.mode!=='ready';
    $('duckButton').disabled=!runnerActive();
    $('footerNote').textContent=state.mode==='quiz'?'ĐÃ DỪNG CHẠY · TRẢ LỜI ĐỂ TIẾP TỤC':state.mode==='transition'?'ĐANG QUA CỔNG · CHUẨN BỊ CHẶNG MỚI':bossActive()?'ĐÚNG: BOSS −1 HP · SAI: BỊ PHẢN CÔNG −1 ♥':'GIỮ NHẢY XA · THẢ NHẢY THẤP · ↓ HẠ NHANH / CÚI';
    wrap.closest('.game-panel').dataset.mode=state.mode;
    if(state.boss){
      $('bossName').textContent=bosses[state.stage].name;
      $('bossHealthText').textContent=`${state.boss.hp} / ${state.boss.maxHp} HP`;
      $('battleHealth').textContent=`BOSS · ${state.boss.hp} / ${state.boss.maxHp} HP`;
      $('bossHealthBar').setAttribute('aria-valuenow',state.boss.hp);
      [...$('bossHealthBar').children].forEach((segment,i)=>segment.classList.toggle('depleted',i>=state.boss.hp));
    }
  }
  function reset(){
    state.mode='ready';state.hearts=3;state.score=0;state.world=0;state.sceneWorld=0;state.clock=0;state.speed=BASE_SPEED;state.stage=0;state.runTime=0;state.immunity=0;state.pattern=0;
    state.player={y:0,vy:0,duck:false};state.obstacles=[];state.spawnIn=1.5;
    state.questionDecks=questions.map(shuffle);state.lastQuestions=[null,null,null,null,null];state.activeQuestion=null;state.answered=false;
    state.toastUntil=0;state.flash=0;state.boss=null;state.cleared=[false,false,false,false,false];state.resumeMode=null;state.effect=null;state.quizContext='collision';
    resetEffects();
    $('bossPanel').inert=false;$('quizOverlay').inert=false;wrap.classList.remove('boss-arena');
    ['quizOverlay','endOverlay','pauseOverlay','bossPanel','bossHud'].forEach(hide);
    show('startOverlay');updateHud();draw();
  }
  function start(){if(!assetsReady||guideHold.holding)return;hide('startOverlay');hide('endOverlay');state.mode='running';state.lastTime=performance.now();updateHud();}
  function jump(){
    if(guideHold.practice){practiceJump();return}
    if(guideHold.holding)return;
    if(state.mode==='ready'){start();return}
    if(!runnerActive()||state.player.y<0)return;
    state.player.duck=false;state.player.vy=-JUMP_SPEED;state.player.y=-1;
    burst(playerBox().x+25,groundY,10,palettes[state.stage].soil,'dust');
  }
  function duck(active,cause){
    if(guideHold.practice){practiceDuck(active,cause);return}
    // Releasing is always honoured so a key let go during the guide never leaves a duck stuck on.
    if(guideHold.holding){if(!active&&runnerActive())state.player.duck=false;return}
    if(runnerActive()){state.player.duck=active;if(active&&state.player.y<0)state.player.vy=Math.max(state.player.vy,600)}
  }
  function pause(){
    if(guideHold.holding)return;
    if(canPause()){
      state.resumeMode=state.mode;state.mode='paused';state.player.duck=false;
      $('bossPanel').inert=true;$('quizOverlay').inert=true;show('pauseOverlay');
      $('resumeButton').focus({preventScroll:true});
    }else if(state.mode==='paused'){
      hide('pauseOverlay');state.mode=state.resumeMode;state.resumeMode=null;state.lastTime=performance.now();$('bossPanel').inert=false;$('quizOverlay').inert=false;
    }
    updateHud();
  }
  function spawnObstacle(){
    const patterns=['hurdle','wide','double','duck-jump','jump-duck','drone','spike'];
    // Alternate input sequences are separated by at least one complete jump.
    const available=state.score<12?patterns.slice(0,3):patterns;
    let pattern=available[Math.floor(Math.random()*available.length)];
    if(pattern===state.pattern)pattern=available[(available.indexOf(pattern)+1)%available.length];
    state.pattern=pattern;
    const movement=state.speed*W/1000;
    let cursor=W+64;
    const add=(kind,w,h,gap=0)=>{w*=W/1000;state.obstacles.push({x:cursor,w,h,kind,phase:Math.random()*Math.PI*2});cursor+=w+gap};
    if(pattern==='wide')add('crate',110+Math.random()*12,38);
    else if(pattern==='double'){add('crate',36,32,42*W/1000);add('crate',36,32)}
    else if(pattern==='duck-jump'){add('air',68,34,movement*.4);add('crate',48,58)}
    else if(pattern==='jump-duck'){add('crate',48,58,movement*.86);add('air',68,34)}
    else if(pattern==='drone')add('drone',62,34);
    else if(pattern==='spike')add('spike',82,46);
    else add(state.stage>=2?'saw':'crate',50,56+Math.random()*12);
    state.spawnIn=(cursor-W)/movement+.82+Math.random()*.34;
    $('hazardHint').textContent={hurdle:'VẬT CẢN CAO · NHẢY',wide:'VẬT CẢN DÀI · GIỮ NHẢY',double:'CẶP VẬT CẢN · CANH NHỊP', 'duck-jump':'CÚI → NHẢY', 'jump-duck':'NHẢY → CÚI',drone:'DRONE ĐỔI ĐỘ CAO · CÚI',spike:'BẪY GAI · NHẢY'}[pattern];
  }
  function playerBox(){
    const ducked=state.player.duck&&state.player.y>=0;
    const w=Math.min(50,W*.07),h=ducked?29:72;
    return {x:W*.14,y:groundY+state.player.y-h,w,h};
  }
  function obstacleBox(o){
    const air=o.kind==='air'||o.kind==='drone';
    const y=air?groundY-(o.kind==='drone'?106+Math.sin(state.clock/410+o.phase)*24:78):groundY-o.h;
    if(o.kind==='spike'&&o.x-playerBox().x>state.speed*W/1000*.95)return {x:o.x,y:groundY,w:o.w,h:0};
    return {x:o.x+5,y:y+4,w:o.w-10,h:o.h-4};
  }
  function overlaps(a,b){return a.x+8<b.x+b.w&&a.x+a.w-8>b.x&&a.y+6<b.y+b.h&&a.y+a.h-4>b.y}
  function collision(){
    state.mode='quiz';
    animateElement($('impactBorder'),'fx-hit');
    animateElement(wrap,'fx-collision');
    $('quizStage').textContent=`GIAI ĐOẠN ${String(state.stage+1).padStart(2,'0')} / 05`;
    renderQuestion('collision');
    $('quizFeedback').textContent='Đã dừng chạy. Trả lời đúng để giữ trái tim!';
    $('quizFeedback').classList.remove('feedback-success');
    hide('continueButton');
    show('quizOverlay');updateHud();
    $('answers').querySelector('button')?.focus({preventScroll:true});
  }
  function renderQuestion(context){
    state.quizContext=context;state.activeQuestion=nextQuestion();state.answered=false;
    const isBoss=context!=='collision';
    const card=isBoss?$('bossQuestionArea'):$('quizOverlay').querySelector('.quiz-card');
    card.classList.toggle('long-question',state.activeQuestion.q.length>100||state.activeQuestion.a.some(answer=>answer.length>60));
    $(isBoss?'bossQuestion':'quizQuestion').textContent=state.activeQuestion.q;
    const answers=$(isBoss?'bossAnswers':'answers');answers.innerHTML='';
    state.activeQuestion.a.forEach((answer,i)=>{
      const button=document.createElement('button');button.type='button';button.className='answer';
      const letter=document.createElement('span');letter.className='answer-letter';letter.textContent='ABCD'[i];
      const label=document.createElement('span');label.textContent=answer;
      button.append(letter,label);button.addEventListener('click',()=>answerQuestion(i));answers.append(button);
    });
  }
  function answerQuestion(index){
    if(guideHold.holding||state.answered||!['quiz','boss-question'].includes(state.mode))return;
    state.answered=true;
    const q=state.activeQuestion,correct=index===q.correct;
    const isBoss=state.quizContext!=='collision';
    if(!correct){state.hearts=Math.max(0,state.hearts-1);state.flash=1;loseHeart();}
    [...$(isBoss?'bossAnswers':'answers').children].forEach((button,i)=>{
      button.disabled=true;
      if(i===q.correct)button.classList.add('correct','fx-correct');
      if(i===index&&!correct)button.classList.add('wrong','fx-wrong');
    });
    if(isBoss){
      state.mode='boss-feedback';
      const kind=correct?'strike':'hit';
      state.effect={kind,started:state.clock};
      if(correct){
        state.boss.hp=Math.max(0,state.boss.hp-1);
        if(state.boss.hp===0)state.boss.defeatAt=state.clock+440;
      }
      const message=correct?'Đánh trúng! Boss mất 1 HP. ':'Boss phản công! Bạn mất 1 trái tim. ';
      $('bossFeedback').textContent=message+q.explain;
      $('bossFeedback').classList.toggle('feedback-success',correct);
      buttonLabel('bossContinueButton',state.hearts===0?'XEM KẾT QUẢ':state.boss.hp===0?'NHẬN CHIẾN THẮNG':'CÂU TIẾP THEO');
      show('bossContinueButton');$('bossContinueButton').focus({preventScroll:true});
    }else{
      $('quizFeedback').textContent=(correct?'Chính xác! ':'Chưa đúng. Mất 1 trái tim. ')+q.explain;
      $('quizFeedback').classList.toggle('feedback-success',correct);
      buttonLabel('continueButton',state.hearts===0?'XEM KẾT QUẢ':'TIẾP TỤC CHẠY');
      show('continueButton');$('continueButton').focus({preventScroll:true});
    }
    updateHud();
  }
  function continueAfterQuiz(){
    if(guideHold.holding||state.mode!=='quiz'||!state.answered)return;
    hide('quizOverlay');
    if(state.hearts<=0){end(false);return;}
    if(state.score>=STAGE_ENDS[state.stage]){startBoss();return;}
    state.obstacles=[];state.spawnIn=1.65;state.player.duck=false;
    state.mode='running';state.immunity=1;state.lastTime=performance.now();updateHud();
    $('pauseButton').focus({preventScroll:true});
  }
  function startBoss(){
    state.mode='boss-intro';state.boss={hp:3,maxHp:3,turn:'attack'};state.effect=null;
    state.player={y:0,vy:0,duck:false};state.obstacles=[];state.toastUntil=0;
    $('bossIntroTitle').textContent=`${bosses[state.stage].name} xuất hiện!`;
    $('bossIntroText').textContent=bosses[state.stage].intro;
    hide('bossQuestionArea');hide('bossVictory');show('bossBrief');show('bossPanel');show('bossHud');
    wrap.classList.add('boss-arena');updateHud();
    $('stageToast').textContent=`Boss ${bosses[state.stage].name} xuất hiện. Hạ boss để qua giai đoạn.`;
    $('fightButton').focus({preventScroll:true});
  }
  function askBossQuestion(){
    state.mode='boss-question';state.boss.turn='attack';state.boss.turnStarted=state.clock;state.effect=null;
    hide('bossBrief');hide('bossVictory');show('bossQuestionArea');hide('bossContinueButton');
    $('battlePhase').textContent='ĐẤU KIẾN THỨC';
    $('battlePhase').classList.add('attack-phase');
    $('battleMove').textContent='Đúng: đánh boss −1 HP. Sai: boss phản công −1 tim.';
    $('bossFeedback').textContent='';
    $('bossFeedback').classList.remove('feedback-success');
    renderQuestion('boss');updateHud();
    $('bossAnswers').querySelector('button')?.focus({preventScroll:true});
  }
  function continueBoss(){
    if(guideHold.holding||state.mode!=='boss-feedback'||!state.answered)return;
    if(state.hearts===0){end(false);return;}
    if(state.boss.hp===0){
      state.cleared[state.stage]=true;state.mode='boss-victory';
      hide('bossQuestionArea');show('bossVictory');
      animateElement($('bossVictory'),'fx-win');
      $('bossVictoryTitle').textContent=`Đã vượt qua ${stageNames[state.stage]}!`;
      $('bossVictoryText').textContent=bosses[state.stage].lesson;
      buttonLabel('nextStageButton',state.stage===4?'HOÀN THÀNH HÀNH TRÌNH':`SANG GIAI ĐOẠN ${String(state.stage+2).padStart(2,'0')}`);
      updateHud();$('nextStageButton').focus({preventScroll:true});return;
    }
    askBossQuestion();
  }
  function advanceStage(){
    if(guideHold.holding||state.mode!=='boss-victory'||!state.cleared[state.stage])return;
    if(state.stage===4){end(true);return;}
    const from=state.stage;
    state.stage++;state.boss=null;state.effect=null;state.player={y:0,vy:0,duck:false};
    effects.particles=[];effects.shake=null;effects.transition={from,started:state.clock};
    state.obstacles=[];state.spawnIn=1.7;state.mode='transition';state.lastTime=performance.now();state.toastUntil=0;
    hide('bossPanel');hide('bossHud');wrap.classList.remove('boss-arena');
    $('stageToast').textContent=`Giai đoạn ${state.stage+1}: ${stageNames[state.stage]}`;
    $('transitionTitle').textContent=`${String(state.stage+1).padStart(2,'0')} · ${stageNames[state.stage]}`;show('transitionBanner');
    if(motionPreference.matches){effects.transition=null;hide('transitionBanner');state.mode='running';state.immunity=1}
    updateHud();$('pauseButton').focus({preventScroll:true});
  }
  function end(win){
    state.mode='ended';state.obstacles=[];
    effects.transition=null;effects.particles=[];effects.shake=null;effects.win=win;hide('transitionBanner');
    hide('bossPanel');hide('bossHud');hide('quizOverlay');wrap.classList.remove('boss-arena');
    $('endStamp').textContent=win?'ĐÃ ĐÁNH BẠI CẢ 5 BOSS':'HẾT TRÁI TIM';
    $('endTitle').textContent=win?'Bạn đã đến kỷ nguyên vươn mình!':'Hành trình tạm dừng tại đây.';
    $('endText').textContent=win?'Lực lượng sản xuất phát triển qua từng bước nhảy. Quan hệ sản xuất phù hợp sẽ mở đường cho bước tiến tiếp theo.':'Ôn lại nội dung và thử sức thêm một lần nữa nhé!';
    $('endScore').textContent=padded(state.score);
    show('endOverlay');updateHud();$('restartButton').focus({preventScroll:true});
    if(win)celebrate();
  }
  function update(dt,now){
    state.runTime+=dt;state.immunity=Math.max(0,state.immunity-dt);
    state.speed=Math.min(MAX_SPEED,BASE_SPEED+state.runTime*10+state.stage*40);
    const delta=state.speed*dt;
    const stageEnd=STAGE_ENDS[state.stage];
    state.world=Math.min(stageEnd*60,state.world+delta);state.score=state.world/60;
    if(state.score>=stageEnd&&state.mode==='running'){startBoss();return;}
    const airborne=state.player.y<0;
    state.player.vy+=GRAVITY*dt;state.player.y+=state.player.vy*dt;
    if(state.player.y>0){
      state.player.y=0;state.player.vy=0;
      if(airborne){effects.landingAt=state.clock;burst(playerBox().x+25,groundY,16,palettes[state.stage].soil,'dust')}
    }
    state.spawnIn-=dt;
    if(state.spawnIn<=0)spawnObstacle();
    for(const o of state.obstacles)o.x-=delta*W/1000;
    state.obstacles=state.obstacles.filter(o=>o.x+o.w>-20);
    if(state.mode==='running'&&state.immunity===0){
      const box=playerBox();
      for(const o of state.obstacles){if(overlaps(box,obstacleBox(o))){collision();break;}}
    }
    updateHud(false);
  }
  let lastDrawMode='';
  function frame(now){
    const dt=Math.min(Math.max(0,(now-state.lastTime)/1000),.035);
    state.lastTime=now;
    // Held by the guide: nothing in the campaign advances, only the practice runner (if any) moves.
    if(guideHold.holding){stepPractice(dt);if(guideHold.practice||lastDrawMode!=='held')draw();lastDrawMode='held';requestAnimationFrame(frame);return}
    if(sceneActive()){
      state.clock+=dt*1000;
      state.sceneWorld+=state.speed*dt*(state.mode==='transition'?.45:bossActive()?.35:1);
    }
    if(runnerActive()){
      if(dt>0)update(dt,now);
    }
    if(sceneActive()&&state.flash>0)state.flash=Math.max(0,state.flash-dt*2);
    if(sceneActive())updateEffects(dt);
    if(sceneActive()||lastDrawMode!==state.mode)draw();
    lastDrawMode=state.mode;requestAnimationFrame(frame);
  }

  function fill(color){ctx.fillStyle=color}
  function rect(x,y,w,h,color){fill(color);ctx.fillRect(x,y,w,h)}
  function line(x1,y1,x2,y2,color,width=1){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke()}
  function ellipse(x,y,rx,ry,color){fill(color);ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill()}
  function round(x,y,w,h,r,color){fill(color);ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill()}
  function background(){
    if(scenery){scenery.draw(ctx,{stage:visualStage(),width:W,height:430,groundY,world:state.sceneWorld,reduced:motionPreference.matches});return;}
    rect(0,0,W,430,'#f3e8d0');rect(0,groundY,W,97,'#b8aa8c');line(0,groundY,W,groundY,'#b51f2a',3);
  }
  function sprite(key,x,y,w,h,flip=false){
    const image=sprites[key];if(!image)return;
    ctx.save();if(flip){ctx.translate(x+w,y);ctx.scale(-1,1);ctx.drawImage(image,0,0,w,h)}else ctx.drawImage(image,x,y,w,h);ctx.restore();
  }
  function character(){
    const b=playerBox(),foot=groundY+state.player.y,ducked=state.player.duck&&state.player.y>=0;
    const stage=visualStage(),moving=runnerActive()||state.mode==='transition',step=Math.floor(state.sceneWorld/28)%2+1;
    const hit=state.effect?.kind==='hit'&&state.clock-state.effect.started>=440&&state.clock-state.effect.started<900;
    const person=stage===0?'adventurer':'female';
    const pose=hit?'hurt':ducked?'duck':state.player.y<0?'jump':moving?'walk'+step:'idle';
    ellipse(b.x+25,groundY+4,32,6,'#172a3240');
    ctx.save();
    const landing=Math.max(0,1-(state.clock-effects.landingAt)/180);
    if(landing>0&&!motionPreference.matches){ctx.translate(b.x+25,foot);ctx.scale(1+landing*.1,1-landing*.13);ctx.translate(-b.x-25,-foot)}
    if(state.immunity>0&&Math.floor(state.clock/100)%2===0)ctx.globalAlpha=.5;
    if(stage<2){
      const key=person+'_'+pose,image=sprites[key];
      if(image){const h=ducked?46:88,w=h*image.width/image.height;sprite(key,b.x+25-w/2,foot-h,w,h)}
    }else{
      const color=['','','green','blue','red'][stage];
      const key='robot_'+color+'_'+(hit?'Hurt':state.player.y<0?'Jump':'Drive'+step);
      const image=sprites[key];if(image){const h=ducked?40:74,w=h*image.width/image.height;sprite(key,b.x+25-w/2,foot-h,w,h)}
    }
    ctx.globalAlpha=1;
    ctx.restore();
    // Red thread continues as the runner's energy trail.
    for(let i=1;i<=4;i++)ellipse(b.x-i*14,foot-17,3-i*.45,2,'#b51f2a'+['','99','66','44','22'][i]);
  }

  function obstacle(o){
    const b=obstacleBox(o),x=o.x,y=b.y-4;
    const step=Math.floor(state.clock/140)%2?'b':'a';
    if(o.kind==='air'||o.kind==='drone'){
      ellipse(x+o.w/2,groundY+4,o.w/2,4,'#172a3225');
      sprite('fly_'+step,x,y,o.w,o.h);return;
    }
    if(o.kind==='spike'){
      const warning=o.x-playerBox().x>state.speed*W/1000*.95;
      if(warning){
        round(x,groundY-7,o.w,7,2,'#b51f2a');
        fill('#b51f2a');ctx.font='700 18px Be Vietnam Pro';ctx.textAlign='center';ctx.fillText('!',x+o.w/2,groundY-19);ctx.textAlign='start';
      }else sprite('spikes',x,groundY-o.h,o.w,o.h);
      return;
    }
    ellipse(x+o.w/2,groundY+3,o.w/2,4,'#172a3230');
    sprite(o.kind==='saw'?'saw_'+step:state.stage<2?'block_planks':'block_strong_danger',x,y,o.w,o.h);
  }

  function bossX(){return W*.78}
  function drawBoss(){
    const x=bossX(),effect=state.effect,t=effect?(state.clock-effect.started)/900:1;
    const impact=effect?.kind==='strike'&&t>.49&&t<1;
    const shake=impact&&!motionPreference.matches?Math.sin(t*65)*9*(1-t):0;
    const size=state.stage===0?148:165;
    ellipse(x,groundY+7,86,11,'#172a3240');
    ctx.save();ctx.translate(shake,Math.sin(state.clock/340)*4);
    const dissolve=state.boss.hp===0?Math.max(0,Math.min(1,(state.clock-state.boss.defeatAt)/750)):0;
    ctx.globalAlpha=1-dissolve;
    const glow=ctx.createRadialGradient(x,groundY-80,10,x,groundY-80,140);
    glow.addColorStop(0,palettes[state.stage].accent+'66');glow.addColorStop(1,palettes[state.stage].accent+'00');
    ellipse(x,groundY-80,140,140,glow);
    const step=Math.floor(state.clock/180)%2+1;
    const key=state.stage===0?'block_idle':'robot_'+['','yellow','green','blue','red'][state.stage]+'_Drive'+step;
    if(impact&&t<.7&&!motionPreference.matches)ctx.filter='brightness(1.8)';
    sprite(key,x-size/2,groundY-size,size,size,state.stage>0);
    ctx.restore();
    if(state.boss.hp===0&&dissolve<1&&!motionPreference.matches)for(let i=0;i<9;i++){const a=i*.7+state.clock/700;ellipse(x+Math.cos(a)*(60+dissolve*60),groundY-85+Math.sin(a)*(60+dissolve*60),3,3,'#b51f2a')}
  }

  function drawBattleEffect(){
    const px=playerBox().x+30,bx=bossX();
    if(state.mode==='boss-question'){
      const cycle=((state.clock-state.boss.turnStarted)%2200)/2200;
      const pulse=15+Math.sin(cycle*Math.PI*2)*4;
      ellipse(px,groundY-34,pulse,pulse,'#78e4d344');ellipse(px,groundY-34,7,7,'#78e4d3');
    }
    const effect=state.effect;if(!effect)return;
    const age=state.clock-effect.started,t=Math.min(1,age/950);if(t>=1)return;
    const fromBoss=effect.kind==='hit';
    const travel=Math.min(1,age/440),target=fromBoss?px:bx;
    const x=fromBoss?bx+(px-bx)*travel:px+(bx-px)*travel;
    const y=groundY-55,color=fromBoss?'#b51f2a':'#e7b955';
    if(age<440){
      line(x+(fromBoss?45:-45),y,x,y,color+'88',6);ellipse(x,y,15,15,color+'33');ellipse(x,y,8,8,color);ellipse(x,y,3,3,'#fffaf0');
    }else{
      const spread=(age-440)/510;
      if(!motionPreference.matches){ctx.save();ctx.globalAlpha=1-spread;ctx.strokeStyle=color;ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(target,y,12+spread*50,12+spread*50,0,0,Math.PI*2);ctx.stroke();ctx.restore()}
      const text={hit:'−1 ♥',strike:'−1 HP'}[effect.kind];
      fill(effect.kind==='hit'?'#a93b2e':'#235a4a');ctx.font='800 17px Be Vietnam Pro, Arial, sans-serif';ctx.textAlign='center';
      ctx.fillText(text,target,groundY-135-spread*22);ctx.textAlign='start';
    }
  }
  function drawSpeed(){
    if(motionPreference.matches||!(['running','quiz'].includes(state.mode)||(state.mode==='paused'&&state.resumeMode==='running')))return;
    const intensity=Math.max(0,Math.min(1,(state.speed-BASE_SPEED)/(MAX_SPEED-BASE_SPEED)));
    const b=playerBox(),y=groundY+state.player.y-25,length=Math.min(W*.25,60+intensity*100);
    const trail=ctx.createLinearGradient(b.x-length,y,b.x+12,y);trail.addColorStop(0,'#b51f2a00');trail.addColorStop(1,`rgba(181,31,42,${.1+intensity*.28})`);
    round(b.x-length,y-4,length,8,4,trail);
    ctx.save();ctx.globalAlpha=intensity*.25;
    for(let i=0;i<12;i++){
      const x=((i*137-state.clock*(.2+intensity*.5))%W+W)%W,wy=75+(i*47)%235;
      line(x,wy,x+20+intensity*55,wy,i%3?'#fffaf0':'#b51f2a',i%2?1:2);
    }
    ctx.restore();
  }
  function drawParticles(){
    ctx.save();
    for(const p of effects.particles){
      ctx.globalAlpha=Math.max(0,p.life/p.maxLife)*(p.kind==='dust'?.55:1);
      if(p.kind==='dust')ellipse(p.x,p.y,p.size,p.size*.6,p.color);
      else if(p.kind==='fragment'){ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);rect(-p.size/2,-p.size/2,p.size,p.size*1.5,p.color);ctx.restore()}
      else line(p.x,p.y,p.x-p.vx*.04,p.y-p.vy*.04,p.color,2);
    }
    ctx.restore();
  }
  function drawPortal(){
    if(!effects.transition)return;
    const p=Math.max(0,Math.min(1,(state.clock-effects.transition.started)/1350));
    const x=playerBox().x+25+(.5-p)*Math.min(W*.9,650),y=groundY-95;
    ctx.save();
    const glow=ctx.createRadialGradient(x,y,8,x,y,145);glow.addColorStop(0,'#fffaf0cc');glow.addColorStop(.3,'#f2b87766');glow.addColorStop(1,'#b51f2a00');ellipse(x,y,145,160,glow);
    for(let i=0;i<3;i++){
      ctx.strokeStyle=['#b51f2a','#f2b877','#fffaf0'][i];ctx.lineWidth=5-i;
      ctx.beginPath();ctx.ellipse(x,y,32+i*8,92+i*8,0,0,Math.PI*2);ctx.stroke();
    }
    for(let i=0;i<14;i++){const a=i*Math.PI/7+state.clock/380;ellipse(x+Math.cos(a)*44,y+Math.sin(a)*103,2.5,2.5,i%2?'#b51f2a':'#fffaf0')}
    const wash=Math.max(0,1-Math.abs(p-.5)*6);rect(0,0,W,430,`rgba(255,250,240,${wash*.68})`);
    ctx.restore();
  }
  function draw(){
    if(guideHold.practice){drawPractice();return}
    ctx.clearRect(0,0,W,430);ctx.save();
    const shakeAge=effects.shake?state.clock-effects.shake.started:500;
    if(shakeAge<220&&!motionPreference.matches){const amount=effects.shake.strength*(1-shakeAge/220);ctx.translate(Math.sin(shakeAge*.1)*amount,Math.cos(shakeAge*.13)*amount*.4)}
    background();drawSpeed();
    for(const o of state.obstacles)obstacle(o);
    character();
    if(state.boss){drawBoss();drawBattleEffect();}
    drawParticles();drawPortal();ctx.restore();
    if(state.toastUntil>performance.now()&&state.mode==='running'){
      const text=`GIAI ĐOẠN ${String(state.stage+1).padStart(2,'0')}  /  ${stageNames[state.stage].toUpperCase()}`;
      ctx.font='700 14px Be Vietnam Pro, Arial, sans-serif';const tw=ctx.measureText(text).width;
      round(Math.max(12,(W-tw-38)/2),45,Math.min(W-24,tw+38),42,10,'#ffffffed');
      fill('#29483d');ctx.textAlign='center';ctx.fillText(text,W/2,72);ctx.textAlign='start';
    }
    if(state.flash>0)rect(0,0,W,430,`rgba(235,92,72,${state.flash*.14})`);
  }

  // ---- Exhibit guide bridge ----------------------------------------------------------------------------------------
  // The only door the iframe guide gets into the game: hold the campaign still, run a separate practice runner and read
  // a few plain numbers. Nothing here reads answers or edits score, hearts, stage, boss HP, questions or the deck.
  function requestExit(){
    if(window.parent===window)return;
    if(guideConfig)window.parent.postMessage({type:'guide:exit',nonce:guideConfig.nonce},guideConfig.origin);
    else window.parent.postMessage({type:'mach-minigame-close'},'*');
  }
  function isGuideUi(target){return !!(target&&target.closest&&target.closest('[data-mach-guide-ui]'))}
  function isGuideControl(target){return !!(target&&target.closest&&target.closest('button,a[href],input,select,textarea,summary,[role="button"]'))}
  function practiceNotify(type){
    const p=guideHold.practice;
    if(!p||!p.listener)return;
    try{p.listener({type,kind:p.kind})}catch(error){console.warn('[guide] practice listener failed',error)}
  }
  function practiceJump(){
    const p=guideHold.practice;
    if(p.y<0)return;
    p.duck=false;p.vy=-JUMP_SPEED;p.y=-1;p.jumped=true;practiceNotify('jumped');
  }
  function practiceRelease(){const p=guideHold.practice;if(p&&p.y<0&&p.vy<-320)p.vy=-320}
  function practiceDuck(active,cause){
    const p=guideHold.practice;
    if(active){
      p.duck=true;if(p.y<0)p.vy=Math.max(p.vy,600);
      if(!p.duckAt){p.duckAt=performance.now();practiceNotify('duck-start')}
      return;
    }
    p.duck=false;
    if(!p.duckAt)return;
    const held=performance.now()-p.duckAt;p.duckAt=0;
    // A press that was cancelled, slid off the button or lasted a blink is not a finished duck.
    practiceNotify(cause!=='pointercancel'&&cause!=='pointerleave'&&held>=120?'duck-end':'duck-abort');
  }
  function stepPractice(dt){
    const p=guideHold.practice;
    if(!p)return;
    const airborne=p.y<0;
    p.vy+=GRAVITY*dt;p.y+=p.vy*dt;
    if(p.y>0){p.y=0;p.vy=0;if(airborne&&p.jumped){p.jumped=false;practiceNotify('landed')}}
  }
  function drawPractice(){
    const p=guideHold.practice;
    ctx.clearRect(0,0,W,430);ctx.save();
    background();
    const x=W*.14,ducked=p.duck&&p.y>=0,foot=groundY+p.y,stage=state.stage;
    ellipse(x+25,groundY+4,32,6,'#172a3240');
    if(stage<2){
      const key=(stage===0?'adventurer':'female')+'_'+(ducked?'duck':p.y<0?'jump':'idle'),image=sprites[key];
      if(image){const h=ducked?46:88,w=h*image.width/image.height;sprite(key,x+25-w/2,foot-h,w,h)}
    }else{
      const key='robot_'+['','','green','blue','red'][stage]+'_'+(p.y<0?'Jump':'Drive1'),image=sprites[key];
      if(image){const h=ducked?40:74,w=h*image.width/image.height;sprite(key,x+25-w/2,foot-h,w,h)}
    }
    for(let i=1;i<=4;i++)ellipse(x-i*14,foot-17,3-i*.45,2,'#b51f2a'+['','99','66','44','22'][i]);
    ctx.restore();
    ctx.save();ctx.font="700 12px 'IBM Plex Mono', monospace";
    const label='TẬP THAO TÁC',labelWidth=ctx.measureText(label).width;
    // Low on the arena, under the ground line, so a cue docked at the top never hides it.
    round(W/2-labelWidth/2-14,groundY+30,labelWidth+28,30,6,'#b51f2a');fill('#fffaf0');ctx.textAlign='center';ctx.fillText(label,W/2,groundY+50);ctx.restore();
  }
  function holdForGuide(){
    if(guideHold.holding)return;
    guideHold.holding=true;
    // A duck held when the guide opened would otherwise stay on once the guide is gone.
    state.player.duck=false;
  }
  function beginGuidePractice(kind,listener){
    if(!guideHold.holding||(kind!=='jump'&&kind!=='duck'))return false;
    endGuidePractice();
    guideHold.practice={kind,y:0,vy:0,duck:false,jumped:false,duckAt:0,listener:typeof listener==='function'?listener:null};
    wrap.closest('.game-panel').dataset.guidePractice=kind;
    // The touch buttons are the controls being practised; some browsers send no pointer events to disabled buttons.
    $('jumpButton').disabled=false;$('duckButton').disabled=false;
    draw();
    return true;
  }
  function endGuidePractice(){
    if(!guideHold.practice)return;
    guideHold.practice=null;
    delete wrap.closest('.game-panel').dataset.guidePractice;
    updateHud();
    draw();
  }
  function releaseGuidePause(){
    endGuidePractice();
    if(!guideHold.holding)return;
    guideHold.holding=false;
    // The next frame measures from now, so a running game resumes without a time jump; ready, paused and quiz stay as they were.
    state.lastTime=performance.now();
  }
  function guideSnapshot(){
    const p=guideHold.practice;
    return {
      mode:state.mode,hearts:state.hearts,stage:state.stage,score:state.score,world:state.world,runTime:state.runTime,
      bossHp:state.boss?state.boss.hp:null,obstacles:state.obstacles.length,decks:state.questionDecks.map(deck=>deck.length),
      playerDuck:state.player.duck,holding:guideHold.holding,practicing:p?p.kind:null
    };
  }
  Object.defineProperty(window,'__machGameBridge',{
    value:Object.freeze({pauseForGuide:holdForGuide,beginGuidePractice,endGuidePractice,releaseGuidePause,snapshot:guideSnapshot}),
    enumerable:false,configurable:false
  });
  window.addEventListener('pagehide',releaseGuidePause);

  $('startButton').addEventListener('click',start);
  $('restartButton').addEventListener('click',()=>{if(guideHold.holding)return;reset();start()});
  $('pauseButton').addEventListener('click',pause);
  $('resumeButton').addEventListener('click',pause);
  $('continueButton').addEventListener('click',continueAfterQuiz);
  $('fightButton').addEventListener('click',()=>{if(!guideHold.holding&&state.mode==='boss-intro')askBossQuestion()});
  $('bossContinueButton').addEventListener('click',continueBoss);
  $('nextStageButton').addEventListener('click',advanceStage);
  $('jumpButton').addEventListener('pointerdown',e=>{e.preventDefault();jump()});
  const releaseJump=()=>{if(guideHold.practice){practiceRelease();return}if(runnerActive()&&state.player.vy<-320)state.player.vy=-320};
  ['pointerup','pointercancel','pointerleave'].forEach(type=>$('jumpButton').addEventListener(type,releaseJump));
  const duckButton=$('duckButton');
  duckButton.addEventListener('pointerdown',e=>{e.preventDefault();duck(true)});
  ['pointerup','pointercancel','pointerleave'].forEach(type=>duckButton.addEventListener(type,e=>duck(false,e.type)));
  window.addEventListener('keydown',e=>{
    if(e.code==='Escape'&&window.parent!==window){e.preventDefault();requestExit();return;}
    // Keys aimed at the guide's own buttons keep their native behaviour (Space/Enter activate them). During a jump/duck practice the
    // card itself holds focus, so its bare surface lets the practised keys through; everything else stays with the guide.
    if(isGuideUi(e.target)&&!(guideHold.practice&&!isGuideControl(e.target)&&['Space','ArrowUp','ArrowDown'].includes(e.code)))return;
    if(['Space','ArrowUp','ArrowDown'].includes(e.code))e.preventDefault();
    if(e.repeat&&e.code!=='ArrowDown')return;
    if(e.code==='Space'||e.code==='ArrowUp')jump();
    if(e.code==='ArrowDown')duck(true);
    if(e.code==='KeyP'&&!e.repeat)pause();
    if(['quiz','boss-question'].includes(state.mode)&&!state.answered&&/^Digit[1-4]$/.test(e.code))answerQuestion(Number(e.code.slice(-1))-1);
    else if(state.mode==='quiz'&&state.answered&&e.code==='Enter'){e.preventDefault();continueAfterQuiz();}
    else if(state.mode==='boss-feedback'&&e.code==='Enter'){e.preventDefault();continueBoss();}
  });
  window.addEventListener('keyup',e=>{if(e.code==='ArrowDown')duck(false,'key');if(['Space','ArrowUp'].includes(e.code))releaseJump()});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&canPause()&&!guideHold.holding)pause()});
  window.addEventListener('resize',resize);
  new ResizeObserver(resize).observe(wrap);
  reset();resize();requestAnimationFrame(frame);
  $('startButton').disabled=true;
  spriteLoad.then(()=>{assetsReady=true;$('startButton').disabled=false;draw()}).catch(()=>{$('startButton').disabled=true;document.querySelector('.start-card p').textContent='Không tải được hình ảnh. Hãy quay lại bài thuyết trình và mở game lần nữa.'});
})();
