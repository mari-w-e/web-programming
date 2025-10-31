function create(tag, props = {}) {
  const el = document.createElement(tag);
  if (props.className) el.className = props.className;
  if (props.text) el.textContent = props.text;
  if (props.type) el.type = props.type;
  if (props.placeholder) el.placeholder = props.placeholder;
  if (props.value) el.value = props.value;
  if (props.attrs) {
    for (const [key, val] of Object.entries(props.attrs)) el.setAttribute(key, val);
  }
  return el;
}

function saveTasks(tasks) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function loadTasks() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function formatDate(val) {
  if (!val) return '';
  const d = new Date(val);
  if (isNaN(d)) return '';
  return d.toLocaleDateString('ru-RU');
}

function formatDateInput(val) {
  if (!val) return '';
  const d = new Date(val);
  if (isNaN(d)) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const da = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${da}`;
}

function genId() {
  return 't_' + Math.random().toString(36).substr(2, 9);
}

const app = create('main');
const title = create('h1', { text: 'Список задач' });
app.appendChild(title);

const addCard = create('section', { className: 'card' });
const form = create('form');
const row = create('div', { className: 'row' });
const titleInput = create('input', { attrs: { type: 'text', placeholder: 'Название задачи' } });
const dateInput = create('input', { attrs: { type: 'date' } });
row.append(titleInput, dateInput);
const addBtn = create('button', { className: 'add', attrs: { type: 'submit' }, text: 'Добавить задачу' });
form.append(row, addBtn);
addCard.append(form);
app.appendChild(addCard);

const listCard = create('section', { className: 'card' });
const controls = create('div', { className: 'controls' });
const filter = create('select');
filter.innerHTML = '<option value="all">Все</option><option value="active">Активные</option><option value="done">Выполненные</option>';
const sortBtn = create('button', { attrs: { type: 'button' }, text: 'Сортировать по дате ↑' });
const search = create('input', { attrs: { type: 'search', placeholder: 'Поиск по названию' } });
controls.append(filter, sortBtn, search);
const taskList = create('ul', { className: 'task-list' });
const emptyMsg = create('div', { className: 'no-tasks', text: 'Задач нет' });
listCard.append(controls, taskList);
app.appendChild(listCard);
document.body.appendChild(app);

let tasks = loadTasks().map((t, i) => ({ order: i, ...t }));
let sortOrder = 'asc';
let currentFilter = 'all';
let searchQuery = '';

function showTasks() {
  taskList.innerHTML = '';
  let list = tasks.slice().sort((a, b) => a.order - b.order);
  list = list.filter(t => {
    if (currentFilter === 'active' && t.done) return false;
    if (currentFilter === 'done' && !t.done) return false;
    if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  if (sortOrder !== 'custom') {
    list.sort((a, b) => {
      if (!a.date && !b.date) return 0;
      if (!a.date) return -1;
      if (!b.date) return 1;
      return sortOrder === 'asc' ? new Date(a.date) - new Date(b.date) : new Date(b.date) - new Date(a.date);
    });
  }

  if (list.length === 0) {
    taskList.append(emptyMsg);
    return;
  }

  let dragId = null;

  list.forEach(t => {
    const item = create('li', { className: 'task', attrs: { draggable: 'true' } });

    item.addEventListener('dragstart', e => {
      dragId = t.id;
      e.dataTransfer.effectAllowed = 'move';
      item.style.opacity = '0.5';
    });

    item.addEventListener('dragend', () => {
      dragId = null;
      item.style.opacity = '1';
      document.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
    });

    item.addEventListener('dragover', e => {
      e.preventDefault();
      item.classList.add('drag-over');
    });

    item.addEventListener('dragleave', () => item.classList.remove('drag-over'));

    item.addEventListener('drop', e => {
      e.preventDefault();
      item.classList.remove('drag-over');
      if (!dragId || dragId === t.id) return;
      const from = tasks.findIndex(x => x.id === dragId);
      const to = tasks.findIndex(x => x.id === t.id);
      const [moved] = tasks.splice(from, 1);
      tasks.splice(to, 0, moved);
      tasks.forEach((x, i) => (x.order = i));
      sortOrder = 'custom';
      saveTasks(tasks);
      showTasks();
    });

    const left = create('div', { className: 'task-left' });
    const check = create('input', { attrs: { type: 'checkbox' } });
    check.checked = !!t.done;
    const content = create('div', { className: 'task-content' });
    const title = create('div', { className: 'task-title', text: t.title || '(Без названия)' });
    if (t.done) title.classList.add('done');
    const date = create('div', { className: 'task-date', text: formatDate(t.date) });
    content.append(title, date);
    left.append(check, content);

    const actions = create('div', { className: 'task-actions' });
    const edit = create('button', { className: 'icon', text: '✏️' });
    const del = create('button', { className: 'icon', text: '❌' });
    actions.append(edit, del);

    check.addEventListener('change', () => {
      t.done = check.checked;
      saveTasks(tasks);
      showTasks();
    });

    del.addEventListener('click', () => {
      tasks = tasks.filter(x => x.id !== t.id);
      tasks.forEach((x, i) => (x.order = i));
      saveTasks(tasks);
      showTasks();
    });

    edit.addEventListener('click', () => {
      item.innerHTML = '';
      const nameInput = create('input', { attrs: { type: 'text' }, value: t.title });
      const dateInput = create('input', { attrs: { type: 'date' }, value: t.date });
      const save = create('button', { className: 'add', text: 'Сохранить' });
      save.addEventListener('click', () => {
        if (!nameInput.value.trim() || !dateInput.value) return;
        t.title = nameInput.value.trim();
        t.date = dateInput.value;
        saveTasks(tasks);
        showTasks();
      });
      item.append(nameInput, dateInput, save);
    });

    item.append(left, actions);
    taskList.append(item);
  });
}

form.addEventListener('submit', e => {
  e.preventDefault();
  const titleVal = titleInput.value.trim();
  const dateVal = dateInput.value;
  if (!titleVal || !dateVal) return;
  const task = { id: genId(), title: titleVal, date: dateVal, done: false, order: tasks.length };
  tasks.push(task);
  saveTasks(tasks);
  titleInput.value = '';
  dateInput.value = '';
  showTasks();
});

filter.addEventListener('change', () => {
  currentFilter = filter.value;
  showTasks();
});

search.addEventListener('input', () => {
  searchQuery = search.value;
  showTasks();
});

sortBtn.addEventListener('click', () => {
  if (sortOrder === 'custom') sortOrder = 'asc';
  else sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
  sortBtn.textContent = sortOrder === 'asc' ? 'Сортировать по дате ↑' : 'Сортировать по дате ↓';
  showTasks();
});

showTasks();
