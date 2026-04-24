import { testConsoleLog, setupButton } from './interactions.js';

class ParallaxEffect {
  constructor(containerSelector, layers) {
    this.container = document.querySelector(containerSelector);
    this.layers = layers;
    this.init();
  }

  init() {
    if (!this.container) return;
    
    this.handleMove = this.handleMove.bind(this);
    
    // Подписываемся на mouse move и touch move
    window.addEventListener('mousemove', this.handleMove);
    window.addEventListener('touchmove', this.handleMove);
    window.addEventListener('touchstart', this.handleMove); // Для начальной позиции
  }

  handleMove(e) {
    // Получаем координаты в зависимости от типа события
    let clientX, clientY;
    
    if (e.touches) {
      // Сенсорное устройство
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      // Мышь
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    // Нормализуем координаты от -1 до 1
    const mouseX = (clientX / window.innerWidth) * 2 - 1;
    const mouseY = (clientY / window.innerHeight) * 2 - 1;

    // Применяем смещение для каждого слоя
    this.layers.forEach(layer => {
      const element = document.querySelector(layer.selector);
      if (!element) return;

      const speed = layer.speed;
      // Уменьшил смещение для мобильных устройств для лучшей производительности
      const maxOffset = window.innerWidth < 768 ? 15 : 30;
      const offsetX = mouseX * maxOffset * speed;
      const offsetY = mouseY * maxOffset * speed;
      
      // Сохраняем центрирование и добавляем смещение
      element.style.transform = `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px))`;
    });
  }

  destroy() {
    window.removeEventListener('mousemove', this.handleMove);
    window.removeEventListener('touchmove', this.handleMove);
    window.removeEventListener('touchstart', this.handleMove);
  }
}

// Использование:
const parallax = new ParallaxEffect('.parallax-container', [
  { selector: '.layer-1', speed: 0.02 }, // Очень медленно (дальний план)
  { selector: '.layer-2', speed: 0.09 }, // Медленно
  { selector: '.layer-3', speed: 0.18 }, // Средне
  { selector: '.layer-4', speed: 0.28 }, // Быстро (ближний план)
  { selector: '.layer-5', speed: 0.48 }  // Очень быстро (ближний план)
]);