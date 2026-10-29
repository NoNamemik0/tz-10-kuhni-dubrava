/* kitchens.js — фильтр кухон по стилю и планировке (kitchens.html). */
(function () {
  'use strict';

  var cards = document.querySelectorAll('.kitchen-card');
  if (!cards.length) return;
  var empty = document.getElementById('empty');
  var islandNote = document.getElementById('island-note');
  var state = { style: 'all', layout: 'all' };

  // Показывает только карточки, подходящие под выбранный стиль и планировку
  function applyFilter() {
    var shown = 0;
    cards.forEach(function (card) {
      var okStyle = state.style === 'all' || card.dataset.style === state.style;
      var okLayout = state.layout === 'all' || card.dataset.layout === state.layout;
      card.hidden = !(okStyle && okLayout);
      if (!card.hidden) shown++;
    });
    empty.hidden = shown > 0;
    islandNote.hidden = state.layout !== 'island';
    // Отмечаем нажатые кнопки
    document.querySelectorAll('.chip').forEach(function (chip) {
      var group = chip.dataset.group;
      chip.setAttribute('aria-pressed', String(chip.dataset.value === state[group]));
    });
  }

  document.querySelectorAll('.chip').forEach(function (chip) {
    chip.addEventListener('click', function () {
      state[chip.dataset.group] = chip.dataset.value;
      applyFilter();
      // Событие style_filter с обоими параметрами: стиль и планировка
      window.dubravaTrack('style_filter', { style: state.style, layout: state.layout });
    });
  });

  // Кнопка «Хочу такую»: запоминаем планировку для формы заявки
  document.querySelectorAll('[data-want-layout]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      window.dubravaStorage.write('dubrava_calc', { layout: btn.dataset.wantLayout });
    });
  });

  // Начальный фильтр: ?style=modern с главной или якорь #island из Instagram
  var params = new URLSearchParams(window.location.search);
  var allowedStyles = ['modern', 'classic', 'scandi', 'loft'];
  if (allowedStyles.indexOf(params.get('style')) !== -1) state.style = params.get('style');
  if (window.location.hash === '#island') state.layout = 'island';
  applyFilter();
})();
