/**
 * Service Worker для KERATIN STUDIO
 * Забезпечує кешування ресурсів та базову offline функціональність
 */

const CACHE_NAME = 'keratin-studio-v1.0.0';
const RUNTIME_CACHE = 'keratin-studio-runtime';

// Критичні ресурси для кешування
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/css/styles.css',
  '/js/app.js',
  '/content.json',
  '/manifest.json'
];

// Статичні ресурси
const STATIC_ASSETS = [
  '/favicon.ico',
  '/apple-touch-icon.png'
];

// Медіа файли (кешуються окремо через велику вагу)
const MEDIA_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.mp4', '.webm'];

/**
 * Встановлення Service Worker
 */
self.addEventListener('install', event => {
  console.log('SW: Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('SW: Caching core assets');
        return cache.addAll(CORE_ASSETS);
      })
      .then(() => {
        // Форсована активація нового SW
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('SW: Installation failed', error);
      })
  );
});

/**
 * Активація Service Worker
 */
self.addEventListener('activate', event => {
  console.log('SW: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        // Видалення старих кешів
        return Promise.all(
          cacheNames
            .filter(cacheName => {
              return cacheName.startsWith('keratin-studio-') && 
                     cacheName !== CACHE_NAME && 
                     cacheName !== RUNTIME_CACHE;
            })
            .map(cacheName => {
              console.log('SW: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        // Швидке перехоплення контролю над всіма клієнтами
        return self.clients.claim();
      })
  );
});

/**
 * Перехоплення мережевих запитів
 */
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Ігноруємо не-GET запити та сторонні домени
  if (request.method !== 'GET' || url.origin !== location.origin) {
    return;
  }
  
  // Різні стратегії кешування залежно від типу ресурсу
  if (isHTMLRequest(request)) {
    event.respondWith(handleHTMLRequest(request));
  } else if (isStaticAsset(request)) {
    event.respondWith(handleStaticAsset(request));
  } else if (isMediaFile(request)) {
    event.respondWith(handleMediaFile(request));
  } else if (isAPIRequest(request)) {
    event.respondWith(handleAPIRequest(request));
  }
});

/**
 * Обробка HTML запитів (Network First стратегія)
 */
async function handleHTMLRequest(request) {
  try {
    // Спробуємо отримати свіжу версію з мережі
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Оновлюємо кеш свіжою версією
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    throw new Error('Network response not ok');
  } catch (error) {
    // Fallback до кешованої версії
    console.log('SW: Network failed, serving from cache');
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Offline fallback
    return new Response(
      generateOfflinePage(),
      {
        headers: { 'Content-Type': 'text/html' }
      }
    );
  }
}

/**
 * Обробка статичних ресурсів (Cache First стратегія)
 */
async function handleStaticAsset(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('SW: Failed to fetch static asset:', request.url);
    return new Response('Asset not available offline', { status: 503 });
  }
}

/**
 * Обробка медіа файлів (Cache First з обмеженням розміру)
 */
async function handleMediaFile(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      
      // Кешуємо тільки невеликі файли (до 5MB)
      const contentLength = networkResponse.headers.get('content-length');
      if (!contentLength || parseInt(contentLength, 10) < 5 * 1024 * 1024) {
        cache.put(request, networkResponse.clone());
      }
    }
    
    return networkResponse;
  } catch (error) {
    console.log('SW: Failed to fetch media file:', request.url);
    return new Response('Media not available offline', { status: 503 });
  }
}

/**
 * Обробка API запитів (Network First з коротким таймаутом)
 */
async function handleAPIRequest(request) {
  try {
    // Короткий таймаут для API запитів
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    const networkResponse = await fetch(request, {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('SW: API request failed, trying cache');
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    return new Response(
      JSON.stringify({ error: 'Data not available offline' }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

/**
 * Утилітарні функції для визначення типу запиту
 */
function isHTMLRequest(request) {
  return request.destination === 'document' || 
         request.headers.get('accept')?.includes('text/html');
}

function isStaticAsset(request) {
  return request.destination === 'style' || 
         request.destination === 'script' ||
         request.destination === 'font' ||
         request.url.includes('/css/') ||
         request.url.includes('/js/') ||
         request.url.includes('/fonts/');
}

function isMediaFile(request) {
  return request.destination === 'image' || 
         request.destination === 'video' ||
         MEDIA_EXTENSIONS.some(ext => request.url.includes(ext));
}

function isAPIRequest(request) {
  return request.url.includes('.json') || 
         request.url.includes('/api/');
}

/**
 * Генерація offline сторінки
 */
function generateOfflinePage() {
  return `
    <!DOCTYPE html>
    <html lang="uk">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>KERATIN STUDIO — Offline</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
          background: linear-gradient(135deg, #0b0b0f, #1a1a2e);
          color: #f7f8fc;
          margin: 0;
          padding: 0;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
        }
        .offline-container {
          max-width: 500px;
          padding: 2rem;
        }
        .offline-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
        }
        h1 {
          color: #c9ff7b;
          margin-bottom: 1rem;
          font-size: 2rem;
        }
        p {
          line-height: 1.6;
          margin-bottom: 2rem;
          opacity: 0.9;
        }
        .retry-btn {
          background: linear-gradient(90deg, #c9ff7b, #9ad5ff);
          color: #0b0b0f;
          border: none;
          padding: 1rem 2rem;
          border-radius: 999px;
          font-weight: 700;
          cursor: pointer;
          font-size: 1rem;
          transition: transform 0.2s ease;
        }
        .retry-btn:hover {
          transform: translateY(-2px);
        }
        .contact-info {
          margin-top: 2rem;
          padding-top: 2rem;
          border-top: 1px solid rgba(255,255,255,0.1);
        }
        a {
          color: #c9ff7b;
          text-decoration: none;
        }
      </style>
    </head>
    <body>
      <div class="offline-container">
        <div class="offline-icon">📱</div>
        <h1>KERATIN STUDIO</h1>
        <p>Схоже, у вас немає підключення до інтернету. Але не хвилюйтеся — ви можете зателефонувати нам прямо зараз!</p>
        <button class="retry-btn" onclick="window.location.reload()">
          Спробувати знову
        </button>
        <div class="contact-info">
          <p><strong>Телефон:</strong> <a href="tel:+380637027770">+380 63 702 77 70</a></p>
          <p><strong>Адреса:</strong> вул. Дерибасівська, 1, Одеса</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Обробка повідомлень від головного потоку
 */
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

/**
 * Background Sync для offline форм (якщо підтримується)
 */
if ('sync' in self.registration) {
  self.addEventListener('sync', event => {
    if (event.tag === 'contact-form') {
      event.waitUntil(syncContactForm());
    }
  });
}

/**
 * Синхронізація форми контактів
 */
async function syncContactForm() {
  try {
    // Отримуємо збережені дані форми з IndexedDB або localStorage
    const formData = await getStoredFormData();
    
    if (formData) {
      const response = await fetch('/submit-form', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        // Очищуємо збережені дані після успішної відправки
        await clearStoredFormData();
        
        // Повідомляємо користувача про успішну відправку
        self.registration.showNotification('Форма відправлена!', {
          body: 'Ваша заявка успішно відправлена. Ми зв\'яжемося з вами найближчим часом.',
          icon: '/icon-192.png',
          badge: '/badge-72.png'
        });
      }
    }
  } catch (error) {
    console.error('SW: Failed to sync form data', error);
  }
}

/**
 * Заглушки для роботи з формами (можна розширити)
 */
async function getStoredFormData() {
  // Реалізація залежить від обраного способу зберігання
  return null;
}

async function clearStoredFormData() {
  // Очищення збережених даних
}

console.log('SW: Service Worker loaded');