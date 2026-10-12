// Fetch and verify the complete executable worker before running it.
export async function createCalculationWorker(base){
 const url=new URL('worker.js',base),response=await fetch(url,{credentials:'omit',cache:'force-cache'});
 if(!response.ok)throw Error('The Kundli calculation files could not be loaded. Please try again.');
 const bytes=await response.arrayBuffer();
 const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),x=>x.toString(16).padStart(2,'0')).join('');
 if(bytes.byteLength!==16565||hash!=="2a3c427476b4fcdf68a215b096b1dcfe1a62cec5754bd5621a62af455f12d27a")throw Error('Calculation runtime failed integrity verification');
 const objectURL=URL.createObjectURL(new Blob([bytes],{type:'text/javascript'}));
 let worker;try{worker=new Worker(objectURL);worker.postMessage({type:'configure',base:String(new URL('./',base))});}finally{URL.revokeObjectURL(objectURL);}
 return worker;
}
