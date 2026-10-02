(function(){
"use strict";
function hash(value){
 const text=JSON.stringify(value);let result=2166136261;
 for(let i=0;i<text.length;i++){result^=text.charCodeAt(i);result=Math.imul(result,16777619)}
 return(result>>>0).toString(16);
}
function decide({remoteExists,sameDevice,hasLocalData,localHash,metaHash,cloudHash,cloudTime=0,metaTime=0}){
 if(!remoteExists)return"upload";
 if(sameDevice&&localHash===metaHash&&cloudHash!==metaHash&&cloudTime>metaTime)return"download";
 if(!sameDevice&&!hasLocalData)return"download";
 if(sameDevice&&localHash===metaHash&&cloudHash===metaHash)return"noop";
 return"upload";
}
window.ECO_SYNC_CORE={hash,decide};
})();
