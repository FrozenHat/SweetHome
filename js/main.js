import { testConsoleLog, setupButton } from './interactions.js';

class ParallaxEffect {
  constructor(containerSelector, layers) {
    this.container = document.querySelector(containerSelector);
    this.layers = layers;
    this.init();
  }

  init() {
    if (!this.container) return;
    
    this.handleMouseMove = this.handleMouseMove.bind(this);
    window.addEventListener('mousemove', this.handleMouseMove);
  }

  handleMouseMove(e) {
    // Нормализуем координаты мыши от -1 до 1
    const mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    const mouseY = (e.clientY / window.innerHeight) * 2 - 1;

    // Применяем смещение для каждого слоя
    this.layers.forEach(layer => {
      const element = document.querySelector(layer.selector);
      if (!element) return;

      const speed = layer.speed;
      // Чем выше скорость, тем больше смещение
      const offsetX = mouseX * 30 * speed;  // Уменьшил до 30 для плавности
      const offsetY = mouseY * 120 * speed;
      
      // СОХРАНЯЕМ центрирование и добавляем смещение
      element.style.transform = `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px))`;
    });
  }

  destroy() {
    window.removeEventListener('mousemove', this.handleMouseMove);
  }
}

// Использование:
const parallax = new ParallaxEffect('.parallax-container', [
  { selector: '.layer-1', speed: 0.02 }, // Очень медленно (дальний план)
  { selector: '.layer-2', speed: 0.09 }, // Медленно
  { selector: '.layer-3', speed: 0.18 }, // Средне
  { selector: '.layer-4', speed: 0.28 }, // Быстро (ближний план)
  { selector: '.layer-5', speed: 0.48 }  // Быстро (ближний план)
]);