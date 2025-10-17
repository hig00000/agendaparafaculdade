 document.addEventListener('DOMContentLoaded', () => {
            // Seletores de elementos do DOM
            const taskForm = document.getElementById('task-form');
            const taskList = document.getElementById('task-list');
            const emptyMessage = document.getElementById('empty-message');
            const feedbackForm = document.getElementById('feedback-form');
            const modalContainer = document.getElementById('modal-container');
            const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
            const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
            
            let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
            let taskToDeleteId = null;

            // Mapa de tipos e classes para estilização
            const typeStyles = {
                prova: { label: 'Prova', className: 'type-prova' },
                trabalho: { label: 'Trabalho', className: 'type-trabalho' },
                atividade: { label: 'Atividade', className: 'type-atividade' },
                projeto: { label: 'Projeto', className: 'type-projeto' },
                lembrete: { label: 'Lembrete', className: 'type-lembrete' },
                outro: { label: 'Outro', className: 'type-outro' }
            };

            // Função para renderizar os compromissos na tela
            const renderTasks = () => {
                taskList.innerHTML = '';
                if (tasks.length === 0) {
                    taskList.appendChild(emptyMessage);
                    emptyMessage.style.display = 'block';
                } else {
                    emptyMessage.style.display = 'none';
                    // Ordena as tarefas pela data
                    tasks.sort((a, b) => new Date(a.date) - new Date(b.date));
                    
                    tasks.forEach(task => {
                        const style = typeStyles[task.type] || typeStyles.outro;
                        const formattedDate = new Date(task.date + 'T00:00:00-03:00').toLocaleDateString('pt-BR');

                        const taskElement = document.createElement('div');
                        taskElement.className = `task-item ${style.className}`;
                         if (task.completed) {
                            taskElement.classList.add('completed');
                        }
                        
                        taskElement.innerHTML = `
                            <div class="task-content">
                                <button data-id="${task.id}" class="toggle-btn">
                                    <svg class="check-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" /></svg>
                                </button>
                                <div class="task-details">
                                    <p class="task-title">${task.title}</p>
                                    <p class="task-meta">${formattedDate} - <span>${style.label}</span></p>
                                </div>
                            </div>
                            <button data-id="${task.id}" class="delete-btn">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        `;
                        taskList.appendChild(taskElement);
                    });
                }
            };

            // Função para salvar tarefas no localStorage
            const saveTasks = () => {
                localStorage.setItem('tasks', JSON.stringify(tasks));
            };

            // Adicionar novo compromisso
            taskForm.addEventListener('submit', e => {
                e.preventDefault();
                const title = e.target['task-title'].value.trim();
                const date = e.target['task-date'].value;
                const type = e.target['task-type'].value;

                if (title && date) {
                    const newTask = {
                        id: Date.now(),
                        title,
                        date,
                        type,
                        completed: false
                    };
                    tasks.push(newTask);
                    saveTasks();
                    renderTasks();
                    taskForm.reset();
                }
            });

            // Lidar com cliques na lista (toggle/delete)
            taskList.addEventListener('click', e => {
                const target = e.target.closest('button');
                if (!target) return;

                const id = Number(target.dataset.id);

                if (target.classList.contains('toggle-btn')) {
                    const task = tasks.find(t => t.id === id);
                    if (task) {
                        task.completed = !task.completed;
                        saveTasks();
                        renderTasks();
                    }
                }

                if (target.classList.contains('delete-btn')) {
                    taskToDeleteId = id;
                    modalContainer.style.display = 'flex';
                }
            });

            // Lidar com o envio do feedback
            feedbackForm.addEventListener('submit', e => {
                e.preventDefault();
                alert('Obrigado pelo seu feedback!');
                feedbackForm.reset();
            });

            // Funções do modal de exclusão
            const closeModal = () => {
                modalContainer.style.display = 'none';
                taskToDeleteId = null;
            }

            confirmDeleteBtn.addEventListener('click', () => {
                if (taskToDeleteId) {
                    tasks = tasks.filter(task => task.id !== taskToDeleteId);
                    saveTasks();
                    renderTasks();
                    closeModal();
                }
            });

            cancelDeleteBtn.addEventListener('click', closeModal);
            
            modalContainer.addEventListener('click', (e) => {
                if (e.target === modalContainer) {
                    closeModal();
                }
            });

            // Renderização inicial
            renderTasks();
        });