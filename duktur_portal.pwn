// DUKTUR RP portal köprüsü - filterscript (ek plugin gerekmez, a_samp HTTP() kullanır)
// Derle: pawncc duktur_portal.pwn  ->  filterscripts/ klasörüne .amx koy, server.cfg: filterscripts duktur_portal
#include <a_samp>
#define PORTAL "51.68.107.75:20315"   // http:// YAZMA. HTTPS desteklenmez.
#define GKEY   "duktur0029302"         // GAME_KEY ile aynı olmalı

forward Sync();
forward Poll();
forward OnHttp(index, response_code, data[]);

public OnFilterScriptInit(){ SetTimer("Sync",30000,true); SetTimer("Poll",5000,true); return 1; }

public Sync(){
  new url[160],nm[MAX_PLAYER_NAME];
  for(new i=0;i<MAX_PLAYERS;i++) if(IsPlayerConnected(i) && !IsPlayerNPC(i)){
    GetPlayerName(i,nm,sizeof nm);
    format(url,sizeof url,PORTAL"/api/game/sync?k="GKEY"&n=%s&c=%d&l=%d&t=30",nm,GetPlayerMoney(i),GetPlayerScore(i));
    HTTP(1,HTTP_GET,url,"","OnHttp");
  }
  return 1;
}
public Poll(){ HTTP(2,HTTP_GET,PORTAL"/api/game/cmds?k="GKEY,"","OnHttp"); return 1; }

public OnHttp(index, response_code, data[]){
  if(index!=2 || response_code!=200 || !data[0]) return 1;
  new line[96],t[8],n[MAX_PLAYER_NAME],nm[MAX_PLAYER_NAME],pos,len=strlen(data);
  while(pos<len){
    new e=strfind(data,"\n",false,pos); if(e==-1) e=len;
    strmid(line,data,pos,e,sizeof line); pos=e+1;
    new p1=strfind(line,"|"), p2=strfind(line,"|",false,p1+1);
    if(p1<1 || p2<1) continue;
    strmid(t,line,0,p1,sizeof t); strmid(n,line,p1+1,p2,sizeof n);
    new a=strval(line[p2+1]);
    for(new i=0;i<MAX_PLAYERS;i++) if(IsPlayerConnected(i)){
      GetPlayerName(i,nm,sizeof nm);
      if(!strcmp(nm,n,true)){ if(!strcmp(t,"give")) GivePlayerMoney(i,a); else GivePlayerMoney(i,-a); }
    }
  }
  return 1;
}
