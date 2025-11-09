// --- КОНСТАНТЫ И НАСТРОЙКИ ---
const SITES = ['unu', 'aviso', 'socpublic'];
const GENERAL_TARGET = 500; // Общая цель для вывода
// Диапазоны для ежедневных целей:
const RUB_GOAL_MIN = 10;
const RUB_GOAL_MAX = 50;
const TASK_GOAL_MIN = 5;
const TASK_GOAL_MAX = 20;
// ----------------------------

// ===================================
// === ЛОГИКА ОБЩЕГО БАЛАНСА (ГЛАВНАЯ СТРАНИЦА) ===
// ===================================

function updateGeneralBalance(siteId) {
    const inputElement = document.getElementById(`input-${siteId}`);
    let newBalance = parseFloat(inputElement.value);
    
    if (isNaN(newBalance) || newBalance < 0) {
        alert('Пожалуйста, введите корректное положительное число.');
        return;
    }
    
    // Сохранение в LocalStorage
    localStorage.setItem(`general_balance_${siteId}`, newBalance);
    
    // Обновление визуализации
    renderGeneralBar(siteId, newBalance);
    
    inputElement.value = '';
}

function renderGeneralBar(siteId, currentBalance) {
    const percentage = Math.min((currentBalance / GENERAL_TARGET) * 100, 100);
    
    document.getElementById(`balance-${siteId}`).textContent = currentBalance.toFixed(2);
    document.getElementById(`fill-${siteId}`).style.width = percentage + '%';
    document.getElementById(`fill-${siteId}`).textContent = percentage.toFixed(0) + '%';
}

function loadGeneralBalances() {
    SITES.forEach(siteId => {
        const savedBalance = localStorage.getItem(`general_balance_${siteId}`);
        const balance = savedBalance !== null ? parseFloat(savedBalance) : 0;
        
        document.getElementById(`target-${siteId}`).textContent = GENERAL_TARGET.toFixed(2);
        renderGeneralBar(siteId, balance);
    });
}


// ===================================
// === ЛОГИКА ЕЖЕДНЕВНЫХ ЦЕЛЕЙ (ВИДЖЕТ) ===
// ===================================

// Вспомогательная функция для проверки, прошла ли полночь
function isNewDay(lastUpdateTime) {
    if (!lastUpdateTime) return true;
    const today = new Date();
    const lastUpdate = new Date(lastUpdateTime);
    return today.toDateString() !== lastUpdate.toDateString();
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function renderDailyBar(siteId, type, current, goal) {
    // Эта функция будет работать только когда модальное окно загружено
    const currentEl = document.getElementById(`progress-${type}-${siteId}`);
    if (!currentEl) return; 
    
    const percentage = goal > 0 ? Math.min((current / goal) * 100, 100) : 0;
    
    currentEl.textContent = current.toFixed(type === 'rub' ? 2 : 0);
    document.getElementById(`goal-${type}-${siteId}`).textContent = goal.toFixed(type === 'rub' ? 2 : 0);
    
    const progressBar = document.getElementById(`fill-${type}-${siteId}`);
    progressBar.style.width = percentage + '%';
    progressBar.textContent = percentage.toFixed(0) + '%';
    
    if (percentage < 15 && percentage > 0) {
        progressBar.textContent = '';
    } else if (percentage >= 100) {
        progressBar.textContent = 'ГОТОВО!';
    }
}

function loadAndCheckDailyGoals() {
    SITES.forEach(siteId => {
        const lastUpdate = localStorage.getItem(`daily_lastUpdate_${siteId}`);
        let goals;
        let progress;
        
        if (isNewDay(lastUpdate)) {
            // Новый день: генерируем случайные цели и сбрасываем прогресс
            goals = {
                rub: getRandomInt(RUB_GOAL_MIN, RUB_GOAL_MAX),
                tasks: getRandomInt(TASK_GOAL_MIN, TASK_GOAL_MAX)
            };
            progress = { rub: 0, tasks: 0 };
            
            localStorage.setItem(`daily_goals_${siteId}`, JSON.stringify(goals));
            localStorage.setItem(`daily_progress_${siteId}`, JSON.stringify(progress));
            localStorage.setItem(`daily_lastUpdate_${siteId}`, new Date().toISOString());
            
        } else {
            // Тот же день: загружаем сохраненные цели и прогресс
            goals = JSON.parse(localStorage.getItem(`daily_goals_${siteId}`));
            progress = JSON.parse(localStorage.getItem(`daily_progress_${siteId}`));
        }
        
        // Отображаем прогресс
        renderDailyBar(siteId, 'rub', progress.rub, goals.rub);
        renderDailyBar(siteId, 'tasks', progress.tasks, goals.tasks);
    });
}

function updateDailyProgress(type, siteId) {
    const inputElement = document.getElementById(`input-${type}-${siteId}`);
    const newValue = parseFloat(inputElement.value);
    
    if (isNaN(newValue) || newValue < 0) {
        alert('Пожалуйста, введите корректное положительное число.');
        return;
    }
    
    let progress = JSON.parse(localStorage.getItem(`daily_progress_${siteId}`));
    let goals = JSON.parse(localStorage.getItem(`daily_goals_${siteId}`));
    
    progress[type] = progress[type] + newValue; // Суммируем прогресс

    localStorage.setItem(`daily_progress_${siteId}`, JSON.stringify(progress));
    
    renderDailyBar(siteId, type, progress[type], goals[type]);
    
    inputElement.value = '';
}


// ===================================
// === ИНИЦИАЛИЗАЦИЯ И УПРАВЛЕНИЕ ВИДЖЕТОМ ===
// ===================================

window.onload = function() {
    // 1. Загрузка данных для главной страницы
    loadGeneralBalances();

    // 2. Управление Виджетом (теперь элементы доступны сразу)
    const modal = document.getElementById('goalsModal');
    const openBtn = document.getElementById('openGoalsModal');
    const closeBtn = document.getElementById('closeGoalsModal');

    // Проверка, что элементы модального окна существуют
    if (modal && openBtn && closeBtn) {
        openBtn.onclick = function() {
            modal.style.display = 'flex';
            // Загружаем данные целей только при открытии виджета!
            loadAndCheckDailyGoals(); 
        }
        
        closeBtn.onclick = function() {
            modal.style.display = 'none';
        }
        
        window.onclick = function(event) {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        }
    } else {
        console.error("Не найдены элементы модального окна. Убедитесь, что код модального окна вставлен в index.html.");
    }
};