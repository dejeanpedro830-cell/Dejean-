const $ = id => document.getElementById(id);
const pairBase = {"EUR/USD":1.0842,"GBP/USD":1.2715,"USD/JPY":151.32,"AUD/USD":0.6541,"USD/ZAR":18.42};
let values = [];
let deferredPrompt = null;
$("year").textContent = new Date().getFullYear();

function makeSeries(pair){
  let seed = pair.split("").reduce((a,c)=>a+c.charCodeAt(0),0) + Date.now()%997;
  const rand = () => { seed = (seed*9301+49297)%233280; return seed/233280; };
  let p = pairBase[pair];
  const series = [];
  for(let i=0;i<64;i++){ p += (rand()-.49)*(pair==="USD/JPY"?.42:.006); series.push(p); }
  return series;
}
function ema(data, period){
  const k=2/(period+1); let v=data[0];
  for(let i=1;i<data.length;i++) v=data[i]*k+v*(1-k);
  return v;
}
function rsi(data){
  let gains=0,losses=0;
  for(let i=data.length-14;i<data.length-1;i++){let d=data[i+1]-data[i];if(d>0)gains+=d;else losses-=d;}
  if(losses===0)return 100;
  return 100-(100/(1+gains/losses));
}
function drawChart(data){
  const canvas=$("chart"), rect=canvas.getBoundingClientRect(), dpr=window.devicePixelRatio||1;
  canvas.width=Math.max(300,rect.width)*dpr;canvas.height=240*dpr;
  const ctx=canvas.getContext("2d");ctx.scale(dpr,dpr);
  const w=canvas.width/dpr,h=240,pad=18,min=Math.min(...data),max=Math.max(...data),range=max-min||1;
  ctx.clearRect(0,0,w,h);ctx.strokeStyle="#293b53";ctx.lineWidth=1;
  for(let i=0;i<5;i++){let y=pad+i*(h-2*pad)/4;ctx.beginPath();ctx.moveTo(pad,y);ctx.lineTo(w-pad,y);ctx.stroke();}
  const pts=data.map((v,i)=>({x:pad+i*(w-2*pad)/(data.length-1),y:h-pad-(v-min)/range*(h-2*pad)}));
  const grad=ctx.createLinearGradient(0,pad,0,h-pad);grad.addColorStop(0,"rgba(100,169,255,.28)");grad.addColorStop(1,"rgba(100,169,255,0)");
  ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.lineTo(w-pad,h-pad);ctx.lineTo(pad,h-pad);ctx.closePath();ctx.fillStyle=grad;ctx.fill();
  ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.strokeStyle="#70b2ff";ctx.lineWidth=2;ctx.stroke();
}
function analyse(){
  const pair=$("pair").value, timeframe=$("timeframe").value;
  values=makeSeries(pair);
  const fast=ema(values,9),slow=ema(values,21),momentum=rsi(values);
  const recent=values.slice(-12),prior=values.slice(-24,-12);
  const macdUp=(recent.reduce((a,b)=>a+b,0)/recent.length)>(prior.reduce((a,b)=>a+b,0)/prior.length);
  const trendUp=fast>slow, rsiUp=momentum>=50&&momentum<70, rsiDown=momentum<50&&momentum>30;
  let score=(trendUp?1:-1)+(macdUp?1:-1)+(rsiUp?1:rsiDown?-1:0);
  let signal=score>=2?"BUY":score<=-2?"SELL":"WAIT";
  const cls=signal==="BUY"?"buy":signal==="SELL"?"sell":"wait";
  $("signal").textContent=signal;$("signal").className=cls;
  $("signalHint").textContent="Educational example · not a trade instruction";
  $("price").textContent=values.at(-1).toFixed(pair==="USD/JPY"||pair==="USD/ZAR"?3:5);
  $("pairName").textContent=pair;$("rsi").textContent=momentum.toFixed(1);
  $("trend").textContent=trendUp?"UPWARD":"DOWNWARD";
  $("emaState").textContent=trendUp?"Fast EMA above slow EMA":"Fast EMA below slow EMA";
  $("rsiState").textContent=momentum>=70?"High reading":momentum<=30?"Low reading":momentum>=50?"Above midpoint":"Below midpoint";
  $("macdState").textContent=macdUp?"Recent momentum higher":"Recent momentum lower";
  $("explainTitle").textContent=signal==="WAIT"?"Mixed sample indicators":signal==="BUY"?"Sample indicators lean upward":"Sample indicators lean downward";
  $("explain").textContent=`For ${pair} (${timeframe}), the generated sample has an ${trendUp?"upward":"downward"} EMA comparison, RSI of ${momentum.toFixed(1)}, and ${macdUp?"stronger":"weaker"} recent average movement. The combined educational label is ${signal}. This is not a forecast.`;
  drawChart(values);addHistory(pair,timeframe,signal,$("price").textContent);
}
function addHistory(pair,timeframe,signal,price){
  const tbody=$("history");if(tbody.querySelector(".empty"))tbody.innerHTML="";
  const tr=document.createElement("tr");
  [new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"}),pair,timeframe,signal,price].forEach((v,i)=>{const td=document.createElement("td");td.textContent=v;if(i===3)td.className=signal.toLowerCase();tr.appendChild(td);});
  tbody.prepend(tr);while(tbody.children.length>12)tbody.lastChild.remove();
}
$("analyse").addEventListener("click",analyse);
$("pair").addEventListener("change",()=>{$("pairName").textContent=$("pair").value;});
$("clear").addEventListener("click",()=>{$("history").innerHTML='<tr><td colspan="5" class="empty">No analyses yet.</td></tr>';});
window.addEventListener("resize",()=>{if(values.length)drawChart(values);});
analyse();

if("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("./sw.js").catch(()=>{});
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredPrompt=e;$("installBtn").hidden=false;});
$("installBtn").addEventListener("click",async()=>{if(!deferredPrompt)return;deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;$("installBtn").hidden=true;});
