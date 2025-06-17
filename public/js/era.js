document.addEventListener('DOMContentLoaded', function() {
    const commentForm = document.getElementById('commentForm');
    
    if (commentForm) {
        commentForm.onsubmit = async function(e) {
            e.preventDefault();
            
            const formData = {
                nickname: document.getElementById('nickname').value,
                email: document.getElementById('email').value,
                content: document.getElementById('content').value
            };
            
            try {
                const response = await fetch('/feedback/comment/' + eraId, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });
                
                if (response.ok) {
                    window.location.reload();
                } else {
                    const data = await response.json();
                    alert(data.error || 'Ошибка при отправке комментария');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Ошибка при отправке комментария');
            }
        };
    }

    const editEraBtn = document.getElementById('editEraBtn');
    const deleteEraBtn = document.getElementById('deleteEraBtn');
    const editEraModal = document.getElementById('editEraModal');
    
    if (editEraBtn && deleteEraBtn && editEraModal) {
        const closeBtn = editEraModal.querySelector('.close');
        const editEraForm = document.getElementById('editEraForm');
        const deleteButtons = document.querySelectorAll('.delete-comment');

        editEraBtn.onclick = function() {
            editEraModal.style.display = 'block';
        };

        closeBtn.onclick = function() {
            editEraModal.style.display = 'none';
        };

        window.onclick = function(event) {
            if (event.target == editEraModal) {
                editEraModal.style.display = 'none';
            }
        };

        editEraForm.onsubmit = async function(e) {
            e.preventDefault();
            
            const formData = {
                title: document.getElementById('title').value,
                description: document.getElementById('description').value,
                start_year: parseInt(document.getElementById('start_year').value),
                end_year: parseInt(document.getElementById('end_year').value),
                tags: document.getElementById('tags').value
            };

            try {
                const response = await fetch(`/admin/eras/${eraId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formData)
                });
                
                if (response.ok) {
                    window.location.reload();
                } else {
                    const data = await response.json();
                    alert(data.error || 'Ошибка при редактировании эпохи');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Ошибка при редактировании эпохи');
            }
        };

        deleteEraBtn.onclick = async function() {
            if (confirm('Вы уверены, что хотите удалить эту эпоху?')) {
                try {
                    const response = await fetch(`/admin/eras/${eraId}`, {
                        method: 'DELETE'
                    });
                    
                    if (response.ok) {
                        window.location.href = '/eras';
                    } else {
                        alert('Ошибка при удалении эпохи');
                    }
                } catch (error) {
                    console.error('Error:', error);
                    alert('Ошибка при удалении эпохи');
                }
            }
        };

        deleteButtons.forEach(button => {
            button.onclick = async function() {
                const commentId = this.closest('.comment').dataset.id;
                if (confirm('Вы уверены, что хотите удалить этот комментарий?')) {
                    try {
                        const response = await fetch(`/feedback/comment/${commentId}`, {
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
                }
            };
        });
    }
}); 