/**
 * Приёмник заявок «Дубрава» (раздел 6 ТЗ-10/2026).
 * Веб-приложение Apps Script: doPost(e) принимает JSON формы с сайта,
 * проверяет данные и дописывает строку в лист «leads» таблицы «Dubrava — Leads».
 *
 * Установка:
 * 1) Таблица «Dubrava — Leads» → Расширения → Apps Script → вставить этот код.
 * 2) Вписать ID таблицы в SPREADSHEET_ID (из адреса таблицы между /d/ и /edit).
 * 3) Запустить функцию setupSheet один раз (создаст заголовки, списки, подсветку).
 * 4) Развернуть → Новое развертывание → Веб-приложение:
 *    «Запуск от имени» — Я, «У кого есть доступ» — Все. Скопировать URL в js/form.js.
 * Пароли и ключи в коде не хранятся.
 */

const SPREADSHEET_ID = 'ВСТАВЬТЕ_ID_ТАБЛИЦЫ';
const SHEET_NAME = 'leads';

// Порядок столбцов — строго как в таблице п. 6.1
const HEADERS = [
  'request_id', 'created_at', 'name', 'phone', 'email', 'layout', 'budget',
  'calc_price', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'status'
];
const LAYOUTS = ['straight', 'corner', 'u_shape', 'island'];
const BUDGETS = ['to_300k', '300_500k', 'over_500k', 'unknown'];
const STATUSES = ['new', 'contacted', 'measure_booked', 'project_sent', 'contract', 'lost'];
const UTM_DEFAULTS = { utm_source: 'direct', utm_medium: 'none', utm_campaign: 'not_set', utm_content: 'not_set' };
const MAX_LENGTH = 200;
const MAX_ROWS = 5000; // на сколько строк настраиваются проверки и подсветка

/** Открывает лист заявок */
function getSheet_() {
  return SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
}

/** Ответ в формате JSON */
function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/** Проверка, что приёмник работает: открыть URL веб-приложения в браузере */
function doGet() {
  return json_({ ok: true, service: 'dubrava-leads' });
}

/** Главная функция: принимает заявку */
function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000); // две заявки одновременно не запишутся в одну строку

    // 1. Разбор данных: сайт присылает JSON в теле запроса
    let data;
    try {
      data = JSON.parse(e.postData.contents);
    } catch (err) {
      return json_({ ok: false, error: 'данные не в формате JSON' });
    }

    // 2. Проверка полей
    const clean = validate_(data);
    if (clean.error) return json_({ ok: false, error: clean.error, field: clean.field });

    const sheet = getSheet_();

    // 3. Повтор: заявка с таким request_id уже есть — вторую строку не создаём
    const found = sheet.getRange(2, 1, Math.max(sheet.getLastRow() - 1, 1), 1)
      .createTextFinder(clean.request_id).matchEntireCell(true).findNext();
    if (found) {
      return json_({ ok: false, error: 'заявка с таким номером уже принята', field: 'request_id' });
    }

    // 4. Запись строки. created_at и status = new ставит приёмник;
    //    status, присланный из браузера, игнорируется.
    const row = [
      clean.request_id, new Date(), clean.name, clean.phone, clean.email,
      clean.layout, clean.budget, clean.calc_price,
      clean.utm_source, clean.utm_medium, clean.utm_campaign, clean.utm_content, 'new'
    ];
    const rowIndex = sheet.getLastRow() + 1;
    const range = sheet.getRange(rowIndex, 1, 1, HEADERS.length);
    // Текстовый формат для телефона и меток, чтобы +7… не превратилось в число
    range.setNumberFormats([[
      '@', 'dd.MM.yyyy HH:mm:ss', '@', '@', '@', '@', '@', '0',
      '@', '@', '@', '@', '@'
    ]]);
    range.setValues([row]);

    return json_({ ok: true, request_id: clean.request_id });
  } catch (err) {
    return json_({ ok: false, error: 'ошибка сервера: ' + err.message });
  } finally {
    lock.releaseLock();
  }
}

/**
 * Проверяет данные формы. Возвращает очищенные значения
 * или объект { error, field } с первой найденной ошибкой.
 */
function validate_(d) {
  const text = (v) => (v === undefined || v === null) ? '' : String(v).trim();
  const out = {};

  // Длина любой строки — не более 200 символов
  for (const key of HEADERS) {
    if (text(d[key]).length > MAX_LENGTH) return { error: 'поле длиннее 200 символов', field: key };
  }

  out.request_id = text(d.request_id);
  if (!/^REQ-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(out.request_id)) {
    return { error: 'неверный номер заявки', field: 'request_id' };
  }

  out.name = text(d.name);
  if (!out.name) return { error: 'не указано имя', field: 'name' };
  if (out.name.length < 2 || out.name.length > 60) return { error: 'имя — от 2 до 60 символов', field: 'name' };

  out.phone = text(d.phone);
  if (!out.phone) return { error: 'не указан телефон', field: 'phone' };
  if (!/^\+7\d{10}$/.test(out.phone)) return { error: 'телефон в формате +7 и 10 цифр', field: 'phone' };

  out.email = text(d.email);
  if (out.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(out.email)) {
    return { error: 'неверный формат e-mail', field: 'email' };
  }

  out.layout = text(d.layout);
  if (LAYOUTS.indexOf(out.layout) === -1) return { error: 'выберите планировку', field: 'layout' };

  out.budget = text(d.budget);
  if (BUDGETS.indexOf(out.budget) === -1) return { error: 'выберите бюджет', field: 'budget' };

  // calc_price — необязательное число: итог калькулятора или пусто
  const price = text(d.calc_price);
  if (price === '') {
    out.calc_price = '';
  } else if (/^\d{1,8}$/.test(price)) {
    out.calc_price = Number(price);
  } else {
    return { error: 'неверная сумма расчёта', field: 'calc_price' };
  }

  // UTM-метки: пусто → значение по умолчанию
  Object.keys(UTM_DEFAULTS).forEach((key) => {
    out[key] = text(d[key]) || UTM_DEFAULTS[key];
  });

  return out;
}

/**
 * Запустить ОДИН РАЗ вручную: создаёт лист leads, заголовки,
 * выпадающие списки, проверку данных и условное форматирование (п. 6.1).
 */
function setupSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);

  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight('bold');
  sheet.setFrozenRows(1);

  // Выпадающие списки; другое значение отклоняется
  const listRule = (values) => SpreadsheetApp.newDataValidation()
    .requireValueInList(values, true).setAllowInvalid(false).build();
  sheet.getRange(2, 6, MAX_ROWS, 1).setDataValidation(listRule(LAYOUTS));   // layout
  sheet.getRange(2, 7, MAX_ROWS, 1).setDataValidation(listRule(BUDGETS));   // budget
  sheet.getRange(2, 13, MAX_ROWS, 1).setDataValidation(listRule(STATUSES)); // status

  // Условное форматирование
  const rules = [];
  // Пустые обязательные ячейки в заполненной строке — розовые
  const required = [1, 2, 3, 4, 6, 7, 9, 10, 11, 12, 13];
  required.forEach((col) => {
    const letter = String.fromCharCode(64 + col);
    rules.push(SpreadsheetApp.newConditionalFormatRule()
      .whenFormulaSatisfied('=AND(COUNTA($A2:$M2)>0, LEN(' + letter + '2)=0)')
      .setBackground('#F4CCCC')
      .setRanges([sheet.getRange(2, col, MAX_ROWS, 1)])
      .build());
  });
  // Повторяющиеся request_id — оранжевые
  rules.push(SpreadsheetApp.newConditionalFormatRule()
    .whenFormulaSatisfied('=AND(A2<>"", COUNTIF($A$2:$A$' + (MAX_ROWS + 1) + ', A2)>1)')
    .setBackground('#F9CB9C')
    .setRanges([sheet.getRange(2, 1, MAX_ROWS, 1)])
    .build());
  sheet.setConditionalFormatRules(rules);

  sheet.autoResizeColumns(1, HEADERS.length);
}

/**
 * Проверка без сайта (Выполнить → testDuplicate): отправляет одну заявку дважды.
 * Ожидается: первая ok: true, вторая — ошибка повтора (испытание И-05).
 */
function testDuplicate() {
  const body = {
    request_id: 'REQ-' + Utilities.getUuid(),
    name: 'Тест повтора', phone: '+79001010010', email: '',
    layout: 'straight', budget: 'unknown', calc_price: '210000',
    utm_source: 'test', utm_medium: 'none', utm_campaign: 'not_set', utm_content: 'not_set'
  };
  const fake = { postData: { contents: JSON.stringify(body) } };
  Logger.log(doPost(fake).getContent());
  Logger.log(doPost(fake).getContent());
}
