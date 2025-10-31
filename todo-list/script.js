const STORAGE_KEY = 'todo_v1';

function el(tag, props = {}) {
  const element = document.createElement(tag);
  if (props.className) element.className = props.className;
  if (props.text) element.textContent = props.text;
  if (props.type) element.type = props.type;
  if (props.placeholder) element.placeholder = props.placeholder;
  if (props.id) element.id = props.id;
  if (props.attrs) {
    for (const key in props.attrs) {
      element.setAttribute(key, props.attrs[key]);
    }
  }
  return element;
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
  } catch (e) {
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
  return yyyy + '-' + mm + '-' + dd;
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

// --- остальной код создания DOM и логики задач точно такой же, как в версии с IIFE ---

const main = el('main', { className: 'app-root' });
const titleH1 = el('h1', { className: 'app-title', text: 'TODO list' });

const createCard = el('section', { className: 'todo-card' });
const form = el('form', { className: 'todo-form', attrs: { action: '#', 'aria-label':'Добавить задачу' } });

const fieldRow = el('div', { className: 'field-row' });
const inputTitle = el('input', { className: 'task-input', attrs:{ type:'text', placeholder:'Название задачи' } });
const inputDate = el('input', { className: 'date-input', attrs:{ type:'date', placeholder:'Дата задачи' } });
fieldRow.append(inputTitle, inputDate);

const addBtn = el('button', { className: 'primary-btn', attrs: { type: 'submit' } });
addBtn.textContent = 'Добавить задачу';

form.append(fieldRow, addBtn);
createCard.appendChild(form);

const tasksCard = el('section', { className: 'tasks-card' });
const controls = el('div', { className: 'controls' });

const filterSelect = el('select', { className: 'filter-select' });
filterSelect.innerHTML = `
  <option value="all">Все</option>
  <option value="active">Активные</option>
  <option value="done">Выполненные</option>
`;

const sortBtn = el('button', { className: 'sort-btn', attrs: { type: 'button' } });
sortBtn.textContent = 'Сортировать по дате ↑';

const searchInput = el('input', { className: 'search-input', attrs: { type: 'search', placeholder: 'Поиск по названию' } });

controls.append(filterSelect, sortBtn, searchInput);

const tasksList = el('ul', { className: 'tasks-list', attrs: { role: 'list' } });
const noTasks = el('div', { className: 'no-tasks', text: 'Задач нет' });

tasksCard.append(controls, tasksList);
main.append(titleH1, createCard, tasksCard);
document.body.appendChild(main);

let tasks = loadTasks();
tasks = tasks.map((task, index) => ({ order: typeof task.order === 'number' ? task.order : index, ...task }));

let sortOrder = 'asc';
let currentFilter = 'all';
let currentSearch = '';

// --- далее весь renderTasks, enterEditMode, события формы и кнопок остаются без изменений ---

renderTasks();
