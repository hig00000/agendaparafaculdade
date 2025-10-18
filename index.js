  document.addEventListener('DOMContentLoaded', () => {
            // Acede às funções do Firebase através do objeto global 'firebase'
            const { initializeApp } = firebase.app;
            const { 
                getAuth, 
                onAuthStateChanged,
                createUserWithEmailAndPassword,
                signInWithEmailAndPassword,
                GoogleAuthProvider,
                signInWithPopup,
                signOut,
                sendPasswordResetEmail
            } = firebase.auth;
            const { 
                getFirestore,
                collection,
                addDoc,
                query,
                onSnapshot,
                doc,
                deleteDoc,
                updateDoc,
                orderBy
            } = firebase.firestore;

            // SUA CONFIGURAÇÃO DO FIREBASE INSERIDA AQUI
            const firebaseConfig = {
                apiKey: "AIzaSyCaVT809lffsjvs1UM1FR9uym6U0ziUYiw",
                authDomain: "academico-on.firebaseapp.com",
                projectId: "academico-on",
                storageBucket: "academico-on.appspot.com",
                messagingSenderId: "806836722763",
                appId: "1:806836722763:web:ed397b1a0bfc369aa301ce",
                measurementId: "G-D1PRCL6DNF"
            };

            // Inicializa o Firebase e os seus serviços
            const app = initializeApp(firebaseConfig);
            const auth = getAuth(app);
            const db = getFirestore(app);
            const googleProvider = new GoogleAuthProvider();

            // --- SELETORES GERAIS E DE VIEWS ---
            const loginView = document.getElementById('login-view');
            const registerView = document.getElementById('register-view');
            const resetView = document.getElementById('reset-view');
            const appView = document.getElementById('app-view');
            const logoutBtn = document.getElementById('logout-btn');
            
            // --- SELETORES DE AUTENTICAÇÃO ---
            const loginForm = document.getElementById('login-form');
            const registerForm = document.getElementById('register-form');
            const resetForm = document.getElementById('reset-form');
            const googleLoginBtn = document.getElementById('google-login-btn');
            
            const loginError = document.getElementById('login-error');
            const registerError = document.getElementById('register-error');
            const resetError = document.getElementById('reset-error');
            const resetSuccess = document.getElementById('reset-success');

            const showRegisterLink = document.getElementById('show-register-link');
            const showLoginLink = document.getElementById('show-login-link');
            const showResetLink = document.getElementById('show-reset-link');
            const showLoginLinkFromReset = document.getElementById('show-login-link-from-reset');

            // --- SELETORES DA AGENDA ---
            const taskForm = document.getElementById('task-form');
            const taskList = document.getElementById('task-list');
            const emptyMessage = document.getElementById('empty-message');
            const feedbackForm = document.getElementById('feedback-form');
            const modalContainer = document.getElementById('modal-container');
            const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
            const cancelDeleteBtn = document.getElementById('cancel-delete-btn');

            let taskToDeleteId = null;
            let unsubscribeTasks; // Para parar de ouvir as tarefas quando o utilizador sai

            const typeStyles = { prova: { label: 'Prova' }, trabalho: { label: 'Trabalho' }, atividade: { label: 'Atividade' }, projeto: { label: 'Projeto' }, lembrete: { label: 'Lembrete' }, outro: { label: 'Outro' } };

            // --- FUNÇÕES DE NAVEGAÇÃO ENTRE TELAS ---
            function showView(viewToShow) {
                [loginView, registerView, resetView, appView].forEach(view => view.classList.add('hidden'));
                viewToShow.classList.remove('hidden');
            }

            // --- LÓGICA DE AUTENTICAÇÃO (FIREBASE) ---
            onAuthStateChanged(auth, user => {
                if (user) {
                    console.log("Utilizador autenticado:", user.uid);
                    showView(appView);
                    listenToTasks(user.uid);
                } else {
                    console.log("Nenhum utilizador autenticado.");
                    if (unsubscribeTasks) unsubscribeTasks(); // Para de ouvir as tarefas
                    showView(loginView);
                }
            });

            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const email = registerForm['register-email'].value;
                const password = registerForm['register-password'].value;

                createUserWithEmailAndPassword(auth, email, password)
                    .then(userCredential => {
                        console.log("Conta criada com sucesso!", userCredential.user);
                        registerForm.reset();
                        showView(loginView);
                    })
                    .catch(error => {
                        registerError.textContent = "Erro: O email já está em uso ou a senha é muito fraca.";
                        registerError.classList.remove('hidden');
                    });
            });

            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const email = loginForm['login-email'].value;
                const password = loginForm['login-password'].value;
                
                signInWithEmailAndPassword(auth, email, password)
                    .catch(error => {
                        loginError.textContent = "Erro: Email ou senha inválidos.";
                        loginError.classList.remove('hidden');
                    });
            });

            googleLoginBtn.addEventListener('click', () => {
                signInWithPopup(auth, googleProvider)
                    .catch(error => {
                        console.error("Erro no login com Google:", error);
                        loginError.textContent = "Erro ao tentar entrar com o Google.";
                        loginError.classList.remove('hidden');
                    });
            });

            resetForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const email = resetForm['reset-email'].value;
                
                sendPasswordResetEmail(auth, email)
                    .then(() => {
                        resetSuccess.textContent = "Email de recuperação enviado com sucesso!";
                        resetSuccess.classList.remove('hidden');
                        resetError.classList.add('hidden');
                    })
                    .catch(error => {
                        resetError.textContent = "Erro: Este email não foi encontrado.";
                        resetError.classList.remove('hidden');
                        resetSuccess.classList.add('hidden');
                    });
            });

            logoutBtn.addEventListener('click', () => {
                signOut(auth);
            });

            // Navegação entre as telas de autenticação
            showRegisterLink.addEventListener('click', () => showView(registerView));
            showLoginLink.addEventListener('click', () => showView(loginView));
            showResetLink.addEventListener('click', () => showView(resetView));
            showLoginLinkFromReset.addEventListener('click', () => showView(loginView));


            // --- LÓGICA DA AGENDA (FIRESTORE) ---
            function listenToTasks(userId) {
                const tasksCollection = collection(db, 'users', userId, 'tasks');
                const q = query(tasksCollection, orderBy('date', 'asc'));

                unsubscribeTasks = onSnapshot(q, (querySnapshot) => {
                    const tasks = [];
                    querySnapshot.forEach((doc) => {
                        tasks.push({ id: doc.id, ...doc.data() });
                    });
                    renderTasks(tasks);
                });
            }

            function renderTasks(tasks) {
                taskList.innerHTML = '';
                if (tasks.length === 0) {
                    emptyMessage.style.display = 'block';
                } else {
                    emptyMessage.style.display = 'none';
                    tasks.forEach(task => {
                        const style = typeStyles[task.type] || typeStyles.outro;
                        const formattedDate = new Date(task.date + 'T00:00:00-03:00').toLocaleDateString('pt-BR');
                        const taskElement = document.createElement('div');
                        taskElement.className = `task-item type-${task.type}`;
                        if (task.completed) taskElement.classList.add('completed');
                        
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
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>`;

                        // Adicionar event listeners para os novos botões
                        taskElement.querySelector('.toggle-btn').addEventListener('click', () => {
                            const taskRef = doc(db, 'users', auth.currentUser.uid, 'tasks', task.id);
                            updateDoc(taskRef, { completed: !task.completed });
                        });
                        taskElement.querySelector('.delete-btn').addEventListener('click', () => {
                            taskToDeleteId = task.id;
                            modalContainer.style.display = 'flex';
                        });

                        taskList.appendChild(taskElement);
                    });
                }
            }

            taskForm.addEventListener('submit', e => {
                e.preventDefault();
                const title = taskForm['task-title'].value.trim();
                const date = taskForm['task-date'].value;
                const type = taskForm['task-type'].value;
                const userId = auth.currentUser.uid;

                if (title && date && userId) {
                    addDoc(collection(db, 'users', userId, 'tasks'), {
                        title,
                        date,
                        type,
                        completed: false,
                        createdAt: new Date()
                    }).then(() => {
                        taskForm.reset();
                    }).catch(error => {
                        console.error("Erro ao adicionar tarefa: ", error);
                    });
                }
            });

            function closeModal() {
                modalContainer.style.display = 'none';
                taskToDeleteId = null;
            }

            confirmDeleteBtn.addEventListener('click', () => {
                if (taskToDeleteId && auth.currentUser) {
                    deleteDoc(doc(db, 'users', auth.currentUser.uid, 'tasks', taskToDeleteId));
                }
                closeModal();
            });

            cancelDeleteBtn.addEventListener('click', closeModal);
            modalContainer.addEventListener('click', (e) => { if (e.target === modalContainer) closeModal(); });

            feedbackForm.addEventListener('submit', e => {
                e.preventDefault();
                alert('Obrigado pelo seu feedback!');
                feedbackForm.reset();
            });
        });