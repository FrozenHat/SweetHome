import { testConsoleLog, setupButton } from './interactions.js';

class ParallaxEffect {
  constructor(containerSelector, layers) {
    this.container = document.querySelector(containerSelector);
    this.layers = layers;
    this.useGyro = false;
    this.isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    this.init();
  }

  init() {
    if (!this.container) return;
    
    this.handleMove = this.handleMove.bind(this);
    this.handleOrientation = this.handleOrientation.bind(this);
    
    // Для мобильных устройств - используем гироскоп
    if (this.isMobile && this.isGyroAvailable()) {
      this.initGyroscope();
    } else {
      // Для десктопа - мышь и сенсоры
      this.initMouseAndTouch();
    }
  }
  
  isGyroAvailable() {
    return 'DeviceOrientationEvent' in window || 'DeviceMotionEvent' in window;
  }
  
  initGyroscope() {
    // Для iOS 13+ нужно запрашивать разрешение
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      this.createGyroButton();
    } else {
      // Для Android и других устройств
      this.enableGyroscope();
    }
  }
  
  createGyroButton() {
    const button = document.createElement('button');
    button.textContent = '🎯 Активировать параллакс (гироскоп)';
    button.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 10000;
      padding: 12px 24px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 50px;
      cursor: pointer;
      font-size: 14px;
      font-weight: bold;
      box-shadow: 0 4px 15px rgba(0,0,0,0.2);
      transition: transform 0.2s;
    `;
    
    button.onclick = async () => {
      try {
        const permission = await DeviceOrientationEvent.requestPermission();
        if (permission === 'granted') {
          this.enableGyroscope();
          button.remove();
        }
      } catch (error) {
        console.log('Ошибка доступа к гироскопу:', error);
        button.textContent = '❌ Гироскоп недоступен';
        setTimeout(() => button.remove(), 2000);
      }
    };
    
    document.body.appendChild(button);
  }
  
  enableGyroscope() {
    this.useGyro = true;
    window.addEventListener('deviceorientation', this.handleOrientation);
    console.log('Гироскоп активирован');
    
    // Показываем уведомление
    const notification = document.createElement('div');
    notification.textContent = '✨ Параллакс активирован! Наклоняйте телефон ✨';
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #4CAF50;
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 12px;
      z-index: 10000;
      animation: fadeOut 2s forwards;
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 2000);
  }
  
  initMouseAndTouch() {
    // Подписываемся на mouse move и touch move
    window.addEventListener('mousemove', this.handleMove);
    window.addEventListener('touchmove', this.handleMove);
    window.addEventListener('touchstart', this.handleMove);
  }
  
  handleOrientation(e) {
    if (!this.useGyro) return;
    
    // Получаем данные с гироскопа
    // gamma: наклон влево-вправо (-90 до 90)
    // beta: наклон вперед-назад (-180 до 180)
    let gamma = e.gamma || 0;
    let beta = e.beta || 0;
    
    // Нормализуем от -1 до 1
    const normalizedX = Math.max(-1, Math.min(1, gamma / 45));
    const normalizedY = Math.max(-1, Math.min(1, beta / 45));
    
    // Применяем смещение для каждого слоя
    this.layers.forEach(layer => {
      const element = document.querySelector(layer.selector);
      if (!element) return;
      
      const speed = layer.speed;
      const maxOffset = 25; // Максимальное смещение для гироскопа
      const offsetX = normalizedX * maxOffset * speed;
      const offsetY = normalizedY * maxOffset * speed;
      
      // Сохраняем центрирование и добавляем смещение
      element.style.transform = `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px))`;
    });
  }

  handleMove(e) {
    // Если используется гироскоп, не обрабатываем касания
    if (this.useGyro) return;
    
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
    window.removeEventListener('deviceorientation', this.handleOrientation);
  }
}

// Добавляем анимацию для уведомления
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeOut {
    0% { opacity: 1; transform: translateX(-50%) translateY(0); }
    70% { opacity: 1; transform: translateX(-50%) translateY(0); }
    100% { opacity: 0; transform: translateX(-50%) translateY(-20px); visibility: hidden; }
  }
`;
document.head.appendChild(style);

// Использование:
const parallax = new ParallaxEffect('.parallax-container', [
  { selector: '.layer-1', speed: 0.02 }, // Очень медленно (дальний план)
  { selector: '.layer-2', speed: 0.09 }, // Медленно
  { selector: '.layer-3', speed: 0.18 }, // Средне
  { selector: '.layer-4', speed: 0.28 }, // Быстро (ближний план)
  { selector: '.layer-5', speed: 0.48 }  // Очень быстро (ближний план)
]);