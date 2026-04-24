// Функция для тестового вывода в консоль
export function testConsoleLog() {
    console.log('Кнопка нажата!');
}

// Функция для настройки кнопки
export function setupButton(buttonId, callback) {
    const button = document.getElementById(buttonId);
    
    if (button) {
        button.addEventListener('click', callback);
    } else {
        console.error('Кнопка не найдена!');
    }
}