/* main.js — общие функции всех страниц:
   меню на телефоне, сохранение UTM-меток, копирование промокода. */
(function () {
  'use strict';

  /* ---------- 1. Меню на телефоне ---------- */
  var burger = document.querySelector('.burger');
  var menu = document.getElementById('menu');
  if (burger && menu) {
    burger.addEventListener('click', function () {
      var isOpen = menu.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', String(isOpen));
      burger.setAttribute('aria-label', isOpen ? 'Закрыть меню' : 'Открыть меню');
    });
  }

  /* ---------- 2. UTM-метки ----------
     Метки читаются из адреса страницы и сохраняются в sessionStorage,
     чтобы не потеряться, пока посетитель ходит по сайту до отправки формы (п. 6.3). */
  var UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content'];
  // Значения по умолчанию для прямого захода (таблица п. 6.1)
  var UTM_DEFAULTS = {
    utm_source: 'direct',
    utm_medium: 'none',
    utm_campaign: 'not_set',
    utm_content: 'not_set'
  };
  var STORAGE_KEY = 'dubrava_utm';

  function readStorage(key) {
    try { return JSON.parse(sessionStorage.getItem(key)); } catch (e) { return null; }
  }
  function writeStorage(key, value) {
    try { sessionStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* хранилище недоступно */ }
  }

  var query = new URLSearchParams(window.location.search);
  var hasUtm = UTM_KEYS.some(function (key) { return query.get(key); });
  if (hasUtm) {
    // Пришли по размеченной ссылке — запоминаем новые метки
    var fromUrl = {};
    UTM_KEYS.forEach(function (key) {
      // Метки обрезаем до 200 символов — столько принимает таблица заявок
      fromUrl[key] = (query.get(key) || UTM_DEFAULTS[key]).trim().slice(0, 200);
    });
    writeStorage(STORAGE_KEY, fromUrl);
  }

  // Функция для формы: вернуть сохранённые метки или значения по умолчанию
  window.dubravaGetUtm = function () {
    var saved = readStorage(STORAGE_KEY) || {};
    var result = {};
    UTM_KEYS.forEach(function (key) {
      result[key] = saved[key] || UTM_DEFAULTS[key];
    });
    return result;
  };
  window.dubravaStorage = { read: readStorage, write: writeStorage };

  /* ---------- 3. Копирование промокода (страница 10 ошибок) ---------- */
  document.querySelectorAll('[data-copy]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var code = btn.getAttribute('data-copy');
      var status = document.getElementById(btn.getAttribute('aria-describedby'));
      function done() {
        btn.textContent = 'Скопировано';
        if (status) status.textContent = 'Промокод ' + code + ' скопирован';
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(code).then(done, done);
      } else {
        // Старые браузеры: копируем через временное поле
        var tmp = document.createElement('textarea');
        tmp.value = code;
        document.body.appendChild(tmp);
        tmp.select();
        try { document.execCommand('copy'); } catch (e) { /* не удалось */ }
        document.body.removeChild(tmp);
        done();
      }
      // Событие promo_copy отправляет analytics.js по атрибуту data-event
    });
  });
})();
