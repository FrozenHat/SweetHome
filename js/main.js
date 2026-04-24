import { testConsoleLog, setupButton } from './interactions.js';

class ParallaxEffect {
  constructor(containerSelector, layers) {
    this.container = document.querySelector(containerSelector);
    this.layers = layers;
    this.useGyro = false;
    this.isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    // Для плавного сглаживания
    this.currentX = 0;
    this.currentY = 0;
    this.targetX = 0;
    this.targetY = 0;
    this.animationFrame = null;
    
    this.init();
  }

  init() {
    if (!this.container) return;
    
    this.handleMove = this.handleMove.bind(this);
    this.handleOrientation = this.handleOrientation.bind(this);
    this.animate = this.animate.bind(this);
    
    // Запускаем анимационный цикл для сглаживания
    this.animate();
    
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
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      this.createGyroButton();
    } else {
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
    `;
    
    button.onclick = async () => {
      try {
        const permission = await DeviceOrientationEvent.requestPermission();
        if (permission === 'granted') {
          this.enableGyroscope();
          button.remove();
        }
      } catch (error) {
        console.log('Ошибка:', error);
        button.remove();
      }
    };
    
    document.body.appendChild(button);
  }
  
  enableGyroscope() {
    this.useGyro = true;
    window.addEventListener('deviceorientation', this.handleOrientation);
    
    const notification = document.createElement('div');
    notification.textContent = '✨ Параллакс активирован! ✨';
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
    window.addEventListener('mousemove', this.handleMove);
    window.addEventListener('touchmove', this.handleMove);
    window.addEventListener('touchstart', this.handleMove);
  }
  
  handleOrientation(e) {
    if (!this.useGyro) return;
    
    // Просто получаем значения гироскопа
    let gamma = e.gamma || 0;  // Влево-вправо (-90 до 90)
    let beta = e.beta || 0;    // Вперед-назад (-180 до 180)
    
    // Нормализуем от -1 до 1 (ограничиваем 45 градусами)
    let targetX = Math.max(-1, Math.min(1, gamma / 45));
    let targetY = Math.max(-1, Math.min(1, beta / 45));
    
    // Устанавливаем целевые значения для сглаживания
    this.targetX = targetX;
    this.targetY = targetY;
  }

  handleMove(e) {
    if (this.useGyro) return;
    
    let clientX, clientY;
    
    if (e.touches) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    // Устанавливаем целевые значения
    this.targetX = (clientX / window.innerWidth) * 2 - 1;
    this.targetY = (clientY / window.innerHeight) * 2 - 1;
  }
  
  animate() {
    // Плавное следование (инерция)
    const easing = 0.12; // Коэффициент сглаживания (меньше = плавнее)
    
    this.currentX += (this.targetX - this.currentX) * easing;
    this.currentY += (this.targetY - this.currentY) * easing;
    
    // Применяем смещение для каждого слоя
    this.layers.forEach(layer => {
      const element = document.querySelector(layer.selector);
      if (!element) return;
      
      const speed = layer.speed;
      const maxOffset = this.useGyro ? 20 : (window.innerWidth < 768 ? 15 : 30);
      
      const offsetX = this.currentX * maxOffset * speed;
      const offsetY = this.currentY * maxOffset * speed;
      
      element.style.transform = `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px))`;
    });
    
    this.animationFrame = requestAnimationFrame(() => this.animate());
  }

  destroy() {
    window.removeEventListener('mousemove', this.handleMove);
    window.removeEventListener('touchmove', this.handleMove);
    window.removeEventListener('touchstart', this.handleMove);
    window.removeEventListener('deviceorientation', this.handleOrientation);
    
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
  }
}

// Добавляем анимацию
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeOut {
    0% { opacity: 1; transform: translateX(-50%) translateY(0); }
    70% { opacity: 1; }
    100% { opacity: 0; transform: translateX(-50%) translateY(-20px); visibility: hidden; }
  }
`;
document.head.appendChild(style);

// Использование:
const parallax = new ParallaxEffect('.parallax-container', [
  { selector: '.layer-1', speed: 0.02 },
  { selector: '.layer-2', speed: 0.09 },
  { selector: '.layer-3', speed: 0.18 },
  { selector: '.layer-4', speed: 0.28 },
  { selector: '.layer-5', speed: 0.48 }
]);