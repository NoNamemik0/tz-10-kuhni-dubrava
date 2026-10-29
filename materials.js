/* materials.js — выбор материала (materials.html).
   Событие material_select отправляет analytics.js по атрибутам data-event,
   data-material и data-material-type. Здесь только запоминаем выбор для калькулятора. */
(function () {
  'use strict';

  document.querySelectorAll('.material-select').forEach(function (btn) {
    btn.addEventListener('click', function () {
      // Подсвечиваем выбранную карточку
      document.querySelectorAll('.material-card').forEach(function (card) {
        card.removeAttribute('aria-current');
      });
      btn.closest('.material-card').setAttribute('aria-current', 'true');
      // Запоминаем материал: калькулятор отметит его автоматически
      window.dubravaStorage.write('dubrava_material', {
        material: btn.dataset.material,
        type: btn.dataset.materialType
      });
      document.getElementById('material-status').textContent =
        'Выбрано: ' + btn.dataset.title + '. Калькулятор подставит этот материал.';
    });
  });
})();
