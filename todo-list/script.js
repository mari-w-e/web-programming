(function () {

  const STORAGE_KEY = 'todo_app_tasks_v1';
  const root = document.documentElement;

  function el(tag, props = {}) {
    const elem = document.createElement(tag);
    if (props.className) elem.className = props.className;
    if (props.text) elem.textContent = props.text;
    if (props.type) elem.type = props.type;
    if (props.placeholder) elem.placeholder = props.placeholder;
    if (props.id) elem.id = props.id;
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
      if (Array.isArray(parsed)) return parsed;
      return [];
    } catch (e) {
      console.warn('Failed to parse tasks from storage', e);
      return [];
    }
  }
  function formatDateInputValue(dateStr) {
    // Ensure YYYY-MM-DD or empty
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


  const styles = `
    :root {
      --bg: #f7c774;
      --panel-bg: #ffffff;
      --accent: #4a90e2;
      --muted: #666666;
      --success: #2e7d32;
      --danger: #c62828;
      --shadow: 0 6px 18px rgba(0,0,0,0.12);
      --max-width: 420px;
    }
    html,body {
      height:100%;
      margin:0;
      font-family: Inter, Roboto, "Helvetica Neue", Arial, sans-serif;
      -webkit-font-smoothing:antialiased;
      -moz-osx-font-smoothing:grayscale;
      background: var(--bg);
      color: #222;
    }
    main.app-root {
      min-height:100vh;
      display:flex;
      align-items:center;
      justify-content:center;
      padding:24px;
      box-sizing:border-box;
    }
    .todo-card {
      width:100%;
      max-width:var(--max-width);
      background:var(--panel-bg);
      border-radius:12px;
      box-shadow:var(--shadow);
      padding:18px;
      box-sizing:border-box;
      display:flex;
      flex-direction:column;
    }
    header.title {
      text-align:center;
      font-size:20px;
      font-weight:600;
      margin-bottom:12px;
    }
    form.todo-form {
      display:flex;
      flex-direction:column;
      gap:8px;
      margin-bottom:12px;
    }
    .field-row {
      display:flex;
      gap:8px;
      align-items:center;
    }
    input[type="text"].task-input {
      flex:1;
      padding:10px 12px;
      border-radius:8px;
      border:1px solid #ddd;
      font-size:14px;
      outline:none;
    }
    input[type="date"].date-input {
      padding:10px 12px;
      border-radius:8px;
      border:1px solid #ddd;
      font-size:14px;
      background:white;
    }
    button.primary-btn {
      padding:10px 12px;
      border-radius:8px;
      border:0;
      cursor:pointer;
      background:var(--accent);
      color:white;
      font-weight:600;
    }
    .controls {
      display:flex;
      gap:8px;
      align-items:center;
      margin-bottom:12px;
      flex-wrap:wrap;
    }
    select.filter-select, button.sort-btn, input.search-input {
      padding:8px 10px;
      border-radius:8px;
      border:1px solid #ddd;
      font-size:13px;
    }
    .tasks-list {
      display:flex;
      flex-direction:column;
      gap:8px;
      min-height:80px;
    }
    .task-item {
      display:flex;
      align-items:center;
      gap:10px;
      padding:10px;
      border-radius:8px;
      border:1px solid #f0f0f0;
      background: #fafafa;
    }
    .task-item.dragging {
      opacity:0.6;
      transform:scale(0.995);
    }
    .task-checkbox {
      width:18px;
      height:18px;
    }
    .task-content {
      flex:1;
      display:flex;
      flex-direction:column;
      gap:4px;
      min-width: 0;
    }
    .task-title {
      font-size:14px;
      white-space:nowrap;
      overflow:hidden;
      text-overflow:ellipsis;
    }
    .task-title.completed {
      text-decoration:line-through;
      color:var(--muted);
    }
    .task-date {
      font-size:12px;
      color:var(--muted);
    }
    .task-actions {
      display:flex;
      gap:6px;
    }
    .icon-btn {
      border:0;
      background:transparent;
      cursor:pointer;
      padding:6px;
      border-radius:6px;
    }
    .edit-mode input[type="text"] {
      padding:6px 8px;
      border-radius:6px;
      border:1px solid #ccc;
      font-size:13px;
    }
    .no-tasks {
      text-align:center;
      color:var(--muted);
      padding:18px 6px;
    }
    @media (max-width:480px) {
      .todo-card { padding:12px; border-radius:10px; }
      header.title { font-size:18px; }
      .field-row { flex-direction:column; align-items:stretch; }
      .controls { gap:6px; }
    }
  `;
  const styleElem = el('style');
  styleElem.textContent = styles;
  document.head.appendChild(styleElem);


  const main = el('main', { className: 'app-root' });
  const card = el('section', { className: 'todo-card' }); // semantic: section
  const header = el('header', { className: 'title' });
  header.textContent = 'TODO list';


  const form = el('form', { className: 'todo-form', attrs: { action: '#', 'aria-label': 'Добавить задачу' } });
  const fieldRow = el('div', { className: 'field-row' });
  const inputTitle = el('input', { className: 'task-input', attrs: { type: 'text', placeholder: 'Название задачи', 'aria-label': 'Название задачи' } });
  const inputDate = el('input', { className: 'date-input', attrs: { type: 'date', 'aria-label': 'Дата задачи' } });
  fieldRow.appendChild(inputTitle);
  fieldRow.appendChild(inputDate);
  const addBtn = el('button', { className: 'primary-btn', attrs: { type: 'submit' } });
  addBtn.textContent = 'Добавить задачу';

  form.appendChild(fieldRow);
  form.appendChild(addBtn);


  const controls = el('div', { className: 'controls' });
  const filterSelect = el('select', { className: 'filter-select', attrs: { 'aria-label': 'Фильтр задач' } });
  const optAll = el('option'); optAll.value = 'all'; optAll.textContent = 'Все';
  const optActive = el('option'); optActive.value = 'active'; optActive.textContent = 'Активные';
  const optDone = el('option'); optDone.value = 'done'; optDone.textContent = 'Выполненные';
  filterSelect.appendChild(optAll); filterSelect.appendChild(optActive); filterSelect.appendChild(optDone);

  const sortBtn = el('button', { className: 'sort-btn', attrs: { type: 'button', 'aria-pressed': 'false' } });
  sortBtn.textContent = 'Сортировать по дате ↑';

  const searchInput = el('input', { className: 'search-input', attrs: { type: 'search', placeholder: 'Поиск по названию', 'aria-label': 'Поиск задач' } });

  controls.appendChild(filterSelect);
  controls.appendChild(sortBtn);
  controls.appendChild(searchInput);

  const listContainer = el('div');
  const tasksList = el('ul', { className: 'tasks-list', attrs: { 'aria-live': 'polite' } });
  tasksList.setAttribute('role', 'list');

  const noTasks = el('div', { className: 'no-tasks' });
  noTasks.textContent = 'Задач нет';

  listContainer.appendChild(tasksList);


  card.appendChild(header);
  card.appendChild(form);
  card.appendChild(controls);
  card.appendChild(listContainer);
  main.appendChild(card);
  document.body.appendChild(main);


  let tasks = loadTasks(); // array of {id, title, date (YYYY-MM-DD), completed, order}
  // ensure order field
  tasks = tasks.map((t, idx) => ({ order: idx, ...t }));


  let sortOrder = 'asc';

  let currentFilter = 'all';

  let currentSearch = '';


  function renderTasks() {

    while (tasksList.firstChild) tasksList.removeChild(tasksList.firstChild);


    const filtered = tasks
      .slice()
      .sort((a, b) => (a.order - b.order)) 
      .filter(task => {
        if (currentFilter === 'active' && task.completed) return false;
        if (currentFilter === 'done' && !task.completed) return false;
        if (currentSearch && !task.title.toLowerCase().includes(currentSearch.toLowerCase())) return false;
        return true;
      });


    if (sortOrder) {

      if (sortOrder === 'asc') {
        filtered.sort((a, b) => {
          if (!a.date && !b.date) return 0;
          if (!a.date) return 1;
          if (!b.date) return -1;
          return new Date(a.date) - new Date(b.date);
        });
      } else if (sortOrder === 'desc') {
        filtered.sort((a, b) => {
          if (!a.date && !b.date) return 0;
          if (!a.date) return 1;
          if (!b.date) return -1;
          return new Date(b.date) - new Date(a.date);
        });
      }
      
    }

    if (filtered.length === 0) {
      listContainer.appendChild(noTasks);
      return;
    } else {
      if (noTasks.parentNode === listContainer) {
        listContainer.removeChild(noTasks);
      }
    }

    filtered.forEach(task => {
      const li = el('li', { className: 'task-item', attrs: { draggable: 'true', 'data-id': task.id } });
      li.setAttribute('role', 'listitem');


      const checkbox = el('input', { className: 'task-checkbox', attrs: { type: 'checkbox', 'aria-label': 'Отметить задачу' } });
      checkbox.checked = !!task.completed;
      checkbox.addEventListener('change', () => {
        task.completed = checkbox.checked;
        saveTasks(tasks);
        renderTasks();
      });

      // content
      const content = el('div', { className: 'task-content' });
      const titleSpan = el('div', { className: 'task-title' });
      titleSpan.textContent = task.title || '(Без названия)';
      if (task.completed) titleSpan.classList.add('completed');

      const dateSpan = el('div', { className: 'task-date' });
      dateSpan.textContent = task.date ? formatDateReadable(task.date) : '';

      content.appendChild(titleSpan);
      content.appendChild(dateSpan);


      const actions = el('div', { className: 'task-actions' });

      const editBtn = el('button', { className: 'icon-btn', attrs: { title: 'Редактировать', 'aria-label': 'Редактировать задачу' } });
      editBtn.textContent = '✏️';
      editBtn.addEventListener('click', () => enterEditMode(li, task));


      const delBtn = el('button', { className: 'icon-btn', attrs: { title: 'Удалить', 'aria-label': 'Удалить задачу' } });
      delBtn.textContent = '🗑️';
      delBtn.addEventListener('click', () => {
        const idx = tasks.findIndex(t => t.id === task.id);
        if (idx >= 0) {
          tasks.splice(idx, 1);

          tasks.forEach((t, i) => t.order = i);
          saveTasks(tasks);
          renderTasks();
        }
      });

      actions.appendChild(editBtn);
      actions.appendChild(delBtn);

      li.appendChild(checkbox);
      li.appendChild(content);
      li.appendChild(actions);


      li.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', task.id);
        li.classList.add('dragging');

        e.dataTransfer.effectAllowed = 'move';
      });
      li.addEventListener('dragend', () => {
        li.classList.remove('dragging');
      });

      li.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        li.classList.add('over');
      });
      li.addEventListener('dragleave', () => {
        li.classList.remove('over');
      });
      li.addEventListener('drop', (e) => {
        e.preventDefault();
        li.classList.remove('over');
        const draggedId = e.dataTransfer.getData('text/plain');
        const targetId = task.id;
        if (!draggedId || draggedId === targetId) return;
        const draggedIndex = tasks.findIndex(t => t.id === draggedId);
        const targetIndex = tasks.findIndex(t => t.id === targetId);
        if (draggedIndex === -1 || targetIndex === -1) return;
        const [draggedItem] = tasks.splice(draggedIndex, 1);
        tasks.splice(targetIndex, 0, draggedItem);
        // reassign order
        tasks.forEach((t, i) => t.order = i);
        saveTasks(tasks);
        renderTasks();
      });

      tasksList.appendChild(li);
    });
  }


  function enterEditMode(listItemElement, task) {
    // Replace content with inputs
    listItemElement.classList.add('edit-mode');
    const contentDiv = listItemElement.querySelector('.task-content');
    while (contentDiv.firstChild) contentDiv.removeChild(contentDiv.firstChild);

    const titleInput = el('input', { attrs: { type: 'text', 'aria-label': 'Редактировать название' } });
    titleInput.value = task.title;
    const dateInputEdit = el('input', { attrs: { type: 'date', 'aria-label': 'Редактировать дату' } });
    dateInputEdit.value = formatDateInputValue(task.date);

    const saveBtn = el('button', { className: 'primary-btn', attrs: { type: 'button' } });
    saveBtn.textContent = 'Сохранить';
    const cancelBtn = el('button', { className: 'icon-btn', attrs: { type: 'button' } });
    cancelBtn.textContent = '↩';

    const inputsRow = el('div', { className: 'field-row' });
    inputsRow.style.marginBottom = '6px';
    inputsRow.appendChild(titleInput);
    inputsRow.appendChild(dateInputEdit);

    const btnRow = el('div', { className: 'task-actions' });
    btnRow.appendChild(saveBtn);
    btnRow.appendChild(cancelBtn);

    contentDiv.appendChild(inputsRow);
    contentDiv.appendChild(btnRow);

    saveBtn.addEventListener('click', () => {
      task.title = titleInput.value.trim() || '(Без названия)';
      task.date = formatDateInputValue(dateInputEdit.value) || '';
      saveTasks(tasks);
      renderTasks();
    });
    cancelBtn.addEventListener('click', () => {
      renderTasks();
    });
  }


  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const titleVal = inputTitle.value.trim();
    const dateVal = formatDateInputValue(inputDate.value);

    if (!titleVal) {
      // simple validation
      inputTitle.focus();
      return;
    }
    const newTask = {
      id: generateId(),
      title: titleVal,
      date: dateVal || '',
      completed: false,
      order: tasks.length
    };
    tasks.push(newTask);
    saveTasks(tasks);
    inputTitle.value = '';
    inputDate.value = '';
    renderTasks();
  });

  renderTasks();
})();
