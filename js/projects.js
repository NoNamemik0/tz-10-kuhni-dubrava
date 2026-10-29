/* projects.js — галерея проекта (projects.html).
   Кнопка «Смотреть проект» → событие project_view (через data-event),
   миниатюра фото → событие gallery_view (через data-event). */
(function () {
  'use strict';

  var gallery = document.getElementById('gallery');
  if (!gallery) return;
  var title = document.getElementById('gallery-title');
  var mainImg = document.getElementById('gallery-img');
  var thumbs = gallery.querySelectorAll('.thumb');
  var LABELS = ['До ремонта', 'После установки', 'Деталь'];

  // Открывает фото номер index (1, 2 или 3) текущего проекта
  function showPhoto(index) {
    var thumb = thumbs[index - 1];
    mainImg.src = thumb.querySelector('img').src;
    mainImg.alt = thumb.querySelector('img').alt;
    thumbs.forEach(function (t) { t.setAttribute('aria-pressed', String(t === thumb)); });
  }

  // Загружает в галерею фотографии выбранного проекта
  function openProject(card) {
    var id = card.dataset.projectId;
    var name = card.dataset.title;
    title.textContent = name;
    thumbs.forEach(function (thumb, i) {
      var img = thumb.querySelector('img');
      img.src = 'img/project-' + card.dataset.slug + '-' + (i + 1) + '.webp';
      img.alt = name + ': ' + LABELS[i].toLowerCase();
      // Параметры для события gallery_view
      thumb.dataset.projectId = id;
      thumb.dataset.photoIndex = String(i + 1);
    });
    showPhoto(2); // сначала показываем готовую кухню
  }

  document.querySelectorAll('.project-open').forEach(function (btn) {
    btn.addEventListener('click', function () {
      openProject(btn);
      gallery.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  thumbs.forEach(function (thumb, i) {
    thumb.addEventListener('click', function () { showPhoto(i + 1); });
  });
})();
