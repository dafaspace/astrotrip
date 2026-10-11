/* The parity probe. Injected by `sync-web.sh --probe` into the simulator bundle
   only; a release sync refuses to ship it.

   Dafa's invariant, 29 Sep 2026: "the same input in web and iOS gives
   byte-identical ChartFacts". The web build is held to parity.txt by test.html;
   this holds the iOS build to the same file. Everything is printed with
   console.log, which Capacitor forwards to the app's stdout, so the result can be
   read with `xcrun simctl launch --console-pty` and needs no Web Inspector.

   It also reports what a delivery shell can get wrong on its own: where the page
   was loaded from, whether a service worker or a Cache Storage copy exists, and
   whether anything was fetched from outside the bundle. */
addEventListener('load',()=>setTimeout(async()=>{
  const say=s=>console.log('[probe] '+s);
  try{
    say('href '+location.href+' native '+(typeof NATIVE!=='undefined'&&NATIVE)
      +' version '+(typeof APP_VERSION!=='undefined'?APP_VERSION:'?'));
    const regs=navigator.serviceWorker?await navigator.serviceWorker.getRegistrations():[];
    const keys=window.caches?await caches.keys():[];
    say('service workers '+regs.length+', caches '+keys.length);

    const gold=(await (await fetch('./parity.txt')).text())
      .split('\n').filter(l=>!l.startsWith('#')).join('\n').trim();
    const live=parityDigest().trim();
    if(live===gold) say('parity ok, '+live.split('\n').length+' lines identical');
    else{
      const g=gold.split('\n'), l=live.split('\n');
      let i=0; while(i<Math.max(g.length,l.length)&&g[i]===l[i]) i++;
      say('parity FAIL at line '+(i+1)+': gold "'+(g[i]||'')+'" live "'+(l[i]||'')+'"');
    }

    const outside=performance.getEntriesByType('resource').map(e=>e.name)
      .filter(u=>!u.startsWith(location.origin));
    say('requests outside the bundle: '+(outside.length?outside.join(' '):'none'));
    say('fonts inter '+document.fonts.check('16px Inter')+' literata '+document.fonts.check('16px Literata')
      +' astro '+document.fonts.check('16px Astro'));
    say('atlas '+(typeof ATLAS!=='undefined'?ATLAS.state:'?')+', lang '+(typeof LANG!=='undefined'?LANG:'?')
      +', chart '+(typeof CURRENT!=='undefined'&&CURRENT?'cast':'none'));
    /* What the WebView offers for handing a file to the user. <a download>
       does nothing in WKWebView, measured 10 Oct 2026. */
    let canFiles=false;
    try{ canFiles=!!(navigator.canShare&&navigator.canShare({files:[new File(['a'],'a.csv',{type:'text/csv'})]})); }catch(e){}
    say('share '+(typeof navigator.share)+', share files '+canFiles);
    const CP=window.Capacitor&&window.Capacitor.Plugins||{};
    say('plugins '+['Filesystem','Share','Preferences','Keyboard'].map(k=>k+(CP[k]?'+':'-')).join(' '));
    try{
      const w=await CP.Filesystem.writeFile({path:'probe.csv',data:'a,b\n',directory:'CACHE',encoding:'utf8'});
      say('filesystem write ok '+w.uri);
      const cs=CP.Share.canShare?await CP.Share.canShare():null;
      say('share canShare '+JSON.stringify(cs));
    }catch(e){ say('filesystem/share ERROR '+(e&&(e.message||e.code)||e)); }
    /* Every later share is logged with how it ended, so a sheet that does not
       open says why instead of failing silently inside the app's catch. */
    if(navigator.share){
      const real=navigator.share.bind(navigator);
      navigator.share=d=>{ say('share called, files '+(d&&d.files?d.files.map(f=>f.name+' '+f.type+' '+f.size).join(','):'none')
        +', activation '+(navigator.userActivation?navigator.userActivation.isActive:'?'));
        return real(d).then(r=>{say('share resolved'); return r;},e=>{say('share rejected '+(e&&e.name)+': '+(e&&e.message)); throw e;}); };
    }
    say('done');
  }catch(e){ say('ERROR '+e.message); }
},1500));
