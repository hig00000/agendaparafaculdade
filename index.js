// --- FUNÇÃO DE CALLBACK DO LOGIN GOOGLE ---
        // Anexamos a função diretamente ao objeto 'window' para garantir que ela seja global
        // e acessível pela biblioteca do Google, resolvendo o erro 'callback is not a function'.
        window.handleCredentialResponse = function(response) {
            console.log("Login com Google bem-sucedido!");
            // Dispara um evento personalizado para que a nossa aplicação, que corre dentro do DOMContentLoaded,
            // saiba que o login aconteceu.
            document.dispatchEvent(new CustomEvent('google-login-success'));
        };

        document.addEventListener('DOMContentLoaded', () => {
            // --- SELETORES GERAIS E DE VIEWS ---
            const loginView = document.getElementById('login-view');
            const registerView = document.getElementById('register-view');
            const appView = document.getElementById('app-view');
            const logoutBtn = document.getElementById('logout-btn');
            
            // --- SELETORES DE LOGIN E REGISTO ---
            const loginForm = document.getElementById('login-form');
            const registerForm = document.getElementById('register-form');
            const loginError = document.getElementById('login-error');
            const registerError = document.getElementById('register-error');
            const registerSuccess = document.getElementById('register-success');
            const showRegisterLink = document.getElementById('show-register-link');
            const showLoginLink = document.getElementById('show-login-link');

            // --- SELETORES DA AGENDA ---
            const taskForm = document.getElementById('task-form');
            const taskList = document.getElementById('task-list');
            const emptyMessage = document.getElementById('empty-message');
            const feedbackForm = document.getElementById('feedback-form');
            const modalContainer = document.getElementById('modal-container');
            const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
            const cancelDeleteBtn = document.getElementById('cancel-delete-btn');

            let tasks = [];
            let taskToDeleteId = null;

            const typeStyles = { prova: { label: 'Prova' }, trabalho: { label: 'Trabalho' }, atividade: { label: 'Atividade' }, projeto: { label: 'Projeto' }, lembrete: { label: 'Lembrete' }, outro: { label: 'Outro' } };

            // --- FUNÇÕES DE LÓGICA PRINCIPAL ---

            const loadUserTasks = () => {
                const currentUserEmail = localStorage.getItem('currentUser');
                if (currentUserEmail) {
                    tasks = JSON.parse(localStorage.getItem(`tasks_${currentUserEmail}`)) || [];
                } else {
                    tasks = [];
                }
                renderTasks();
            };

            const saveTasks = () => {
                const currentUserEmail = localStorage.getItem('currentUser');
                if (currentUserEmail) {
                    localStorage.setItem(`tasks_${currentUserEmail}`, JSON.stringify(tasks));
                }
            };
            
            const enterApp = (userEmail) => {
                localStorage.setItem('userLoggedIn', 'true');
                localStorage.setItem('currentUser', userEmail);
                loadUserTasks();
                updateView();
            };

            const logout = () => {
                localStorage.removeItem('userLoggedIn');
                localStorage.removeItem('currentUser');
                tasks = [];
                updateView();
            };

            const updateView = () => {
                if (localStorage.getItem('userLoggedIn') === 'true') {
                    loginView.classList.add('hidden');
                    registerView.classList.add('hidden');
                    appView.classList.remove('hidden');
                } else {
                    loginView.classList.remove('hidden');
                    registerView.classList.add('hidden');
                    appView.classList.add('hidden');
                }
            };

            // --- LÓGICA DE LOGIN E REGISTO ---

            showRegisterLink.addEventListener('click', (e) => {
                e.preventDefault();
                loginView.classList.add('hidden');
                registerView.classList.remove('hidden');
            });

            showLoginLink.addEventListener('click', (e) => {
                e.preventDefault();
                registerView.classList.add('hidden');
                loginView.classList.remove('hidden');
            });

            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const email = document.getElementById('register-email').value;
                const password = document.getElementById('register-password').value;
                let users = JSON.parse(localStorage.getItem('users')) || [];

                if (users.find(user => user.email === email)) {
                    registerError.classList.remove('hidden');
                    registerSuccess.classList.add('hidden');
                } else {
                    users.push({ email, password });
                    localStorage.setItem('users', JSON.stringify(users));
                    registerError.classList.add('hidden');
                    registerSuccess.classList.remove('hidden');
                    registerForm.reset();
                }
            });

            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const email = document.getElementById('login-email').value;
                const password = document.getElementById('login-password').value;
                let users = JSON.parse(localStorage.getItem('users')) || [];
                
                const foundUser = users.find(user => user.email === email && user.password === password);

                if (foundUser) {
                    enterApp(foundUser.email);
                    loginError.classList.add('hidden');
                } else {
                    loginError.classList.remove('hidden');
                }
            });
            
            document.addEventListener('google-login-success', () => {
                const googleUserEmail = 'google_user_placeholder@google.com';
                enterApp(googleUserEmail);
            });

            logoutBtn.addEventListener('click', logout);

            // --- LÓGICA DA AGENDA ---
            const renderTasks = () => {
                taskList.innerHTML = '';
                if (tasks.length === 0) {
                    taskList.appendChild(emptyMessage);
                    emptyMessage.style.display = 'block';
                } else {
                    emptyMessage.style.display = 'none';
                    tasks.sort((a, b) => new Date(a.date) - new Date(b.date));
                    tasks.forEach(task => {
                        const style = typeStyles[task.type] || typeStyles.outro;
                        const formattedDate = new Date(task.date + 'T00:00:00-03:00').toLocaleDateString('pt-BR');
                        const taskElement = document.createElement('div');
                        taskElement.className = `task-item type-${task.type}`;
                        if (task.completed) taskElement.classList.add('completed');
                        taskElement.innerHTML = `<div class="task-content"><button data-id="${task.id}" class="toggle-btn"><svg class="check-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" /></svg></button><div class="task-details"><p class="task-title">${task.title}</p><p class="task-meta">${formattedDate} - <span>${style.label}</span></p></div></div><button data-id="${task.id}" class="delete-btn"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>`;
                        taskList.appendChild(taskElement);
                    });
                }
            };

            if(taskForm) {
                taskForm.addEventListener('submit', e => {
                    e.preventDefault();
                    const title = document.getElementById('task-title').value.trim();
                    const date = document.getElementById('task-date').value;
                    const type = document.getElementById('task-type').value;
                    if (title && date) {
                        tasks.push({ id: Date.now(), title, date, type, completed: false });
                        saveTasks();
                        renderTasks();
                        taskForm.reset();
                    }
                });

                taskList.addEventListener('click', e => {
                    const target = e.target.closest('button');
                    if (!target) return;
                    const id = Number(target.dataset.id);
                    if (target.classList.contains('toggle-btn')) {
                        const task = tasks.find(t => t.id === id);
                        if (task) { task.completed = !task.completed; saveTasks(); renderTasks(); }
                    }
                    if (target.classList.contains('delete-btn')) {
                        taskToDeleteId = id;
                        modalContainer.style.display = 'flex';
                    }
                });
            }

            const closeModal = () => {
                modalContainer.style.display = 'none';
                taskToDeleteId = null;
            };
            confirmDeleteBtn.addEventListener('click', () => {
                tasks = tasks.filter(t => t.id !== taskToDeleteId);
                saveTasks();
                renderTasks();
                closeModal();
            });
            cancelDeleteBtn.addEventListener('click', closeModal);
            modalContainer.addEventListener('click', (e) => { if (e.target === modalContainer) closeModal(); });

            feedbackForm.addEventListener('submit', e => {
                e.preventDefault();
                alert('Obrigado pelo seu feedback!');
                feedbackForm.reset();
            });

            // --- INICIALIZAÇÃO DA APLICAÇÃO ---
            updateView(); 
            if (localStorage.getItem('userLoggedIn') === 'true') {
                loadUserTasks();
            }
        });