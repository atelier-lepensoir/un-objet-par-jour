const CACHE="uopj-v73";
const CORE=["./","./index.html","./manifest.webmanifest","./icon-192.png","./icon-512.png","./og-image.png"];
// Chaque fichier est mis en cache séparément : un fichier manquant ne bloque plus l'installation.
// cache:"reload" : on prend toujours la version du serveur, jamais une copie gardée par le navigateur.
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>Promise.all(CORE.map(u=>fetch(new Request(u,{cache:"reload"})).then(r=>r.ok?c.put(u,r):null).catch(()=>null)))).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==CACHE).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
const keep=(req,r)=>{if(r&&(r.ok||r.type==="opaque")){const cp=r.clone();caches.open(CACHE).then(c=>c.put(req,cp))}return r};
self.addEventListener("fetch",e=>{
  if(e.request.method!=="GET")return;
  const url=new URL(e.request.url);
  const isPage=e.request.mode==="navigate"||(url.origin===location.origin&&/(\/|\/index\.html)$/.test(url.pathname));
  if(isPage){
    // La page : réseau d'abord (dernière version dès l'ouverture), copie locale si hors ligne ou réseau trop lent.
    e.respondWith(caches.match(e.request,{ignoreSearch:true}).then(hit=>{
      const net=fetch(e.request.url,{cache:"no-cache"}).then(r=>keep(e.request,r));
      if(!hit)return net;
      const slow=new Promise(res=>setTimeout(()=>res(hit),3500));
      return Promise.race([net.then(r=>r&&r.ok?r:hit).catch(()=>hit),slow]);
    }));
    return;
  }
  // Le reste (icônes, images) : copie locale d'abord, mise à jour en arrière-plan.
  e.respondWith(caches.match(e.request).then(hit=>{
    const net=fetch(e.request).then(r=>keep(e.request,r)).catch(()=>hit);
    return hit||net;
  }));
});
