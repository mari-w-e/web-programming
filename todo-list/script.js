(function () {
  const STORAGE_KEY = 'todo_app_tasks_v1';

  function el(tag, props = {}) {
    const elem = document.createElement(tag);
    if (props.className) elem.className = props.className;
    if (props.text) elem.textContent = props.text;
    if (props.attrs) {
      for (const [k, v] of Object.entries(props.attrs)) elem.setAttribute(k, v);
    }
    return elem;
  }

  function saveTasks(tasks) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }

  function loadTasks() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function formatDateInputValue(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d)) return '';
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  function formatDateReadable(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d)) return '';
    return d.toLocaleDateString('ru-RU');
  }

  function generateId() {
    return 't_' + Math.random().toString(36).slice(2, 9);
  }

  // === Стили ===
  const styles = `
    :root {
      --bg: #f7c774;
      --panel-bg: #ffffff;
      --accent: #f7c774;
      --muted: #666;
      --shadow: 0 6px 18px rgba(0,0,0,0.12);
    }
    html,body {
      height:100%;
      margin:0;
      font-family: Inter, Roboto, Arial, sans-serif;
      background: var(--bg);
    }
    main.app-root {
      min-height:100vh;
      display:flex;
      flex-direction:column;
      align-items:center;
      justify-content:flex-start;
      padding:24px;
      box-sizing:border-box;
      gap:16px;
    }
    h1.page-title {
      text-align:center;
      font-size:26px;
      font-weight:700;
      margin-bottom:4px;
    }
    .todo-card {
      width:100%;
      max-width:420px;
      background:var(--panel-bg);
      border-radius:12px;
      box-shadow:var(--shadow);
      padding:18px;
      display:flex;
      flex-direction:column;
      box-sizing:border-box;
    }
    header.title {
      text-align:center;
      font-size:18px;
      font-weight:600;
      margin-bottom:12px;
    }
    form.todo-form {
      display:flex;
      flex-direction:column;
      gap:8px;
      margin-bottom:8px;
    }
    .field-row { display:flex; gap:8px; flex-wrap:wrap; }
    input.task-input, input.date-input, input.search-input, select.filter-select {
      padding:10px 12px;
      border-radius:8px;
      border:1px solid #ccc;
      font-size:14px;
      box-sizing:border-box;
      width:100%;
    }
    input.date-input:empty::before {
      content: "Дата";
      color: #aaa;
    }
    input.date-input::placeholder {
      color: #aaa;
    }
    button.primary-btn, button.sort-btn {
      border:0;
      border-radius:8px;
      padding:10px 12px;
      background:var(--accent);
      color:black;
      font-weight:600;
      cursor:pointer;
    }
    .controls { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:12px; }
    ul.tasks-list { list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:8px; }
    li.task-item {
      display:flex; align-items:center; gap:10px;
      background:#fafafa; border:1px solid #eee;
      border-radius:8px; padding:10px;
      justify-content:space-between;
    }
    .task-title.completed { text-decoration:line-through; color:var(--muted); }
    .task-content { flex:1; overflow:hidden; }
    .task-actions { display:flex; gap:6px; }
    .icon-btn { background:transparent; border:0; cursor:pointer; font-size:16px; }
    .no-tasks { text-align:center; color:var(--muted); padding:18px; }
    .error-message {
      color: red;
      font-size: 13px;
      text-align:center;
      margin-bottom:6px;
    }
    @media (max-width:480px) {
      .todo-card { padding:12px; border-radius:10px; }
      button.primary-btn { width:100%; }
    }
  `;
  const styleElem = el('style');
  styleElem.textContent = styles;
  document.head.appendChild(styleElem);

  // === Разметка ===
  const main = el('main', { className: 'app-root' });
  const pageTitle = el('h1', { className: 'page-title', text: 'TODO list' });
  main.appendChild(pageTitle);

  // Первая плашка — создание задачи
  const createCard = el('section', { className: 'todo-card' });
  const header1 = el('header', { className: 'title', text: 'Создать задачу' });

  const form = el('form', { className: 'todo-form' });
  const errorMsg = el('div', { className: 'error-message' });

  const row = el('div', { className: 'field-row' });
  const inputTitle = el('input', { className: 'task-input', attrs: { type: 'text', placeholder: 'Название задачи' } });
  const inputDate = el('input', { className: 'date-input', attrs: { type: 'date', placeholder: 'Дата' } });
  const addBtn = el('button', { className: 'primary-btn', attrs: { type: 'submit' }, text: 'Добавить задачу' });
  row.append(inputTitle, inputDate);
  form.append(errorMsg, row, addBtn);
  createCard.append(header1, form);

  // Вторая плашка — список задач
  const listCard = el('section', { className: 'todo-card' });
  const header2 = el('header', { className: 'title', text: 'Список задач' });

  const controls = el('div', { className: 'controls' });
  const filterSelect = el('select', { className: 'filter-select' });
  ['all:Все', 'active:Активные', 'done:Выполненные'].forEach(pair => {
    const [val, text] = pair.split(':');
    const opt = el('option', { text });
    opt.value = val;
    filterSelect.appendChild(opt);
  });
  const sortBtn = el('button', { className: 'sort-btn', attrs: { type: 'button' }, text: 'Сортировать по дате ↑' });
  const searchInput = el('input', { className: 'search-input', attrs: { type: 'search', placeholder: 'Поиск...' } });
  controls.append(filterSelect, sortBtn, searchInput);

  const listContainer = el('div');
  const tasksList = el('ul', { className: 'tasks-list' });
  const noTasks = el('div', { className: 'no-tasks', text: 'Задач нет' });
  listContainer.appendChild(tasksList);

  listCard.append(header2, controls, listContainer);

  main.append(createCard, listCard);
  document.body.appendChild(main);

  // === Данные и логика ===
  let tasks = loadTasks().map((t, i) => ({ order: i, ...t }));
  let sortOrder = 'asc';
  let currentFilter = 'all';
  let currentSearch = '';

  function renderTasks() {
    tasksList.innerHTML = '';
    const filtered = tasks
      .filter(t => {
        if (currentFilter === 'active' && t.completed) return false;
        if (currentFilter === 'done' && !t.completed) return false;
        if (currentSearch && !t.title.toLowerCase().includes(currentSearch.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => {
        if (!a.date && !b.date) return 0;
        if (!a.date) return 1;
        if (!b.date) return -1;
        return sortOrder === 'asc'
          ? new Date(a.date) - new Date(b.date)
          : new Date(b.date) - new Date(a.date);
      });

    if (filtered.length === 0) {
      if (!listContainer.contains(noTasks)) listContainer.appendChild(noTasks);
      return;
    } else if (listContainer.contains(noTasks)) listContainer.removeChild(noTasks);

    filtered.forEach(task => {
      const li = el('li', { className: 'task-item' });
      const leftBox = el('div', { className: 'task-content' });
      const checkbox = el('input', { attrs: { type: 'checkbox' } });
      checkbox.checked = task.completed;
      checkbox.addEventListener('change', () => {
        task.completed = checkbox.checked;
        saveTasks(tasks);
        renderTasks();
      });

      const title = el('div', { className: 'task-title', text: task.title });
      if (task.completed) title.classList.add('completed');
      const date = el('div', { className: 'task-date', text: formatDateReadable(task.date) });
      leftBox.append(checkbox, title, date);

      const actions = el('div', { className: 'task-actions' });
      const editBtn = el('button', { className: 'icon-btn', text: '✏️' });
      editBtn.addEventListener('click', () => enterEditMode(li, task));
      const delBtn = el('button', { className: 'icon-btn', text: '🗑️' });
      delBtn.addEventListener('click', () => {
        tasks = tasks.filter(t => t.id !== task.id);
        saveTasks(tasks);
        renderTasks();
      });
      actions.append(editBtn, delBtn);

      const leftBox = el('div', { className: 'task-left' });
      leftBox.style.display = 'flex';
      leftBox.style.alignItems = 'center';
      leftBox.style.gap = '10px';
      leftBox.append(checkbox, content);
    
      li.append(leftBox, actions);
      tasksList.appendChild(li);
    });

  }

  function enterEditMode(li, task) {
    li.innerHTML = '';
    const titleInput = el('input', { attrs: { type: 'text' } });
    titleInput.value = task.title;
    const dateInput = el('input', { attrs: { type: 'date' } });
    dateInput.value = formatDateInputValue(task.date);
    const saveBtn = el('button', { className: 'primary-btn', text: 'Сохранить' });
    saveBtn.style.width = '100%';

    saveBtn.addEventListener('click', () => {
      task.title = titleInput.value.trim() || '(Без названия)';
      task.date = formatDateInputValue(dateInput.value);
      saveTasks(tasks);
      renderTasks();
    });

    li.append(titleInput, dateInput, saveBtn);
  }

  form.addEventListener('submit', e => {
    e.preventDefault();
    errorMsg.textContent = '';
    const titleVal = inputTitle.value.trim();
    const dateVal = inputDate.value.trim();

    if (!titleVal) {
      errorMsg.textContent = 'Название задачи — обязательное поле!';
      return;
    }
    if (!dateVal) {
      errorMsg.textContent = 'Дата — обязательное поле!';
      return;
    }
    const today = new Date();
    const chosen = new Date(dateVal);
    today.setHours(0,0,0,0);
    if (chosen < today) {
      errorMsg.textContent = 'Дата не может быть в прошлом!';
      return;
    }

    const newTask = {
      id: generateId(),
      title: titleVal,
      date: formatDateInputValue(dateVal),
      completed: false,
      order: tasks.length
    };
    tasks.push(newTask);
    saveTasks(tasks);
    inputTitle.value = '';
    inputDate.value = '';
    renderTasks();
  });

  sortBtn.addEventListener('click', () => {
    sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    sortBtn.textContent = sortOrder === 'asc' ? 'Сортировать по дате ↑' : 'Сортировать по дате ↓';
    renderTasks();
  });

  filterSelect.addEventListener('change', e => {
    currentFilter = e.target.value;
    renderTasks();
  });

  searchInput.addEventListener('input', e => {
    currentSearch = e.target.value;
    renderTasks();
  });

  renderTasks();
})();
