/* analytics.js — единственный файл, где вызывается gtag('event', …).
   Подключён на всех страницах. Тег Google (gtag.js) стоит в <head> каждой страницы.

   Как это работает:
   1) В разметке у элемента есть атрибут data-event="имя_события" и параметры
      data-*, например data-button-name="hero_measure" → button_name: "hero_measure".
   2) Скрипт слушает все клики на странице, находит ближайший элемент с data-event
      и отправляет событие в Google Analytics 4.
   3) Другие скрипты (калькулятор, форма) отправляют события через window.dubravaTrack(). */
(function () {
  'use strict';

  // Максимальная длина значения параметра по ТЗ (п. 4.3) — 100 символов
  var MAX_VALUE_LENGTH = 100;

  // Переводит имя из camelCase (так data-атрибуты видны в JS) в snake_case:
  // "buttonName" → "button_name"
  function toSnakeCase(name) {
    return name.replace(/[A-Z]/g, function (letter) {
      return '_' + letter.toLowerCase();
    });
  }

  // Обрезает строковые значения до 100 символов, числа оставляет числами
  function cleanValue(value) {
    if (typeof value === 'number') return value;
    var text = String(value);
    // Если строка — это число (например "210000"), отправляем как число
    if (/^\d+(\.\d+)?$/.test(text)) return Number(text);
    return text.slice(0, MAX_VALUE_LENGTH);
  }

  // Главная функция отправки события. callback вызывается после отправки
  // (нужно перед переходом на другую страницу, чтобы событие не потерялось).
  function track(eventName, params, callback) {
    var data = {};
    var key;
    params = params || {};
    for (key in params) {
      if (Object.prototype.hasOwnProperty.call(params, key) && params[key] !== '' && params[key] !== undefined && params[key] !== null) {
        data[key] = cleanValue(params[key]);
      }
    }
    // Если тег Google не загрузился (например, его заблокировал браузер) —
    // не ломаем сайт, а сразу продолжаем
    if (typeof window.gtag !== 'function') {
      if (callback) callback();
      return;
    }
    if (callback) {
      var done = false;
      var finish = function () {
        if (!done) { done = true; callback(); }
      };
      data.event_callback = finish;
      // Подстраховка: если GA4 не ответил за 1 секунду — всё равно продолжаем
      setTimeout(finish, 1000);
    }
    window.gtag('event', eventName, data);
  }

  // Собирает параметры события из data-атрибутов элемента
  function paramsFromElement(el) {
    var params = {};
    var key;
    for (key in el.dataset) {
      if (key !== 'event') params[toSnakeCase(key)] = el.dataset[key];
    }
    return params;
  }

  // Один обработчик кликов на весь документ (делегирование событий)
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-event]');
    if (!el) return;
    track(el.dataset.event, paramsFromElement(el));
  });

  // Делаем функцию доступной другим скриптам сайта
  window.dubravaTrack = track;
})();
