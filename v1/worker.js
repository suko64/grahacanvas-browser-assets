let assetBase;
const manifestSHA256="06106d78258d74a54244645a35dc1a0214327d50c5f931cf2dee257deb467591";
// Ported from core.py, preserving binary64 classification before rounding.
// Unreleased building blocks: no alternate ephemeris or network fallback.
const NAK=['Ashwini','Bharani','Krittika','Rohini','Mrigashira','Ardra','Punarvasu','Pushya','Ashlesha','Magha','Purva Phalguni','Uttara Phalguni','Hasta','Chitra','Swati','Vishakha','Anuradha','Jyeshtha','Mula','Purva Ashadha','Uttara Ashadha','Shravana','Dhanishtha','Shatabhisha','Purva Bhadrapada','Uttara Bhadrapada','Revati'];
const mod=(x,n)=>((x%n)+n)%n;
const bits=new DataView(new ArrayBuffer(8));
function classify(x){
 if(typeof x!=='number'||!Number.isFinite(x)||Math.abs(x)>1e9)throw Error('Invalid longitude');
 // Python's positive remainder can round negative subnormals to 360.
 let v=x%360;if(v<0)v+=360;if(v===360){bits.setFloat64(0,360);bits.setBigUint64(0,bits.getBigUint64(0)-1n);v=bits.getFloat64(0);}if(Object.is(v,-0))v=0;
 bits.setFloat64(0,v);const raw=bits.getBigUint64(0),exp=Number((raw>>52n)&2047n);let numerator=raw&((1n<<52n)-1n),shift;
 if(exp){numerator|=1n<<52n;shift=exp-1023-52;}else shift=-1074;
 let denominator=1n;if(shift>=0)numerator<<=BigInt(shift);else denominator<<=BigInt(-shift);
 const sector=Number(numerator*3n/(denominator*10n));
 return {longitude:v,sign:Math.floor(v/30),degree:v%30,nakshatra:NAK[Math.floor(sector/4)],pada:sector%4+1};
}
function meanNode(tt){const T=tt/36525;let x=125.04455501+(-6962890.5431*T+7.4722*T*T+.007702*T**3-.00005939*T**4)/3600;return ((x%360)+360)%360;}
function civilIST(date,time){
 if(typeof date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(date)||typeof time!=='string'||!/^\d{2}:\d{2}(:\d{2})?$/.test(time))throw Error('Use date and exact time');
 if(date<'1974-01-01'||date>'2024-12-31')throw Error('Not yet supported in the current GrahaCanvas beta');
 const [y,m,d]=date.split('-').map(Number),[h,min,s=0]=time.split(':').map(Number);const local=new Date(Date.UTC(y,m-1,d,h,min,s));
 if(local.getUTCFullYear()!==y||local.getUTCMonth()!==m-1||local.getUTCDate()!==d||h>23||min>59||s>59)throw Error('Invalid calendar/time');
 return new Date(local.getTime()-19800000).toISOString().replace('.000Z','Z');
}
function ascendant(gast,eps,latitude,longitude){
 if(!Number.isFinite(latitude)||!Number.isFinite(longitude)||Math.abs(latitude)>=66||Math.abs(longitude)>180)throw Error('Unsupported coordinates');
 const rad=Math.PI/180,theta=gast+longitude*rad,phi=latitude*rad;
 const zen=[Math.cos(phi)*Math.cos(theta),Math.cos(phi)*Math.sin(theta),Math.sin(phi)];
 let x=zen[1]*Math.cos(eps)+zen[2]*Math.sin(eps),y=-zen[0]*Math.cos(eps),z=-zen[0]*Math.sin(eps);
 const dot=-x*Math.sin(theta)+y*Math.cos(theta);if(Math.hypot(x,y)<1e-12||Math.abs(dot)<1e-12)throw Error('Degenerate horizon');if(dot<0){x=-x;y=-y;z=-z;}
 return mod(Math.atan2(y*Math.cos(eps)+z*Math.sin(eps),x)/rad,360);
}

// Unreleased DE440s browser reference implementation. No network calculation.
// Relativistic corrections adapted from Skyfield (MIT); see THIRD-PARTY.md.
const RAD=Math.PI/180, AU=149597870.7, LIGHT=173.14463267424034;
const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0),norm=a=>Math.hypot(...a);
const sub=(a,b)=>a.map((x,i)=>x-b[i]),add=(a,b)=>a.map((x,i)=>x+b[i]);
const unit=a=>a.map(x=>x/(norm(a)||1));
const TARGETS={sun:10,moon:301,mars:4,mercury:199,jupiter:5,venus:299,saturn:6};
function tdbCorrection(tt){let t=tt/36525;return .001657*Math.sin(628.3076*t+6.2401)+.000022*Math.sin(575.3385*t+4.2970)+.000014*Math.sin(1256.6152*t+6.1969)+.000005*Math.sin(606.9777*t+4.0212)+.000005*Math.sin(52.9691*t+.4444)+.000002*Math.sin(21.3299*t+5.5431)+.000010*t*Math.sin(628.3076*t+4.2490);}
function obliquity(tt){let t=tt/36525;return (84381.448-46.815*t-.00059*t*t+.001813*t**3)/3600*RAD;}
function precess(v,initial,final){
 let ra=Math.atan2(v[1],v[0]),dec=Math.atan2(v[2],Math.hypot(v[0],v[1])),T=initial/36525,t=(final-initial)/36525;
 let w=2306.2181+1.39656*T-.000139*T*T;
 let zeta=(w*t+(.30188-.000344*T)*t*t+.017998*t**3)/3600*RAD;
 let z=(w*t+(1.09468+.000066*T)*t*t+.018203*t**3)/3600*RAD;
 let theta=((2004.3109-.85330*T-.000217*T*T)*t-(.42665+.000217*T)*t*t-.041833*t**3)/3600*RAD;
 let A=Math.cos(dec)*Math.sin(ra+zeta),B=Math.cos(theta)*Math.cos(dec)*Math.cos(ra+zeta)-Math.sin(theta)*Math.sin(dec),C=Math.sin(theta)*Math.cos(dec)*Math.cos(ra+zeta)+Math.cos(theta)*Math.sin(dec);
 ra=Math.atan2(A,B)+z;dec=Math.asin(Math.max(-1,Math.min(1,C)));return [Math.cos(dec)*Math.cos(ra),Math.cos(dec)*Math.sin(ra),Math.sin(dec)];
}
class Engine {
 constructor(manifest,rotation){this.manifest=manifest;this.rotation=rotation;this.chunks=new Map();this.anchor=this.zeroAnchor();}
 install(chunk,buffer){if(buffer.byteLength!==chunk.bytes)throw Error('Invalid ephemeris byte length');this.chunks.set(chunk.url,{meta:chunk,data:new Float64Array(buffer)});}
 nutation(tt){
  let t=tt/36525;const args=[[485866.733,715922.633+1325*1296000,31.310,.064],[1287099.804,1292581.224+99*1296000,-.577,-.012],[335778.877,295263.137+1342*1296000,-13.257,.011],[1072261.307,1105601.328+1236*1296000,-6.891,.019],[450160.280,-482890.539-5*1296000,7.455,.008]].map(([a,b,c,d])=>mod((a+b*t+c*t*t+d*t**3)/3600,360)*RAD);
  let psi=0,eps=0;for(let i=this.manifest.nutation.length-1;i>=0;i--){let r=this.manifest.nutation[i],arg=dot(r.slice(0,5),args);psi+=(r[5]+r[6]*t)*Math.sin(arg);eps+=(r[7]+r[8]*t)*Math.cos(arg);}return [psi/36000000*RAD,eps/36000000*RAD];
 }
 zeroAnchor(){let tt=2435553.5-2451545,alpha=(23.25+.658/3600)*RAD-this.nutation(tt)[0],eps=obliquity(tt);return precess([Math.cos(alpha),Math.sin(alpha)*Math.cos(eps),Math.sin(alpha)*Math.sin(eps)],tt,0);}
 meanAyan(tt){let v=precess(this.anchor,0,tt),eps=obliquity(tt);return mod(Math.atan2(v[1]*Math.cos(eps)+v[2]*Math.sin(eps),v[0])/RAD,360);}
 ayan(tt){return mod(this.meanAyan(tt)+this.nutation(tt)[0]/RAD,360);}
 clock(utc){
  let ms=Date.parse(utc);if(!Number.isFinite(ms))throw Error('Invalid UTC');let u=(ms-Date.UTC(2000,0,1,12))/86400000,jd=u+2451545,tai;
  for(const [date,value] of this.manifest.leapSeconds)if(jd>=date)tai=value;
  let tt=u+(tai+32.184)/86400,table=this.rotation,x=2451545+tt,n=table.length/2;
  if(x<table[0]||x>table[(n-1)*2])throw Error('Earth rotation date unavailable');
  let lo=0,hi=n-1;while(hi-lo>1){let m=(lo+hi)>>1;if(table[m*2]>x)hi=m;else lo=m;}
  let dt=table[lo*2+1]+(table[hi*2+1]-table[lo*2+1])*(x-table[lo*2])/(table[hi*2]-table[lo*2]);
  // Preserve Python's full-JD rounding before subtracting the delta-T table.
  return {tt,ut:((2451545+tt)-2451545)-dt/86400};
 }
 shifted(clock,days){let ut=clock.ut+days,y=2000+(ut-14)/365.24217,u,dt;if(y<1986){u=y-1975;dt=45.45+1.067*u-u*u/260-u**3/718;}else if(y<2005){u=y-2000;dt=63.86+.3345*u-.060374*u*u+.0017275*u**3+.000651814*u**4+.00002373599*u**5;}else{u=y-2000;dt=62.92+.32217*u+.005589*u*u;}return {ut,tt:ut+dt/86400};}
 gast(clock){let ut=(2451545+clock.ut)-2451545,tt=(2451545+clock.tt)-2451545,T=ut/36525;
  // IAU 1982 GMST, seconds; IAU 1994 equation of equinoxes at TT.
  let f=(ut%1)*86400,gmst=mod((24110.54841-43200+8640184.812866*T+.093104*T*T-.0000062*T**3+f)/240,360)*RAD;
  let t=tt/36525,om=(450160.280-6962890.539*t+7.455*t*t+.008*t**3)/3600*RAD;
  return gmst+this.nutation(tt)[0]*Math.cos(obliquity(tt))+(.00264*Math.sin(om)+.000063*Math.sin(2*om))/3600*RAD;
 }
 segment(center,target,tdb,chunk){
  let s=chunk.meta.segments.find(s=>s.center===center&&s.target===target);if(!s)throw Error('Missing DE440s segment');
  let seconds=tdb*86400-s.initSeconds,rec=Math.floor(seconds/s.intervalSeconds),off=seconds-rec*s.intervalSeconds;
  if(rec===s.records&&off===0){rec--;off=s.intervalSeconds;}if(rec<0||rec>=s.records)throw Error('Ephemeris date outside chunk');
  let z=2*off/s.intervalSeconds-1,z2=2*z,p=[],v=[];
  for(let component=0;component<3;component++){
   let index=s.offsetBytes/8+(rec*3+component)*s.coefficients,w0=0,w1=0,prior=[];
   for(let i=0;i<s.coefficients-1;i++){let w2=w1;w1=w0;w0=chunk.data[index+i]+z2*w1-w2;prior.push(w1);}
   p.push((chunk.data[index+s.coefficients-1]+z*w0-w1)/AU);
   let dw0=0,dw1=0;for(const w of prior){let dw2=dw1;dw1=dw0;dw0=2*w+z2*dw1-dw2;}v.push((w0+z*dw0-dw1)*2*86400/s.intervalSeconds/AU);
  }return {p,v};
 }
 state(target,tdb,chunk){
  let path=target===399?[[0,3],[3,399]]:target===301?[[0,3],[3,301]]:target===199?[[0,1],[1,199]]:target===299?[[0,2],[2,299]]:[[0,target]];
  let p=[0,0,0],v=[0,0,0];for(let [a,b] of path){let s=this.segment(a,b,tdb,chunk);p=add(p,s.p);v=add(v,s.v);}return {p,v};
 }
 apparent(target,tt,chunk){
  // core adds the full JD before passing TT to Skyfield.
  tt=(2451545+tt)-2451545;let tdb=tt+tdbCorrection(tt)/86400,earth=this.state(399,tdb,chunk),body=this.state(target,tdb,chunk),pos=sub(body.p,earth.p),lt0=0,lt;
  for(let i=0;i<10;i++){lt=norm(pos)/LIGHT;if(Math.abs(lt-lt0)<1e-12)break;body=this.state(target,tdb-lt,chunk);pos=sub(body.p,earth.p);lt0=lt;if(i===9)throw Error('Light time did not converge');}
  for(const [id,mass] of [[10,1],[5,1047.3486],[6,3497.898]]){
   let now=this.state(id,tdb,chunk).p,dt=dot(unit(pos),sub(now,earth.p))/LIGHT;
   let closeTT=tt-Math.min(Math.max(dt,0),lt),def=this.state(id,closeTT+tdbCorrection(closeTT)/86400,chunk).p;
   let pe=sub(earth.p,def),pq=add(pos,pe),ph=unit(pos),qh=unit(pq),eh=unit(pe),ep=dot(eh,ph);
   if(Math.abs(ep)>.99999999999)continue;
   let fac=2*1.32712440017987e20/(299792458**2*norm(pe)*149597870700*mass)/(1+dot(qh,eh))*norm(pos),pdq=dot(ph,qh);
   pos=pos.map((x,i)=>x+fac*(pdq*eh[i]-ep*qh[i]));
  }
  let beta=norm(earth.v)/LIGHT,cosd=dot(pos,earth.v)/(lt*LIGHT*norm(earth.v)+1e-300),g=Math.sqrt(1-beta*beta),p=beta*cosd,q=(1+p/(1+g))*lt;
  return pos.map((x,i)=>(x*g+q*earth.v[i])/(1+p));
 }
 position(id,clock,chunk){let tt=(2451545+clock.tt)-2451545,tropical;
  if(id==='rahu'||id==='ketu')tropical=meanNode(clock.tt)+this.nutation(tt)[0]/RAD+(id==='ketu'?180:0);
  else {let v=precess(this.apparent(TARGETS[id],clock.tt,chunk),0,tt),eps=obliquity(tt);tropical=mod(Math.atan2(v[1]*Math.cos(eps)+v[2]*Math.sin(eps),v[0])/RAD+this.nutation(tt)[0]/RAD,360);}
  return tropical-this.ayan(tt);
 }
 calculate(record,placeId){
  if(!record||Object.keys(record).some(k=>!['date','time'].includes(k)))throw Error('Unexpected birth input');
  const utc=civilIST(record.date,record.time),place=this.manifest.places.find(p=>p.id===placeId);if(!place)throw Error('Not yet supported in the current GrahaCanvas beta');
  let year=Number(record.date.slice(0,4)),meta=this.manifest.chunks.find(c=>year>=c.startYear&&year<c.endYearExclusive),chunk=this.chunks.get(meta?.url);if(!chunk)throw Error('Required ephemeris not loaded');
  let clock=this.clock(utc),tt=(2451545+clock.tt)-2451545,ayan=this.ayan(tt),lagna=classify(ascendant(this.gast(clock),obliquity(tt)+this.nutation(tt)[1],place.latitude,place.longitude)-ayan),before=this.shifted(clock,-.02),after=this.shifted(clock,.02);
  let warnings=['PRIVATE VALIDATION â€” public launch gate remains closed.','Conventional Lahiri IAE1985/IAU1976-1980; mean nodes, not oscillating true nodes.','1973â€“2026 uses pinned IERS-derived Earth rotation; table freshness and predictions remain under review.'];
  let planets=[...Object.keys(TARGETS),'rahu','ketu'].map(id=>{let p=classify(this.position(id,clock,chunk)),speed=mod(this.position(id,after,chunk)-this.position(id,before,chunk)+180,360)-180;speed/=.04;const boundaryDistanceDegrees=Math.min(p.longitude%(10/3),(10/3)-p.longitude%(10/3));if(boundaryDistanceDegrees<1/60)warnings.push(id+': within experimental one-arcminute uncertainty of a pada boundary');return {...p,id,house:mod(p.sign-lagna.sign,12)+1,speedDegreesPerDay:speed,retrograde:speed<0,motionStatus:Math.abs(speed)<.005?'uncertain-near-station':speed<0?'retrograde':'direct',boundaryDistanceDegrees};});
  return {schemaVersion:'1.0',kind:'calculated',method:{...this.manifest.method},utc,ayanamshaDegrees:ayan,meanAyanamshaDegrees:this.meanAyan(tt),ascendant:lagna.sign,lagna,planets,warnings,location:{id:place.id,label:place.label,latitude:place.latitude,longitude:place.longitude,timezone:place.timezone},timeResolution:{timezone:'Asia/Kolkata',offsetSeconds:19800,fold:0,tzdata:this.manifest.timezoneDataVersion,historicalReview:false},privateBeta:{scopeId:'gc-india-private-beta-1',controlledReferenceCharts:60,publicReady:false,scope:{...this.manifest.betaScope},locationPrecision:'Confirmed GeoNames city center, not an exact birth address'},validation:{productionReady:false,releaseGate:'browser parity and delivery under validation'}};
 }
}

const sha256=async raw=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',raw)),x=>x.toString(16).padStart(2,'0')).join('');
async function verifiedBytes(meta,base=assetBase,onMetrics=()=>{}){
 const start=performance.now(),compressed=typeof DecompressionStream!=='undefined',url=new URL(compressed?meta.gzipUrl:meta.url,base),response=await fetch(url,{credentials:'omit',cache:'force-cache'});
 if(!response.ok)throw Error('Calculation data could not be loaded. Please retry.');
 if(Number(response.headers.get('content-length'))>meta.bytes+65536)throw Error('Calculation data exceeds expected size');
 let raw=await response.arrayBuffer(),received=performance.now(),downloadBytes=raw.byteLength;if(raw.byteLength>Math.max(meta.gzipBytes,meta.bytes))throw Error('Unexpected calculation data size');
 if(compressed){const receivedHash=await sha256(raw);if(receivedHash===meta.sha256&&raw.byteLength===meta.bytes){/* HTTP Content-Encoding may already have decoded gzip. */}else{if(receivedHash!==meta.gzipSHA256)throw Error('Compressed calculation data failed integrity verification');raw=await new Response(new Blob([raw]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();}}
 if(raw.byteLength!==meta.bytes)throw Error('Calculation data is incomplete');
 const decompressed=performance.now(),hash=await sha256(raw);
 if(hash!==meta.sha256)throw Error('Calculation data failed integrity verification');onMetrics({asset:meta.url,downloadBytes,decodedBytes:raw.byteLength,fetchMs:received-start,decompressMs:decompressed-received,verifyMs:performance.now()-decompressed});return raw;
}
async function createEngine(){let r=await fetch(new URL('manifest.json',assetBase),{credentials:'omit'});if(!r.ok)throw Error('Calculation manifest unavailable');let manifestBytes=await r.arrayBuffer();if(manifestBytes.byteLength>65536||await sha256(manifestBytes)!==manifestSHA256)throw Error('Calculation manifest failed integrity verification');let manifest=JSON.parse(new TextDecoder().decode(manifestBytes));if(manifest.manifestVersion!==1||manifest.runtimeVersion!=='1.0.0')throw Error('Unsupported calculation runtime version');let metrics=[],raw=await verifiedBytes(manifest.earthRotation,undefined,x=>metrics.push(x)),engine=new Engine(manifest,new Float64Array(raw));engine.assetMetrics=metrics;return engine;}
async function ensureDate(engine,date){let year=Number(date.slice(0,4)),c=engine.manifest.chunks.find(c=>year>=c.startYear&&year<c.endYearExclusive);if(!c)throw Error('Not yet supported in the current GrahaCanvas beta');if(!engine.chunks.has(c.url)){let b=await verifiedBytes(c,undefined,x=>engine.assetMetrics.push(x));engine.chunks.clear();engine.install(c,b);}return c;}

let engine;
self.onmessage=async ({data})=>{
 if(data?.type==='configure'){const u=new URL(data.base);if(u.protocol!=='https:')throw Error('Secure asset host required');assetBase=u;return;}
 const {requestId,record,placeId}=data||{};const start=performance.now();
 try{
  if(data.type==='clear'){engine=undefined;self.postMessage({requestId,cleared:true});return;}
  // Reject malformed/out-of-scope input before downloading coefficients.
  civilIST(record?.date,record?.time);
  engine??=await createEngine();if(!engine.manifest.places.some(p=>p.id===placeId))throw Error('Not yet supported in the current GrahaCanvas beta');
  const chunk=await ensureDate(engine,record.date),calculateStart=performance.now(),result=engine.calculate(record,placeId);
  const assets=engine.assetMetrics.splice(0);self.postMessage({requestId,result,metrics:{totalMs:performance.now()-start,calculateMs:performance.now()-calculateStart,residentCoefficientBytes:chunk.bytes+engine.rotation.byteLength,assets}});
 }catch(error){self.postMessage({requestId,error:error instanceof Error?error.message:'Unable to calculate. Please retry.'});}
};
