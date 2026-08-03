/* ============ header solid on scroll + vine progress ============ */
const header = document.querySelector(".header");
const root = document.documentElement;
function onScroll(){
  const y = window.scrollY;
  if(header) header.classList.toggle("solid", y > 40);
  const h = document.body.scrollHeight - window.innerHeight;
  const p = h>0 ? Math.min(100, (y/h)*100) : 0;
  root.style.setProperty("--scroll", p.toFixed(2)+"%");
}
window.addEventListener("scroll", onScroll, {passive:true});
onScroll();

/* ============ mobile menu ============ */
const burger = document.getElementById("burger");
const navlinks = document.getElementById("navlinks");
if(burger && navlinks){
  burger.addEventListener("click",()=>{
    const open = navlinks.classList.toggle("open");
    burger.setAttribute("aria-expanded", open);
  });
}

/* ============ reveal on scroll ============ */
const io = new IntersectionObserver((entries)=>{
  entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add("in"); io.unobserve(e.target);} });
},{threshold:.12, rootMargin:"0px 0px -40px 0px"});
document.querySelectorAll(".reveal").forEach(el=>io.observe(el));

/* ============ project filters (proyectos.html) ============ */
const filters = document.querySelectorAll(".filter");
const projects = document.querySelectorAll(".project");
if(filters.length && projects.length){
  filters.forEach(f=>f.addEventListener("click",()=>{
    filters.forEach(x=>x.classList.remove("on")); f.classList.add("on");
    const key = f.dataset.filter;
    projects.forEach(p=>{
      const show = key==="all" || (p.dataset.theme||"").includes(key);
      p.classList.toggle("hide", !show);
    });
  }));
}

/* ============ contact form -> Netlify Forms (contacto.html) ============
   Envío por AJAX a Netlify (POST a "/"), así el mensaje de confirmación aparece
   en la misma página sin recargar. Si JS estuviera desactivado, el formulario
   igualmente hace POST nativo y Netlify lo recoge. */
const form = document.getElementById("cform");
if(form){
  form.addEventListener("submit",(e)=>{
    e.preventDefault();
    if(!form.checkValidity()){ form.reportValidity(); return; }
    const okEl  = document.getElementById("cmsg");
    const errEl = document.getElementById("cerr");
    const btn   = form.querySelector('button[type="submit"]');
    if(errEl) errEl.hidden = true;
    if(okEl)  okEl.classList.remove("show");
    if(btn)   btn.disabled = true;

    const body = new URLSearchParams(new FormData(form)).toString();
    fetch("/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body
    })
    .then((r)=>{ if(!r.ok) throw new Error("HTTP "+r.status); })
    .then(()=>{ if(okEl) okEl.classList.add("show"); form.reset(); })
    .catch(()=>{ if(errEl) errEl.hidden = false; })
    .finally(()=>{ if(btn) btn.disabled = false; });
  });
}

/* ============ Reproductor de vídeo embebido en tarjetas de proyecto ============
   El botón de play inserta un iframe de YouTube y reproduce el vídeo dentro de
   la propia página. Un clic en la miniatura (capa .project__cover) abre el
   vídeo en YouTube, gestionado por el propio enlace. */
(function(){
  const medias = document.querySelectorAll(".project__media[data-video]");
  if(!medias.length) return;

  function play(media){
    if(media.classList.contains("is-playing")) return;
    const id = media.dataset.video;
    if(!id) return;
    const iframe = document.createElement("iframe");
    iframe.className = "project__frame";
    iframe.src = "https://www.youtube-nocookie.com/embed/" + id +
      "?autoplay=1&rel=0&modestbranding=1&playsinline=1";
    iframe.title = media.dataset.title || "Vídeo de YouTube";
    iframe.setAttribute("loading", "lazy");
    iframe.setAttribute("allow",
      "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share");
    iframe.setAttribute("allowfullscreen", "");
    media.appendChild(iframe);
    media.classList.add("is-playing");
  }

  function stop(media){
    const frame = media.querySelector(".project__frame");
    if(frame) frame.remove();
    media.classList.remove("is-playing");
  }

  medias.forEach(media=>{
    const btn = media.querySelector(".project__play");
    if(btn) btn.addEventListener("click",(e)=>{ e.preventDefault(); play(media); });
  });

  /* Miniatura robusta: si maxresdefault no existe, YouTube puede servir un
     marcador gris de 120x90 con estado HTTP 200 (el onerror no salta). En ese
     caso, o si la imagen falla, se cambia a hqdefault.jpg, que existe siempre. */
  medias.forEach(media=>{
    const img = media.querySelector(".project__thumb");
    const id = media.dataset.video;
    if(!img || !id) return;
    const hq = "https://i.ytimg.com/vi/" + id + "/hqdefault.jpg";
    function fallback(){
      if(img.dataset.fellback) return;
      img.dataset.fellback = "1";
      img.src = hq;
    }
    function check(){
      // naturalWidth 0 = error; <=120 = marcador gris "sin miniatura"
      if(!img.naturalWidth || img.naturalWidth <= 120) fallback();
    }
    img.addEventListener("error", fallback);
    img.addEventListener("load", check);
    if(img.complete) check();
  });

  /* Al cambiar de filtro (proyectos.html) se detienen los vídeos en marcha */
  document.querySelectorAll(".filter").forEach(f=>{
    f.addEventListener("click", ()=> medias.forEach(stop));
  });
})();

/* year in footer */
const yr = document.getElementById("yr");
if(yr) yr.textContent = new Date().getFullYear();
