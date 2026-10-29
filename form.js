/* form.js — форма заявки на замер (contacts.html) и номер заявки (thanks.html).
   Отправка без перезагрузки страницы через fetch в веб-приложение Apps Script (раздел 6 ТЗ). */
(function () {
  'use strict';

  // Адрес веб-приложения Apps Script (Развернуть → Веб-приложение → URL).
  // ЗАМЕНИТЕ на свой адрес вида https://script.google.com/macros/s/.../exec
  var ENDPOINT = 'https://script.google.com/macros/s/ВСТАВЬТЕ_ID_РАЗВЕРТЫВАНИЯ/exec';

  var storage = window.dubravaStorage;

  /* ---------- Страница «Спасибо»: показываем номер заявки ---------- */
  var numberEl = document.getElementById('request-number');
  if (numberEl) {
    var last = storage.read('dubrava_last_request');
    numberEl.textContent = last || 'номер придёт в сообщении от менеджера';
  }

  /* ---------- Форма заявки ---------- */
  var form = document.getElementById('lead-form');
  if (!form) return;

  var submitBtn = form.querySelector('button[type="submit"]');
  var formMessage = document.getElementById('form-message');

  // Номер заявки: REQ- + UUID. Хранится до успешной отправки, поэтому
  // повторное нажатие кнопки не создаёт вторую заявку в таблице.
  function newRequestId() {
    if (window.crypto && crypto.randomUUID) return 'REQ-' + crypto.randomUUID();
    // запасной вариант для старых браузеров
    return 'REQ-xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }
  var requestId = storage.read('dubrava_request_id');
  if (!requestId) {
    requestId = newRequestId();
    storage.write('dubrava_request_id', requestId);
  }

  // Заполняем скрытые поля: номер заявки и UTM-метки из sessionStorage
  form.elements.request_id.value = requestId;
  var utm = window.dubravaGetUtm();
  Object.keys(utm).forEach(function (key) { form.elements[key].value = utm[key]; });

  // Подставляем расчёт калькулятора и планировку, если они есть
  var calc = storage.read('dubrava_calc');
  var calcBox = document.getElementById('calc-info');
  if (calc && calc.layout) form.elements.layout.value = calc.layout;
  if (calc && calc.calc_price) {
    form.elements.calc_price.value = calc.calc_price;
    document.getElementById('calc-value').textContent =
      Number(calc.calc_price).toLocaleString('ru-RU') + ' ₽';
    calcBox.hidden = false;
  }
  document.getElementById('calc-reset').addEventListener('click', function () {
    form.elements.calc_price.value = '';
    calcBox.hidden = true;
  });

  // Приводит телефон к виду +7XXXXXXXXXX. 8 (900) 101-00-10 → +79001010010
  function normalizePhone(value) {
    var digits = value.replace(/\D/g, '');
    if (digits.length === 11 && (digits[0] === '7' || digits[0] === '8')) return '+7' + digits.slice(1);
    if (digits.length === 10 && digits[0] === '9') return '+7' + digits;
    return value.trim();
  }

  // Правила проверки полей: возвращают текст ошибки и её тип или null
  var rules = {
    name: function (v) {
      if (!v) return ['Укажите имя', 'empty'];
      if (v.length < 2 || v.length > 60) return ['Имя — от 2 до 60 символов', 'length'];
      return null;
    },
    phone: function (v) {
      if (!v) return ['Укажите телефон', 'empty'];
      if (!/^\+7\d{10}$/.test(v)) return ['Телефон в формате +7 и 10 цифр, например +7 900 101-00-10', 'format'];
      return null;
    },
    email: function (v) {
      if (v && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return ['Проверьте e-mail, например name@mail.ru', 'format'];
      return null;
    },
    layout: function (v) { return v ? null : ['Выберите планировку', 'empty']; },
    budget: function (v) { return v ? null : ['Выберите бюджет', 'empty']; },
    consent: function (v, el) { return el.checked ? null : ['Нужно согласие на обработку данных', 'empty']; }
  };

  // Показывает или убирает ошибку под полем
  function setError(name, text) {
    var field = form.elements[name];
    var errorEl = document.getElementById(name + '-error');
    if (text) {
      field.setAttribute('aria-invalid', 'true');
      errorEl.textContent = text;
    } else {
      field.removeAttribute('aria-invalid');
      errorEl.textContent = '';
    }
  }

  // Проверяет все поля, для каждой ошибки отправляет событие form_error
  function validate() {
    var firstInvalid = null;
    form.elements.phone.value = normalizePhone(form.elements.phone.value);
    Object.keys(rules).forEach(function (name) {
      var el = form.elements[name];
      var value = el.type === 'checkbox' ? el.checked : el.value.trim();
      var error = rules[name](value, el);
      setError(name, error ? error[0] : '');
      if (error) {
        window.dubravaTrack('form_error', { field_name: name, error_type: error[1] });
        if (!firstInvalid) firstInvalid = el;
      }
    });
    if (firstInvalid) firstInvalid.focus();
    return !firstInvalid;
  }

  // Убираем ошибку, как только пользователь начинает исправлять поле.
  // Событие input, а не change: change срабатывает при уходе с поля и сдвигает
  // форму в момент нажатия кнопки — клик может «промахнуться».
  Object.keys(rules).forEach(function (name) {
    form.elements[name].addEventListener('input', function () { setError(name, ''); });
  });

  function showMessage(text) {
    formMessage.textContent = text;
    formMessage.hidden = !text;
  }

  function setLoading(isLoading) {
    submitBtn.disabled = isLoading; // во время отправки кнопка неактивна
    submitBtn.textContent = isLoading ? 'Отправляем…' : 'Отправить заявку';
  }

  // Ошибка приёмника: подсвечиваем поле (если он его назвал) и шлём form_error
  function serverError(text, field) {
    if (field && form.elements[field] && document.getElementById(field + '-error')) setError(field, text);
    showMessage('Заявка не отправлена: ' + text + '. Исправьте и попробуйте ещё раз или позвоните +7 (900) 101-00-10.');
    window.dubravaTrack('form_error', { field_name: field || 'form', error_type: 'server' });
    setLoading(false);
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault(); // без перезагрузки страницы
    showMessage('');
    if (!validate()) return;

    if (ENDPOINT.indexOf('ВСТАВЬТЕ') !== -1) {
      serverError('не настроен адрес приёмника заявок', null);
      return;
    }

    var data = {
      request_id: form.elements.request_id.value,
      name: form.elements.name.value.trim(),
      phone: form.elements.phone.value,
      email: form.elements.email.value.trim(),
      layout: form.elements.layout.value,
      budget: form.elements.budget.value,
      calc_price: form.elements.calc_price.value,
      utm_source: form.elements.utm_source.value,
      utm_medium: form.elements.utm_medium.value,
      utm_campaign: form.elements.utm_campaign.value,
      utm_content: form.elements.utm_content.value
    };

    setLoading(true);
    // Тип text/plain — так браузер не делает предварительный CORS-запрос,
    // который Apps Script не поддерживает
    fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(data)
    })
      .then(function (response) { return response.json(); })
      .then(function (answer) {
        if (!answer.ok) {
          serverError(answer.error || 'ошибка приёмника', answer.field);
          return;
        }
        // Приёмник ответил ok: true — только теперь отправляем generate_lead.
        // Имя, телефон и e-mail в GA4 не передаются (п. 4.3).
        storage.write('dubrava_last_request', data.request_id);
        storage.write('dubrava_request_id', null); // следующая заявка получит новый номер
        storage.write('dubrava_calc', null);
        window.dubravaTrack('generate_lead', {
          lead_layout: data.layout,
          lead_budget: data.budget,
          lead_source: data.utm_source
        }, function () {
          window.location.href = 'thanks.html';
        });
      })
      .catch(function () {
        serverError('нет связи с сервером', null);
      });
  });
})();
