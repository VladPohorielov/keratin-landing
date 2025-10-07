
// Mini CMS loader
const state = { data: null, activeLengths: {} };

const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => [...root.querySelectorAll(sel)];

async function loadContent(){
  const res = await fetch('content.json');
  state.data = await res.json();
  bindBrand();
  buildAbout();
  buildServices();
  buildSEO();
  buildGallery();
  buildTestimonials();
  buildCerts();
  buildProcess();
  buildFAQ();
  buildContact();
  initUI();
}
function bindBrand(){
  $('#brandName').textContent = state.data.brand.name;
  $('#brandNameFooter').textContent = state.data.brand.name;
  $('#year').textContent = new Date().getFullYear();

  const v = $('#heroVideo');
  v.src = state.data.hero.video;
  v.poster = state.data.hero.poster;
  $('#heroHeadline').textContent = state.data.hero.headline;
  $('#heroSub').textContent = state.data.hero.sub;
  $('#ctaPrimary').textContent = state.data.hero.ctaPrimary;
  $('#ctaSecondary').textContent = state.data.hero.ctaSecondary;
  
  // Footer contacts and social
  const footerContacts = $('#footerContacts');
  const footerSocial = $('#footerSocial');
  const b = state.data.brand;
  
  if(footerContacts) {
    footerContacts.innerHTML = `
      <p><a href="tel:${b.phone}">${b.phone}</a></p>
      <p>${b.city}</p>
    `;
  }
  
  if(footerSocial) {
    footerSocial.innerHTML = `
      <a href="${b.instagram}" target="_blank" rel="me noopener">Instagram</a><br>
      <a href="${b.telegram}" target="_blank" rel="me noopener">Telegram</a><br>
      <a href="${b.whatsapp}" target="_blank" rel="me noopener">WhatsApp</a>
    `;
  }
}

function currency(n){ return new Intl.NumberFormat('uk-UA').format(n); }

// ВИПРАВЛЕНА ФУНКЦІЯ ВІДПРАВКИ ФОРМИ
async function handleFormSubmit(e) {
  e.preventDefault();
  
  const form = e.target;
  const submitBtn = $('#submit-btn');
  const formStatus = $('#form-status');
  
  console.log('📝 Відправка форми...');
  
  // Показуємо стан завантаження
  submitBtn.disabled = true;
  const btnText = submitBtn.querySelector('.btn-text');
  const btnSpinner = submitBtn.querySelector('.btn-spinner');
  
  if (btnText) btnText.textContent = 'Відправляємо...';
  if (btnSpinner) btnSpinner.style.display = 'inline-block';
  
  try {
    const formData = new FormData(form);
    
    const response = await fetch(form.action, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (response.ok) {
      console.log('✅ Форма успішно відправлена');
      
      // Показуємо успішне повідомлення
      if (formStatus) {
        formStatus.className = 'form-status success';
        formStatus.textContent = '✅ Дякуємо! Ваша заявка відправлена. Зв\'яжемося з вами найближчим часом.';
        formStatus.style.display = 'block';
      }
      
      // Скидаємо форму
      form.reset();
      
      // Ховаємо повідомлення через 8 секунд
      setTimeout(() => {
        if (formStatus) formStatus.style.display = 'none';
      }, 8000);
      
    } else {
      throw new Error('Network response was not ok');
    }
  } catch (error) {
    console.error('❌ Помилка відправки форми:', error);
    
    // Показуємо помилку
    if (formStatus) {
      formStatus.className = 'form-status error';
      formStatus.textContent = '❌ Помилка відправки. Спробуйте пізніше або зв\'яжіться телефоном +380637027770.';
      formStatus.style.display = 'block';
    }
  } finally {
    // Відновлюємо кнопку
    submitBtn.disabled = false;
    if (btnText) btnText.textContent = 'Відправити';
    if (btnSpinner) btnSpinner.style.display = 'none';
  }
}

function buildServices(){
  const wrap = $('#servicesGrid');
  wrap.innerHTML = '';
  state.data.services.forEach((svc, idx)=>{
    const card = document.createElement('div');
    card.className = 'card reveal-up';
    const lengths = svc.lengthOptions.map((o,i)=>`
      <button data-svc="${idx}" data-idx="${i}" class="len-btn ${i===0?'active':''}"
              aria-pressed="${i===0?'true':'false'}">${o.label}</button>
    `).join('');
    const perks = svc.perks.map(p=>`<span class="tag">${p}</span>`).join('');
    card.innerHTML = `
      <h3>${svc.title}</h3>
      <p>${svc.desc}</p>
      <div class="tag-row">${perks}</div>
      <div class="lengths" role="group" aria-label="Довжина">${lengths}</div>
      <div class="price">₴ <span class="price-val">${currency(svc.lengthOptions[0].price)}</span></div>
      <div class="meta">Тривалість: <span class="time-val">${svc.lengthOptions[0].time}</span></div>
      <div class="cta-wrap"><a href="#contact" class="btn small">Записатися</a></div>
    `;
    wrap.appendChild(card);
  });

  // Interactions
  wrap.addEventListener('click',(e)=>{
    const btn = e.target.closest('button[data-svc]');
    if(!btn) return;
    const card = btn.closest('.card');
    card.querySelectorAll('.len-btn').forEach(b=>{
      b.classList.toggle('active', b===btn);
      b.setAttribute('aria-pressed', b===btn ? 'true':'false');
    });
    const svc = state.data.services[+btn.dataset.svc];
    const opt = svc.lengthOptions[+btn.dataset.idx];
    card.querySelector('.price-val').textContent = currency(opt.price);
    card.querySelector('.time-val').textContent = opt.time;
  });
}

function buildAbout(){
  const a = state.data.about; 
  if(!a) return;
  
  const photo = $('#aboutPhoto');
  const title = $('#aboutTitle');
  const body = $('#aboutBody');
  
  if(photo) photo.src = a.photo;
  if(title) title.textContent = a.title;
  if(body && a.html) {
    // sanitize HTML
    const t = document.createElement('template'); 
    t.innerHTML = a.html; 
    t.content.querySelectorAll('script').forEach(s=>s.remove());
    body.innerHTML = t.innerHTML;
  }
}

function sanitizeHTML(html){
  const t = document.createElement('template');
  t.innerHTML = html;
  t.content.querySelectorAll('script').forEach(s=>s.remove());
  return t.innerHTML;
}

function buildSEO(){
  const host = document.getElementById('seoMount');
  if(!host || !state.data.seoTexts) return;
  host.innerHTML = '';
  state.data.seoTexts.forEach(block=>{
    const card = document.createElement('article');
    card.className = 'seo-card reveal-up';
    card.innerHTML = `
      <h2 class="seo-title">${block.h2}</h2>
      <div class="seo-body">${sanitizeHTML(block.html)}</div>
    `;
    host.appendChild(card);
  });
}

function buildGallery(){
  const grid = $('#galleryGrid');
  if(!grid) return;
  grid.innerHTML = '';
  state.data.gallery.items.forEach(item=>{
    const div = document.createElement('div');
    div.className = 'masonry-item reveal-up';
    if(item.type==='image'){
      div.innerHTML = `<img src="${item.src}" alt="${item.alt || ''}" loading="lazy" decoding="async" width="400" height="600">`;
    } else {
      div.innerHTML = `<video src="${item.src}" ${item.poster?`poster="${item.poster}"`:''} controls muted preload="metadata" width="400" height="600"></video>`;
    }
    grid.appendChild(div);
  });
}

function buildTestimonials(){
  const car = $('#testimonialsCarousel');
  car.innerHTML='';
  state.data.testimonials.forEach(t=>{
    const el = document.createElement('article');
    el.className = 'review reveal-up';
    el.innerHTML = `<div class="name">${t.name}</div>
      <div class="stars">${'★'.repeat(t.rating)}${'☆'.repeat(5-t.rating)}</div>
      <p>${t.text}</p>`;
    car.appendChild(el);
  });
}

function buildCerts(){
  const strip = $('#certsStrip');
  strip.innerHTML = '';
  state.data.certificates.forEach(c=>{
    const el = document.createElement('figure');
    el.className = 'cert reveal-up';
    el.innerHTML = `<img src="${c.img}" alt="${c.title}"><figcaption style="padding:10px">${c.title}</figcaption>`;
    strip.appendChild(el);
  });
}

function buildProcess(){
  const wrap = $('#processSteps');
  wrap.innerHTML = '';
  state.data.process.forEach((s,i)=>{
    const el = document.createElement('div');
    el.className = 'step reveal-up';
    el.innerHTML = `<div class="tag">Крок ${i+1}</div><h4>${s.title}</h4><p>${s.text}</p>`;
    wrap.appendChild(el);
  });
}

function buildFAQ(){
  const list = $('#faqList');
  list.innerHTML = '';
  state.data.faq.forEach((qa, index)=>{
    const item = document.createElement('div');
    item.className = 'item';
    item.innerHTML = `
      <h3>
        <button class="faq-toggle" aria-expanded="false" aria-controls="faq-${index}">
          ${qa.q}
        </button>
      </h3>
      <div id="faq-${index}" class="answer" hidden>
        ${qa.a}
      </div>
    `;
    list.appendChild(item);
  });
  
  // Обробник кліків для акордеону
  list.addEventListener('click', (e)=>{
    const btn = e.target.closest('.faq-toggle'); 
    if(!btn) return;
    
    const item = btn.closest('.item');
    const answer = item.querySelector('.answer');
    const isOpen = btn.getAttribute('aria-expanded') === 'true';
    
    // Закрити інші відкриті елементи (optional - only-one-open)
    list.querySelectorAll('.item.open').forEach(openItem => {
      if(openItem !== item) {
        openItem.classList.remove('open');
        openItem.querySelector('.faq-toggle').setAttribute('aria-expanded', 'false');
        openItem.querySelector('.answer').hidden = true;
      }
    });
    
    // Переключити поточний елемент
    if(isOpen) {
      item.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
      answer.hidden = true;
    } else {
      item.classList.add('open');
      btn.setAttribute('aria-expanded', 'true');
      answer.hidden = false;
    }
  });
  
  // Обробник Escape для закриття
  list.addEventListener('keydown', (e) => {
    if(e.key === 'Escape') {
      const openBtn = list.querySelector('.faq-toggle[aria-expanded="true"]');
      if(openBtn) {
        const item = openBtn.closest('.item');
        const answer = item.querySelector('.answer');
        item.classList.remove('open');
        openBtn.setAttribute('aria-expanded', 'false');
        answer.hidden = true;
        openBtn.focus();
      }
    }
  });
}

function buildContact(){
  const ul = $('#contactList');
  const b = state.data.brand;
  ul.innerHTML = `
    <li><strong>Майстер:</strong> ${b.master}, ${b.city}</li>
    <li><strong>Телефон:</strong> <a href="tel:${b.phone}">${b.phone}</a></li>
    <li><a href="${b.whatsapp}" target="_blank" rel="noopener">WhatsApp</a> • 
        <a href="${b.telegram}" target="_blank" rel="noopener">Telegram</a> • 
        <a href="${b.instagram}" target="_blank" rel="noopener">Instagram</a></li>
  `;
}

function initUI(){
  // mobile menu
  const ham = $('.hamburger');
  ham.addEventListener('click', ()=>{
    $('.nav').style.display = $('.nav').style.display === 'flex' ? 'none':'flex';
  });

  // reveal on scroll
  const io = new IntersectionObserver(entries=>{
    entries.forEach(en=>{
      if(en.isIntersecting){ en.target.classList.add('revealed'); io.unobserve(en.target); }
    });
  }, {threshold:.2});
  $$('.reveal-up').forEach(el=>io.observe(el));

  // ІНІЦІАЛІЗАЦІЯ ФОРМИ - ВИПРАВЛЕНО
  const contactForm = $('#contactForm');
  if (contactForm) {
    console.log('🔧 Ініціалізація форми...');
    
    // Встановлюємо timestamp для захисту від спаму
    const timestampField = $('#form-timestamp');
    if (timestampField) {
      timestampField.value = Date.now().toString();
    }
    
    // Додаємо обробник відправки форми
    contactForm.addEventListener('submit', handleFormSubmit);
    
    // Валідація полів в реальному часі
    const fields = contactForm.querySelectorAll('input[required], textarea[required]');
    fields.forEach(field => {
      field.addEventListener('input', () => {
        field.dataset.touched = 'true';
        validateField(field);
        updateSubmitButton();
      });
      field.addEventListener('blur', () => validateField(field));
    });
    
    console.log('✅ Форма ініціалізована');
  }
}

// Валідація поля
function validateField(field) {
  const value = field.value.trim();
  const errorEl = document.getElementById(field.getAttribute('aria-describedby'));
  let isValid = true;
  let errorMessage = '';

  if (field.hasAttribute('required') && !value) {
    isValid = false;
    errorMessage = "Це поле обов'язкове";
  } else if (value && field.type === 'tel') {
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
    if (!phoneRegex.test(value)) {
      isValid = false;
      errorMessage = 'Введіть коректний номер телефону';
    }
  }

  field.classList.toggle('is-valid', isValid && field.dataset.touched === 'true');
  field.classList.toggle('is-invalid', !isValid && field.dataset.touched === 'true');

  if (errorEl) {
    errorEl.textContent = errorMessage;
  }

  return isValid;
}

// Оновлення стану кнопки відправки
function updateSubmitButton() {
  const form = $('#contactForm');
  const submitBtn = $('#submit-btn');
  if (!form || !submitBtn) return;

  const requiredFields = form.querySelectorAll('input[required], textarea[required]');
  const allValid = Array.from(requiredFields).every(field => {
    return field.value.trim() && validateField(field);
  });

  submitBtn.disabled = !allValid;
}

document.addEventListener('DOMContentLoaded', loadContent);
