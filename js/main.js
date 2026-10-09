/**
 * Image upload helper, quick-add, event wiring and first render.
 */
let IMG='';function up(i,t,mx){const f=i.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{const m=new Image();m.onload=()=>{const k=Math.min(1,(mx||500)/Math.max(m.width,m.height)),c=document.createElement('canvas');c.width=m.width*k;c.height=m.height*k;c.getContext('2d').drawImage(m,0,0,c.width,c.height);$('#'+t).innerHTML='Uploading…';api('/api/admin/upload',{method:'POST',body:{d:c.toDataURL('image/jpeg',.82)}}).then(j=>{IMG=j.url;$('#'+t).innerHTML='<img src="'+IMG+'">'}).catch(e=>toast(e.message))};m.src=r.result};r.readAsDataURL(f)}
function qa(t,id){t=='p'?pd(id):cb(id)}
addEventListener('hashchange',()=>{D.stale=1;cl();render()});document.addEventListener('click',e=>{if(!e.target.closest('.sr')){const d=$('#dd');d&&(d.style.display='none')}});boot();

setInterval(()=>{if(!document.hidden&&D.banners.filter(x=>x.on).length>1&&$('#hero')){hi++;hup()}},5000);

/** Start-up: load the catalogue from the server, check for an admin session, then draw the page. */
async function boot(){try{await loadCatalog()}catch(e){$('#app').innerHTML='<p style="padding:40px;text-align:center">Could not reach the server. Start it with <b>npm start</b> and open http://localhost:3000</p>';return}try{await api('/api/admin/me');adm=true}catch(e){}render()}
