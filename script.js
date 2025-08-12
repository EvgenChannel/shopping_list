// Загрузка списка при запуске
document.addEventListener('DOMContentLoaded', function() {
    loadProducts();

    // Добавляем обработчик вставки в поле ввода
    const input = document.getElementById('productInput');
    input.addEventListener('paste', handlePaste);
});

// Обработка вставки текста
function handlePaste(e) {
    e.preventDefault();

    // Получаем вставленный текст
    const pastedText = (e.clipboardData || window.clipboardData).getData('text');

    // Разбиваем текст на пункты (по переносам строк или запятым)
    const items = parsePastedText(pastedText);

    // Добавляем каждый пункт
    let addedCount = 0;
    items.forEach(item => {
        const trimmedItem = item.trim();
        if (trimmedItem) {
            addSingleProduct(trimmedItem);
            addedCount++;
        }
    });

    if (addedCount > 0) {
        showNotification(`Добавлено ${addedCount} ${getWordForm(addedCount, ['пункт', 'пункта', 'пунктов'])}`);
    }

    // Очищаем поле ввода
    document.getElementById('productInput').value = '';
}

// Парсинг вставленного текста
function parsePastedText(text) {
    // Если есть переносы строк, разбиваем по ним
    if (text.includes('\n')) {
        return text.split('\n');
    }
    // Если есть точки с запятыми, разбиваем по ним
    else if (text.includes(';')) {
        return text.split(';');
    }
    // Если есть запятые, разбиваем по ним
    else if (text.includes(',')) {
        return text.split(',');
    }
    // Если ничего нет, возвращаем как один пункт
    else {
        return [text];
    }
}

// Добавление одного продукта (внутренняя функция)
function addSingleProduct(product) {
    if (product) {
        const productList = document.getElementById('productList');
        const li = document.createElement('li');

        li.innerHTML = `
            <div class="product-item">
                <input type="checkbox" class="product-checkbox" onchange="toggleProduct(this)">
                <span class="product-text">${escapeHtml(product)}</span>
            </div>
            <button class="delete-btn" onclick="deleteProduct(this)">×</button>
        `;

        productList.appendChild(li);
        saveProducts();
    }
}

// Добавление продукта через кнопку (оригинальная функция)
function addProduct() {
    const input = document.getElementById('productInput');
    const product = input.value.trim();

    if (product) {
        addSingleProduct(product);
        input.value = '';
        showNotification('Продукт добавлен');
    }
}

// Экранирование HTML для безопасности
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Удаление продукта
function deleteProduct(button) {
    const li = button.parentElement;
    li.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => {
        li.remove();
        saveProducts();
    }, 300);
}

// Отметка продукта как купленного
function toggleProduct(checkbox) {
    const text = checkbox.nextElementSibling;
    if (checkbox.checked) {
        text.classList.add('completed');
    } else {
        text.classList.remove('completed');
    }
    saveProducts();
}

// Удаление купленных
function removeCompleted() {
    const completedItems = document.querySelectorAll('.product-text.completed');
    const count = completedItems.length;

    if (count === 0) {
        showNotification('Нет купленных товаров');
        return;
    }

    completedItems.forEach(item => {
        const li = item.closest('li');
        li.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            li.remove();
        }, 300);
    });

    setTimeout(() => {
        saveProducts();
        showNotification(`Удалено ${count} ${getWordForm(count, ['товар', 'товара', 'товаров'])}`);
    }, 350);
}

// Очистить всё
function clearAll() {
    const productList = document.getElementById('productList');
    const count = productList.children.length;

    if (count === 0) {
        showNotification('Список уже пуст');
        return;
    }

    if (confirm(`Вы уверены, что хотите очистить весь список? (${count} ${getWordForm(count, ['пункт', 'пункта', 'пунктов'])})`)) {
        productList.innerHTML = '';
        saveProducts();
        showNotification('Список очищен');
    }
}

// Сохранение в localStorage
function saveProducts() {
    const productList = document.getElementById('productList');
    localStorage.setItem('shoppingList', productList.innerHTML);
}

// Загрузка из localStorage
function loadProducts() {
    const savedList = localStorage.getItem('shoppingList');
    if (savedList) {
        document.getElementById('productList').innerHTML = savedList;
        restoreEventListeners();
    }
}

// Добавление по Enter
document.getElementById('productInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        addProduct();
    }
});

// Экспорт списка
function exportList() {
    const productList = document.getElementById('productList');
    const items = [];

    productList.querySelectorAll('li').forEach(li => {
        const text = li.querySelector('.product-text').textContent;
        const completed = li.querySelector('.product-checkbox').checked;
        items.push(`${completed ? '✓' : '☐'} ${text}`);
    });

    if (items.length === 0) {
        showNotification('Список пуст');
        return;
    }

    const listText = items.join('\n');

    // Копируем в буфер обмена
    navigator.clipboard.writeText(listText).then(() => {
        showNotification('Список скопирован в буфер обмена!');
    }).catch(() => {
        // Альтернативный способ для мобильных
        const textArea = document.createElement('textarea');
        textArea.value = listText;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showNotification('Список скопирован!');
    });
}

// Синхронизация с облаком (localStorage)
function syncWithCloud() {
    document.getElementById('syncModal').style.display = 'block';
}

function closeModal() {
    document.getElementById('syncModal').style.display = 'none';
}

function exportToCloud() {
    const productList = document.getElementById('productList').innerHTML;
    localStorage.setItem('shoppingListCloud', productList);
    showNotification('Список сохранён в облако!');
    closeModal();
}

function importFromCloud() {
    const savedList = localStorage.getItem('shoppingListCloud');
    if (savedList) {
        document.getElementById('productList').innerHTML = savedList;
        saveProducts();
        restoreEventListeners();
        showNotification('Список загружен из облака!');
        closeModal();
    } else {
        showNotification('Нет сохранённых данных');
    }
}

// Восстановление обработчиков событий
function restoreEventListeners() {
    document.querySelectorAll('.delete-btn').forEach(button => {
        button.onclick = function() { deleteProduct(this); };
    });

    document.querySelectorAll('.product-checkbox').forEach(checkbox => {
        checkbox.onchange = function() { toggleProduct(this); };
    });
}

// Уведомления
function showNotification(message) {
    let notification = document.getElementById('notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'notification';
        notification.className = 'notification';
        document.body.appendChild(notification);
    }

    notification.textContent = message;
    notification.style.display = 'block';

    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

// Получение правильной формы слова
function getWordForm(number, titles) {
    const cases = [2, 0, 1, 1, 1, 2];
    return titles[(number % 100 > 4 && number % 100 < 20) ? 2 : cases[(number % 10 < 5) ? number % 10 : 5]];
}

// Закрытие модального окна по клику вне его
window.onclick = function(event) {
    const modal = document.getElementById('syncModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
}