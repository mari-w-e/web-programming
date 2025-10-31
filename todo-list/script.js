const STORAGE_KEY = 'todo_v1';

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

const main = el('main', { className: 'app-root' });
const titleH1 = el('h1', { className: 'app-title', text: 'TODO list' });

const createCard = el('section', { className: 'todo-card' });
const form = el('form', { className: 'todo-form', attrs: { action: '#', 'aria-label': 'Добавить задачу' } });

const fieldRow = el('div', { className: 'field-row' });
const inputTitle = el('input', { className: 'task-input', attrs: { t
