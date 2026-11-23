// DUKTUR RP Oyuncu Portalı - bağımlılık yok (sadece Node 18+)
const http=require('http'),fs=require('fs'),path=require('path'),c=require('crypto');
const PORT=process.env.PORT||3000,KEY=process.env.GAME_KEY||'duktur0029302',SECRET=process.env.SECRET||'duktur0029302';
const F=path.join(__dirname,'data.json');
let db={users:{},market:[],tickets:[],cmds:[],nid:1};
try{db=JSON.parse(fs.readFileSync(F))}catch{}
const save=()=>fs.writeFileSync(F,JSON.stringify(db));
const hash=(p,s)=>c.scryptSync(p,s,32).toString('hex');
const hm=b=>c.createHmac('sha256',SECRET).update(b).digest('hex');
const sign=n=>{const b=n+'.'+(Date.now()+6048e5);return b+'.'+hm(b)};
const auth=t=>{const[p,e,s]=(t||'').split('.');if(!s||hm(p+'.'+e)!==s||Date.now()>+e)throw Error('Oturum geçersiz');return db.users[p]};
const online=u=>Date.now()-u.last<90000;
const int=v=>{v=Math.floor(Number(v));if(!(v>0&&v<1e9))throw Error('Geçersiz miktar');return v};
const str=(v,m)=>String(v||'').trim().slice(0,m);
const tx=(u,t,a)=>{u.tx.unshift({t,a,d:Date.now()});u.tx=u.tx.slice(0,50)};
const pub=u=>({name:u.name,cash:u.cash,bank:u.bank,level:u.level,playtime:u.playtime,online:online(u),char:u.char,tx:u.tx,tickets:db.tickets.filter(x=>x.by===u.name)});
const R={
'POST /api/register':(b)=>{const n=str(b.name,24);if(!/^[A-Za-z0-9_]{3,24}$/.test(n))throw Error('Oyun içi isim geçersiz');
 if(db.users[n])throw Error('Bu isim kayıtlı');if(String(b.pass||'').length<6)throw Error('Şifre en az 6 karakter');
 const salt=c.randomBytes(8).toString('hex');db.users[n]={name:n,salt,hash:hash(b.pass,salt),cash:0,bank:5000,level:1,playtime:0,last:0,char:null,tx:[]};save();return{token:sign(n)}},
'POST /api/login':(b)=>{const u=db.users[str(b.name,24)];if(!u||hash(String(b.pass),u.salt)!==u.hash)throw Error('Hatalı giriş');return{token:sign(u.name)}},
'GET /api/me':(b,u)=>pub(u),
'POST /api/character':(b,u)=>{if(u.char)throw Error('Karakter zaten var');const ch={ad:str(b.ad,20),soyad:str(b.soyad,20),yas:Math.min(99,Math.max(18,+b.yas||18)),cinsiyet:b.cinsiyet==='Kadın'?'Kadın':'Erkek',hikaye:str(b.hikaye,1000)};
 if(!ch.ad||!ch.soyad)throw Error('Ad ve soyad gerekli');u.char=ch;save();return pub(u)},
'POST /api/bank/withdraw':(b,u)=>{const a=int(b.amount);if(!online(u))throw Error('Oyunda olmalısın');if(u.bank<a)throw Error('Yetersiz bakiye');
 u.bank-=a;db.cmds.push({t:'give',n:u.name,a});tx(u,'Para çekme',-a);save();return pub(u)},
'POST /api/bank/deposit':(b,u)=>{const a=int(b.amount);if(!online(u))throw Error('Oyunda olmalısın');if(u.cash<a)throw Error('Yetersiz nakit');
 u.cash-=a;u.bank+=a;db.cmds.push({t:'take',n:u.name,a});tx(u,'Para yatırma',a);save();return pub(u)},
'POST /api/bank/transfer':(b,u)=>{const a=int(b.amount),t=db.users[str(b.to,24)];if(!t||t===u)throw Error('Alıcı bulunamadı');if(u.bank<a)throw Error('Yetersiz bakiye');
 u.bank-=a;t.bank+=a;tx(u,'Gönderilen: '+t.name,-a);tx(t,'Gelen: '+u.name,a);save();return pub(u)},
'GET /api/market':()=>db.market,
'POST /api/market':(b,u)=>{const l={id:db.nid++,seller:u.name,title:str(b.title,60),price:int(b.price),type:str(b.type,20)};if(!l.title)throw Error('Başlık gerekli');db.market.unshift(l);save();return l},
'POST /api/market/buy':(b,u)=>{const i=db.market.findIndex(x=>x.id==b.id);if(i<0)throw Error('İlan yok');const l=db.market[i],s=db.users[l.seller];
 if(l.seller===u.name)throw Error('Kendi ilanın');if(u.bank<l.price)throw Error('Yetersiz bakiye');u.bank-=l.price;s.bank+=l.price;
 tx(u,'Satın alma: '+l.title,-l.price);tx(s,'Satış: '+l.title,l.price);db.market.splice(i,1);save();return pub(u)},
'GET /api/top':()=>Object.values(db.users).map(u=>({name:u.name,level:u.level,money:u.bank+u.cash,playtime:u.playtime})).sort((a,b)=>b.money-a.money).slice(0,20),
'POST /api/ticket':(b,u)=>{const t={id:db.nid++,by:u.name,kategori:str(b.kategori,20),mesaj:str(b.mesaj,1000),durum:'Açık',d:Date.now()};if(!t.mesaj)throw Error('Mesaj gerekli');db.tickets.unshift(t);save();return pub(u)},
'GET /api/status':()=>({online:Object.values(db.users).filter(online).length})
};
const open=new Set(['POST /api/register','POST /api/login','GET /api/status','GET /api/top']);
http.createServer((q,s)=>{
 const url=new URL(q.url,'http://x'),k=q.method+' '+url.pathname;
 const out=(code,o,ct='application/json')=>{s.writeHead(code,{'Content-Type':ct});s.end(typeof o==='string'?o:JSON.stringify(o))};
 // Oyun sunucusu (SA-MP) uçları
 if(url.pathname==='/api/game/sync'||url.pathname==='/api/game/cmds'){
  if(url.searchParams.get('k')!==KEY)return out(403,'no','text/plain');
  if(url.pathname==='/api/game/sync'){const u=db.users[url.searchParams.get('n')];
   if(u){u.cash=+url.searchParams.get('c')||0;u.level=+url.searchParams.get('l')||1;u.playtime+=+url.searchParams.get('t')||0;u.last=Date.now();save()}return out(200,'ok','text/plain')}
  const l=db.cmds.map(x=>`${x.t}|${x.n}|${x.a}`).join('\n');db.cmds=[];save();return out(200,l,'text/plain')}
 if(q.method==='GET'&&!k.startsWith('GET /api'))return out(200,fs.readFileSync(path.join(__dirname,'index.html')),'text/html; charset=utf-8');
 let body='';q.on('data',d=>{body+=d;if(body.length>1e5)q.destroy()});
 q.on('end',()=>{try{const h=R[k];if(!h)return out(404,{e:'Yok'});
  const u=open.has(k)?null:auth((q.headers.authorization||'').replace('Bearer ',''));
  out(200,h(body?JSON.parse(body):{},u))}catch(e){out(400,{e:e.message})}});
}).listen(PORT,()=>console.log('DUKTUR RP portal :'+PORT));
