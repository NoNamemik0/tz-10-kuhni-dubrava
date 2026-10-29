# Таблица событий GA4

Все вызовы `gtag('event', …)` — в одном файле `js/analytics.js`, строка 1 (функция `track`).
Кнопки и ссылки описаны атрибутами `data-event` и `data-*`: обработчик кликов в `analytics.js` превращает
`data-button-name="hero_measure"` в параметр `button_name: "hero_measure"`. Калькулятор, фильтр кухонь и форма
вызывают `window.dubravaTrack(...)` — это та же функция `track` из `analytics.js`.

В столбце «Где» — файл и номер строки с атрибутом `data-event` или вызовом `dubravaTrack`.
Имя, телефон и e-mail в GA4 не передаются.

| № | Событие | Тип | Когда отправляется | Где (файл:строка) | Параметры и пример значений |
|---|---|---|---|---|---|
| 1 | `page_view` | авто | Открытие любой страницы | Расширенная статистика GA4 (Enhanced measurement), без кода | page_location: https://…/calculator.html, page_title: Калькулятор стоимости кухни — «Дубрава» |
| 2 | `scroll` | авто | Прокрутка до 90 % | Расширенная статистика GA4 (Enhanced measurement), без кода | percent_scrolled: 90 |
| 3 | `click` | авто | Переход на внешний сайт (Telegram, WhatsApp, соцсети, карты) | Расширенная статистика GA4 (Enhanced measurement), без кода | link_url: https://t.me/dubrava_sales, outbound: true |
| 4 | `file_download` | авто | Скачивание PDF | Расширенная статистика GA4 (Enhanced measurement), без кода | file_name: /files/katalog-fasadov.pdf, file_extension: pdf |
| 5 | `form_start` | авто | Первое взаимодействие с формой заявки | Расширенная статистика GA4 (Enhanced measurement), без кода — форма `#lead-form` на contacts.html | form_id: lead-form |
| 6 | `form_submit` | авто | Отправка формы заявки | Расширенная статистика GA4 (Enhanced measurement), без кода — форма `#lead-form` на contacts.html | form_id: lead-form |
| 7 | `generate_lead` | рекоменд., ключевое | Приёмник ответил ok: true | js/form.js:190 | lead_layout: straight, lead_budget: 300_500k, lead_source: instagram |
| 8 | `cta_click` | своё | Клик по кнопке заявки | 404.html:40<br>calculator.html:39,88<br>contacts.html:39<br>index.html:39,51,96<br>kitchens.html:39,67,77,87,97,107…<br>materials.html:39<br>mistakes.html:39,118<br>privacy.html:39<br>projects.html:39<br>thanks.html:40 | button_name: hero_measure, page_section: hero |
| 9 | `style_filter` | своё | Выбор стиля или планировки | index.html:69,73,77,81<br>js/kitchens.js:34 | style: modern, layout: island |
| 10 | `kitchen_calc` | своё | Расчёт в калькуляторе | js/calculator.js:115 | layout: straight, length_m: 3, facade: emal, total_price: 210000 (+ countertop: quartz, island: no) |
| 11 | `installment_click` | своё | Выбор срока рассрочки | calculator.html:83,84 | months: 12 |
| 12 | `material_select` | своё | Клик «Выбрать для расчёта» в карточке материала | materials.html:57,67,77,87,97 | material: emal, material_type: facade |
| 13 | `project_view` | своё | Клик «Смотреть до и после» в карточке проекта | projects.html:56,65,74,83 | project_id: p_6m2, layout: corner |
| 14 | `promo_copy` | своё | Копирование промокода | mistakes.html:105 | promo_code: PLAN3D |
| 15 | `contact_click` | своё, ключевое | Клик по телефону или e-mail | 404.html:39,66,67<br>calculator.html:38,103,104<br>contacts.html:38,98,99,127,128<br>index.html:38,118,119<br>kitchens.html:38,166,167<br>materials.html:38,126,127<br>mistakes.html:38,132,133<br>privacy.html:38,78,79<br>projects.html:38,106,107<br>thanks.html:39,74,75 | contact_type: phone / email (+ page_section) |
| 16 | `messenger_click` | своё, ключевое | Клик Telegram или WhatsApp | contacts.html:100,101 | messenger: telegram / whatsapp |
| 17 | `social_click` | своё | Иконка соцсети в подвале или на thanks.html | 404.html:71<br>calculator.html:108<br>contacts.html:132<br>index.html:123<br>kitchens.html:171<br>materials.html:131<br>mistakes.html:137<br>privacy.html:83<br>projects.html:111<br>thanks.html:61,79 | network: vk, page_section: footer / thanks |
| 18 | `form_error` | своё | Ошибка поля или приёмника | js/form.js:114,143 | field_name: phone, error_type: format / empty / length / server |
| 19 | `gallery_view` | своё, по выбору | Открытие фото проекта | projects.html:93 | project_id: p_ostrov, photo_index: 1 |
| 20 | `map_open` | своё, по выбору | Клик по ссылке на карту | contacts.html:109,110 | map_service: yandex / 2gis |

## Пользовательские параметры (Admin → Custom definitions, Event scope)

| Параметр | Событие |
|---|---|
| `button_name` | cta_click |
| `page_section` | cta_click, social_click |
| `layout` | style_filter, kitchen_calc |
| `facade` | kitchen_calc |
| `material` | material_select |
| `lead_budget` | generate_lead |
| `messenger` | messenger_click |

Ключевые события (Key events): `generate_lead`, `contact_click`, `messenger_click`.
