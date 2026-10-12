export const signs=['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'];
export const grahas=[['sun','Sun','Surya','â˜‰','#edb544'],['moon','Moon','Chandra','â˜½','#d1d5e9'],['mars','Mars','Mangala','â™‚','#d97862'],['mercury','Mercury','Budha','â˜¿','#90b5aa'],['jupiter','Jupiter','Guru','â™ƒ','#cba885'],['venus','Venus','Shukra','â™€','#d9b9d7'],['saturn','Saturn','Shani','â™„','#b7a8d4'],['rahu','Rahu','Rahu','â˜Š','#8abbd0'],['ketu','Ketu','Ketu','â˜‹','#c5bda2']];
const nakshatras=['Ashwini','Bharani','Krittika','Rohini','Mrigashira','Ardra','Punarvasu','Pushya','Ashlesha','Magha','Purva Phalguni','Uttara Phalguni','Hasta','Chitra','Swati','Vishakha','Anuradha','Jyeshtha','Mula','Purva Ashadha','Uttara Ashadha','Shravana','Dhanishtha','Shatabhisha','Purva Bhadrapada','Uttara Bhadrapada','Revati'];
export function longitudeLabels(longitude){
 if(!Number.isFinite(longitude)||longitude<0||longitude>=360)throw Error('Invalid unrounded longitude.');
 const data=new DataView(new ArrayBuffer(8));data.setFloat64(0,longitude);const bits=data.getBigUint64(0),exponent=Number((bits>>52n)&2047n),fraction=bits&((1n<<52n)-1n);
 let numerator=exponent?fraction+(1n<<52n):fraction,denominator=1n;const power=exponent?exponent-1075:-1074;
 if(power>=0)numerator<<=BigInt(power);else denominator<<=BigInt(-power);
 const sector=Number(numerator*3n/(denominator*10n));return {sign:Math.floor(longitude/30),nakshatra:nakshatras[Math.floor(sector/4)],pada:sector%4+1};
}
export function assertChart(chart){
 if(!chart||!['illustrative','calculated'].includes(chart.kind)||!Number.isInteger(chart.ascendant)||chart.ascendant<0||chart.ascendant>11||!chart.method?.id||!Array.isArray(chart.planets)||chart.planets.length!==9)throw Error('Incomplete chart response.');
 const ids=new Set();for(const p of chart.planets){const labels=longitudeLabels(chart.kind==='calculated'?p.longitude:p.sign*30+p.degree);if(!grahas.some(g=>g[0]===p.id)||ids.has(p.id)||!Number.isInteger(p.sign)||p.sign<0||p.sign>11||!Number.isFinite(p.degree)||p.degree<0||p.degree>=30||p.sign!==labels.sign||p.house!==(p.sign-chart.ascendant+12)%12+1||p.pada!==labels.pada||p.nakshatra!==labels.nakshatra||typeof p.retrograde!=='boolean')throw Error('Inconsistent chart placement.');ids.add(p.id);}
 if(chart.kind==='calculated'&&(!chart.method.provider||!chart.method.version||!chart.method.ayanamsha||!chart.method.nodes||!chart.utc))throw Error('Calculation provenance missing.');return chart;
}
export function freezeCalculatedChart(chart){
 assertChart(chart);if(chart.kind!=='calculated'||!chart.privateBeta||chart.privateBeta.publicReady!==false)throw Error('Private-beta calculation metadata missing.');
 function freeze(value){if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;}
 return freeze(chart);
}
