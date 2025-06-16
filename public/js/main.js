// Функция для валидации форм
function validateForm(form) {
    const inputs = form.querySelectorAll('input[required], textarea[required]');
    let isValid = true;

    inputs.forEach(input => {
        if (!input.value.trim()) {
            isValid = false;
            input.classList.add('error');
        } else {
            input.classList.remove('error');
        }
    });

    return isValid;
}

// Функция для отображения уведомлений
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Функция для обработки ошибок
function handleError(error) {
    console.error('Error:', error);
    showNotification('Произошла ошибка. Пожалуйста, попробуйте позже.', 'error');
}

// Функция для работы с модальными окнами
function setupModal(modalId, openBtnId, closeBtnClass) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    const openBtn = document.getElementById(openBtnId);
    const closeBtn = modal.querySelector('.' + closeBtnClass);

    if (openBtn) {
        openBtn.onclick = function() {
            modal.style.display = 'block';
        };
    }

    if (closeBtn) {
        closeBtn.onclick = function() {
            modal.style.display = 'none';
        };
    }

    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    };
}

// Функция для фильтрации контента
function setupFilters(searchInputId, filterSelects, itemsSelector) {
    const searchInput = document.getElementById(searchInputId);
    const items = document.querySelectorAll(itemsSelector);

    function filterItems() {
        const searchTerm = searchInput.value.toLowerCase();
        const selectedFilters = Array.from(filterSelects).map(select => ({
            name: select.id,
            value: select.value.toLowerCase()
        }));

        items.forEach(item => {
            const text = item.textContent.toLowerCase();
            const matchesSearch = text.includes(searchTerm);
            const matchesFilters = selectedFilters.every(filter => {
                if (!filter.value) return true;
                return item.dataset[filter.name]?.toLowerCase().includes(filter.value);
            });

            item.style.display = matchesSearch && matchesFilters ? 'block' : 'none';
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', filterItems);
    }

    filterSelects.forEach(select => {
        select.addEventListener('change', filterItems);
    });
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    // Настройка модальных окон
    setupModal('addEraModal', 'addEraBtn', 'close');
    setupModal('editEraModal', 'editEraBtn', 'close');
    setupModal('social-modal', null, 'close');

    // Настройка фильтров на странице эпох
    const filterSelects = document.querySelectorAll('#yearFilter, #tagFilter');
    if (filterSelects.length > 0) {
        setupFilters('searchInput', filterSelects, '.era-card');
    }

    // Валидация форм
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            if (!validateForm(this)) {
                e.preventDefault();
                showNotification('Пожалуйста, заполните все обязательные поля', 'error');
            }
        });
    });

    // Обработка форм
    const editEraForm = document.getElementById('editEraForm');
    if (editEraForm) {
        editEraForm.onsubmit = async function(e) {
            e.preventDefault();
            const formData = new FormData(editEraForm);
            
            try {
                const response = await fetch(`/admin/eras/${eraId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        title: formData.get('title'),
                        description: formData.get('description'),
                        start_year: parseInt(formData.get('start_year')),
                        end_year: parseInt(formData.get('end_year')),
                        tags: formData.get('tags')
                    })
                });
                
                if (response.ok) {
                    window.location.reload();
                } else {
                    const data = await response.json();
                    alert(data.error || 'Ошибка при обновлении эпохи');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Ошибка при обновлении эпохи');
            }
        };
    }

    const addEraForm = document.getElementById('addEraForm');
    if (addEraForm) {
        addEraForm.onsubmit = async function(e) {
            e.preventDefault();
            
            const formData = new FormData();
            formData.append('title', document.getElementById('title').value);
            formData.append('description', document.getElementById('description').value);
            formData.append('start_year', document.getElementById('start_year').value);
            formData.append('end_year', document.getElementById('end_year').value);
            formData.append('tags', document.getElementById('tags').value);
            
            const imageFile = document.getElementById('image').files[0];
            if (imageFile) {
                formData.append('image', imageFile);
            }
            
            try {
                const response = await fetch('/admin/eras', {
                    method: 'POST',
                    body: formData
                });
                
                if (response.ok) {
                    window.location.reload();
                } else {
                    const data = await response.json();
                    alert(data.error || 'Ошибка при добавлении эпохи');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Ошибка при добавлении эпохи');
            }
        };
    }

    // Обработка удаления комментариев
    const deleteCommentButtons = document.querySelectorAll('.delete-comment');
    deleteCommentButtons.forEach(button => {
        button.onclick = async function() {
            if (!confirm('Вы уверены, что хотите удалить этот комментарий?')) {
                return;
            }

            const commentId = this.closest('.comment').dataset.id;
            try {
                const response = await fetch(`/admin/comments/${commentId}`, {
                    method: 'DELETE'
                });
                
                if (response.ok) {
                    this.closest('.comment').remove();
                } else {
                    alert('Ошибка при удалении комментария');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Ошибка при удалении комментария');
            }
        };
    });
}); 