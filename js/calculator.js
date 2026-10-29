/* calculator.js — калькулятор стоимости кухни (calculator.html).
   Формула из п. 3.3 ТЗ:
   цена = длина × цена модулей (+10 % для угловой) + длина × цена столешницы + остров */
(function () {
  'use strict';

  var form = document.getElementById('calc-form');
  if (!form) return;

  // Цены из раздела 2 ТЗ, рублей за погонный метр
  var FACADE_PRICES = { ldsp: 38000, emal: 52000, oak: 64000 };
  var TOP_PRICES = { plastic: 4500, quartz: 18000 };
  var ISLAND_PRICE = 70000;
  var CORNER_RATE = 1.1; // угловая планировка: +10 % к модулям
  var MIN_LENGTH = 1.5;
  var MAX_LENGTH = 8;

  var range = document.getElementById('length-range');
  var lengthInput = document.getElementById('length');
  var resultBox = document.getElementById('calc-result');
  var totalEl = document.getElementById('total');
  var formulaEl = document.getElementById('formula');
  var pay6 = document.getElementById('pay-6');
  var pay12 = document.getElementById('pay-12');
  var monthButtons = document.querySelectorAll('.month-btn');
  var orderBtn = document.getElementById('calc-order');
  var lastCalc = null;

  // 210000 → "210 000"
  function money(n) {
    return Math.round(n).toLocaleString('ru-RU').replace(/\u00a0|\u202f/g, ' ');
  }
  // 3.5 → "3,5"
  function num(n) {
    return String(n).replace('.', ',');
  }

  // Ползунок и поле с числом показывают одно и то же значение
  range.addEventListener('input', function () { lengthInput.value = range.value; });
  lengthInput.addEventListener('input', function () {
    var v = parseFloat(String(lengthInput.value).replace(',', '.'));
    if (!isNaN(v)) range.value = v;
  });

  // Если пользователь пришёл со страницы материалов, подставляем выбранные фасады
  var preset = window.dubravaStorage && window.dubravaStorage.read('dubrava_material');
  if (preset && preset.type === 'facade' && FACADE_PRICES[preset.material]) {
    form.querySelector('input[name="facade"][value="' + preset.material + '"]').checked = true;
  }
  if (preset && preset.type === 'countertop' && TOP_PRICES[preset.material]) {
    form.querySelector('input[name="top"][value="' + preset.material + '"]').checked = true;
  }

  // Читает значения формы и считает цену
  function calculate() {
    var layout = form.elements.layout.value;
    var facade = form.elements.facade.value;
    var top = form.elements.top.value;
    var island = form.elements.island.checked;
    var length = parseFloat(String(lengthInput.value).replace(',', '.'));

    // Проверка длины: от 1,5 до 8 м
    if (isNaN(length) || length < MIN_LENGTH || length > MAX_LENGTH) {
      lengthInput.setAttribute('aria-invalid', 'true');
      document.getElementById('length-error').textContent = 'Укажите длину от 1,5 до 8 метров';
      return null;
    }
    lengthInput.removeAttribute('aria-invalid');
    document.getElementById('length-error').textContent = '';
    length = Math.round(length * 10) / 10; // один знак после запятой

    var modules = length * FACADE_PRICES[facade] * (layout === 'corner' ? CORNER_RATE : 1);
    var countertop = length * TOP_PRICES[top];
    var total = Math.round(modules + countertop + (island ? ISLAND_PRICE : 0));

    // Строка с расчётом, например: 3 × 52 000 + 3 × 18 000 = 210 000 ₽
    var formula = num(length) + ' × ' + money(FACADE_PRICES[facade]) +
      (layout === 'corner' ? ' × 1,1' : '') +
      ' + ' + num(length) + ' × ' + money(TOP_PRICES[top]) +
      (island ? ' + ' + money(ISLAND_PRICE) : '') +
      ' = ' + money(total) + ' ₽';

    return {
      layout: layout, length: length, facade: facade, top: top,
      island: island, total: total, formula: formula
    };
  }

  // Показывает результат на странице
  function render(calc) {
    totalEl.textContent = money(calc.total) + ' ₽';
    formulaEl.textContent = calc.formula;
    pay6.textContent = money(Math.ceil(calc.total / 6)) + ' ₽/мес';
    pay12.textContent = money(Math.ceil(calc.total / 12)) + ' ₽/мес';
    resultBox.hidden = false;
    document.getElementById('calc-placeholder').hidden = true;
  }

  // Сохраняет расчёт, чтобы форма заявки подставила его в скрытое поле calc_price
  function save(calc) {
    window.dubravaStorage.write('dubrava_calc', {
      calc_price: calc.total,
      // для формы заявки: остров важнее формы кухни
      layout: calc.island ? 'island' : calc.layout
    });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault(); // страница не перезагружается
    var calc = calculate();
    if (!calc) return;
    lastCalc = calc;
    render(calc);
    save(calc);
    window.dubravaTrack('kitchen_calc', {
      layout: calc.layout,
      length_m: calc.length,
      facade: calc.facade,
      countertop: calc.top,
      island: calc.island ? 'yes' : 'no',
      total_price: calc.total
    });
  });

  // Выбор срока рассрочки: подсвечиваем кнопку (событие installment_click
  // отправляет analytics.js по атрибутам data-event и data-months)
  monthButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      monthButtons.forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
      btn.setAttribute('aria-pressed', 'true');
    });
  });

  // Перед переходом к заявке пересчитываем, если пользователь что-то поменял
  orderBtn.addEventListener('click', function () {
    var calc = calculate();
    if (calc) save(calc);
    else if (lastCalc) save(lastCalc);
  });
})();
