import { testConsoleLog, setupButton } from './interactions.js';

class ParallaxEffect {
  constructor(containerSelector, layers) {
    this.container = document.querySelector(containerSelector);
    this.layers = layers;
    this.useGyro = false;
    this.isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    // Для сглаживания скачков
    this.lastGamma = 0;
    this.lastBeta = 0;
    this.smoothGamma = 0;
    this.smoothBeta = 0;
    this.isFirstGyroEvent = true;
    
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
    window.addEventListener('mousemove', this.handleMove);
    window.addEventListener('touchmove', this.handleMove);
    window.addEventListener('touchstart', this.handleMove);
  }
  
  // Сглаживание значений для устранения скачков
  smoothValue(current, last, smoothing = 0.3) {
    return last + (current - last) * smoothing;
  }
  
  // Фильтрация резких скачков (более 30 градусов за раз)
  filterJump(newValue, lastValue, maxJump = 30) {
    let diff = newValue - lastValue;
    if (Math.abs(diff) > maxJump) {
      return lastValue + Math.sign(diff) * maxJump;
    }
    return newValue;
  }
  
  handleOrientation(e) {
    if (!this.useGyro) return;
    
    // Получаем данные с гироскопа
    let gamma = e.gamma || 0;  // Наклон влево-вправо
    let beta = e.beta || 0;     // Наклон вперед-назад
    
    // Исправляем проблему с переходом через 0 на iPhone
    // На iPhone beta может резко прыгать с 0 до 180
    if (beta > 90) beta = 180 - beta;
    if (beta < -90) beta = -180 - beta;
    
    // Для первого события просто запоминаем значения
    if (this.isFirstGyroEvent) {
      this.lastGamma = gamma;
      this.lastBeta = beta;
      this.smoothGamma = gamma;
      this.smoothBeta = beta;
      this.isFirstGyroEvent = false;
      return;
    }
    
    // Фильтруем резкие скачки
    gamma = this.filterJump(gamma, this.lastGamma, 25);
    beta = this.filterJump(beta, this.lastBeta, 25);
    
    // Сглаживаем значения для плавности
    this.smoothGamma = this.smoothValue(gamma, this.smoothGamma, 0.15);
    this.smoothBeta = this.smoothValue(beta, this.smoothBeta, 0.15);
    
    // Запоминаем последние значения
    this.lastGamma = gamma;
    this.lastBeta = beta;
    
    // Ограничиваем диапазон для лучшего контроля
    const maxAngle = 35; // Максимальный угол для полного смещения
    let normalizedX = this.smoothGamma / maxAngle;
    let normalizedY = this.smoothBeta / maxAngle;
    
    // Ограничиваем от -1 до 1
    normalizedX = Math.max(-1, Math.min(1, normalizedX));
    normalizedY = Math.max(-1, Math.min(1, normalizedY));
    
    // Добавляем мертвую зону (небольшие наклоны игнорируем)
    const deadZone = 0.05;
    if (Math.abs(normalizedX) < deadZone) normalizedX = 0;
    if (Math.abs(normalizedY) < deadZone) normalizedY = 0;
    
    // Применяем смещение для каждого слоя
    this.layers.forEach(layer => {
      const element = document.querySelector(layer.selector);
      if (!element) return;
      
      const speed = layer.speed;
      const maxOffset = 250; // Максимальное смещение для гироскопа
      
      // Используем нелинейную интерполяцию для более плавного движения
      let offsetX = normalizedX * maxOffset * speed;
      let offsetY = normalizedY * maxOffset * speed;
      
      // Для ближних слоев добавляем небольшую задержку
      if (speed > 0.2) {
        offsetX = this.smoothValue(offsetX, this.lastOffsetX?.[layer.selector] || 0, 0.2);
        offsetY = this.smoothValue(offsetY, this.lastOffsetY?.[layer.selector] || 0, 0.2);
        
        if (!this.lastOffsetX) this.lastOffsetX = {};
        if (!this.lastOffsetY) this.lastOffsetY = {};
        this.lastOffsetX[layer.selector] = offsetX;
        this.lastOffsetY[layer.selector] = offsetY;
      }
      
      // Сохраняем центрирование и добавляем смещение
      element.style.transform = `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px))`;
    });
  }

  handleMove(e) {
    // Если используется гироскоп, не обрабатываем касания
    if (this.useGyro) return;
    
    let clientX, clientY;
    
    if (e.touches) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    const mouseX = (clientX / window.innerWidth) * 2 - 1;
    const mouseY = (clientY / window.innerHeight) * 2 - 1;

    this.layers.forEach(layer => {
      const element = document.querySelector(layer.selector);
      if (!element) return;

      const speed = layer.speed;
      const maxOffset = window.innerWidth < 768 ? 15 : 30;
      const offsetX = mouseX * maxOffset * speed;
      const offsetY = mouseY * maxOffset * speed;
      
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
  { selector: '.layer-1', speed: 0.02 },
  { selector: '.layer-2', speed: 0.09 },
  { selector: '.layer-3', speed: 0.18 },
  { selector: '.layer-4', speed: 0.28 },
  { selector: '.layer-5', speed: 0.48 }
]);