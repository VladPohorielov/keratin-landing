# Звіт про модернізацію проєкту KERATIN STUDIO

## Виконані завдання:

### 1. ✅ Глобальна заміна міста

- **content.json**: Змінено місто з "Одеса" на "Жмеринка", адресу на "вул. Шевченка, 15, Жмеринка"
- **index.html**: Оновлено всі теги `<title>`, `<meta name="description">`, Open Graph, Twitter Cards, JSON-LD структуру
- **manifest.json**: Змінено назву і опис з "Одеса" на "Жмеринка"
- **sw.js**: Оновлено адресу в offline сторінці
- Перевірено: більше немає згадок про "Одес" в проєкті

### 2. ✅ Красива вбудована карусель відгуків (Embla)

- **HTML**: Переписано секцію `#testimonials` з новою Embla структурою
- **CSS**: Додано стилі для `.testimonial-wrap`, `.testimonial-viewport`, `.testimonial-container`, `.testimonial-slide`, `.review`, `.dots`
- **JS**: Оновлено `buildTestimonials()` для нової структури відгуків
- **Embla CDN**: Підключено через ESM модуль з автопліем, паузою на hover, повагою до `prefers-reduced-motion`

### 3. ✅ Мобільне меню для прикладів робіт (галерея)

- **content.json**: Додано поле `tag` для всіх елементів галереї ("До/Після", "Відео", "Довге", "Коротке", "Середнє")
- **HTML**: Додано `.gallery-nav` навігацію перед масонською сіткою
- **CSS**: Стилі для `.filter-chip`, `.show-more`, sticky позиціонування навігації
- **JS**:
  - Додано `galleryState` зі станом фільтрів
  - Функція `buildGalleryFilters()` - динамічні фільтри з унікальних тегів
  - Функція `buildGalleryGrid()` - пагінація на мобільних (по 8 карток + "Показати ще")
  - Збереження стану в `location.hash`

### 4. ✅ Дрібні доопрацювання

- **CSS**: Додано `isolation: isolate` для `.site-header`
- **Accessibility**: Всі кнопки мають правильні `aria-label`
- **Performance**: Media елементи мають `width/height` для запобігання CLS
- **Motion**: Поважає `prefers-reduced-motion: reduce`

### 5. ✅ Перевірки

- Всі згадки "Одеса" замінено на "Жмеринка" (включно з відмінками)
- Embla карусель працює з автопліем і зупинкою на hover
- Галерея має фільтри та мобільну пагінацію
- Код відповідає вимогам сумісності (Chromium/Firefox 120+, Safari 17+)
- Використано ESM CDN без збірників

## Технічні деталі:

- Lighthouse performance: оптимізовано для ≥95 балів (додано proper sizing для медіа)
- Accessibility: ARIA атрибути, semantic HTML, keyboard navigation
- Responsive: адаптивність для всіх розмірів екранів
- Modern CSS: CSS Grid, Flexbox, custom properties, backdrop-filter
- ES2020+: ESM imports, modern JavaScript APIs

## Робоча папка:

Всі файли знаходяться в `modernized/` директорії та готові для використання.
