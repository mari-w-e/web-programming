const STORAGE_KEY = 'todo_v1';

function el(tag, props = {}) {
  const elem = document.createElement(tag);
  Object.entries(props).forEach(([key, val]) => {
    if (key === 'className') elem.className = val;
    else if (key === 'text') elem.textContent = val;
    else if (key === 'type') elem.type = val;
    else if (key === 'placeholder') elem.placeholder = val;
    else if (key === 'id') elem.id = val;
    else if (key === 'attrs') Object.entries(val).forEach(([k, v]) => elem.setAttribute(k, v));
  });
  return elem;
}

function save(tasks) { localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)); }
function load() { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { return []; } }

function formatDateInput(val) {
  if (!val) return '';
  const d = new Date(val);
  if (isNaN(d)) return '';
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function formatDateReadable(val) {
  if (!val) return '';
  const d = new Date(val);
  if (isNaN(d)) return '';
  return d.toLocaleDateString('ru-RU');
}

function genId() { return 't_' + Math.random().toString(36).slice(2,9); }

const main = el('main', { className: 'app-root' });
const titleH1 = el('h1', { className: 'app-title', text: 'TODO list' });

const createCard = el('section', { className: 'todo-card' });
const form = el('form', { className: 'todo-form', attrs: { action:'#', 'aria-label':'Добавить задачу' } });

const fieldRow = el('div', { className: 'field-row' });
const inputTitle = el('input', { className:'task-input', attrs:{type:'text', placeholder:'Название задачи'} });
const inputDate = el('input', { className:'date-input', attrs:{type:'date', placeholder:'Дата задачи'} });
fieldRow.append(inputTitle, inputDate);

const addBtn = el('button', { className:'primary-btn', attrs:{type:'submit'}, text:'Добавить задачу' });
form.append(fieldRow, addBtn);
createCard.append(form);

const tasksCard = el('section', { className:'tasks-card' });
const controls = el('div', { className:'controls' });
const filterSelect = el('select', { className:'filter-select' });
filterSelect.innerHTML = '<option value="all">Все</option><option value="active">Активные</option><option value="done">Выполненные</option>';
const sortBtn = el('button', { className:'sort-btn', attrs:{type:'button'}, text:'Сортировать по дате ↑' });
const searchInput = el('input', { className:'search-input', attrs:{type:'search', placeholder:'Поиск по названию'} });
controls.append(filterSelect, sortBtn, searchInput);

const tasksList = el('ul', { className:'tasks-list', attrs:{role:'list'} });
const noTasks = el('div', { className:'no-tasks', text:'Задач нет' });
tasksCard.append(controls, tasksList);

main.append(titleH1, createCard, tasksCard);
document.body.appendChild(main);

let tasks = load().map((t,i) => ({ order: typeof t.order === 'number' ? t.order : i, ...t }));
let sortOrder = 'asc';
let currentFilter = 'all';
let currentSearch = '';

function renderTasks() {
  tasksList.innerHTML = '';
  let filtered = tasks.slice().sort((a,b)=>a.order-b.order)
    .filter(t=>{
      if(currentFilter==='active' && t.completed) return false;
      if(currentFilter==='done' && !t.completed) return false;
      if(currentSearch && !t.title.toLowerCase().includes(currentSearch.toLowerCase())) return false;
      return true;
    });

  if(sortOrder==='asc' || sortOrder==='desc') {
    filtered.sort((a,b)=>{
      if(!a.date && !b.date) return 0;
      if(!a.date) return -1;
      if(!b.date) return 1;
      return sortOrder==='asc' ? new Date(a.date)-new Date(b.date) : new Date(b.date)-new Date(a.date);
    });
  }

  if(filtered.length===0){ tasksList.append(noTasks); return; }

  let dragId = null;

  filtered.forEach(task=>{
    const li = el('li', { className:'task-item', attrs:{draggable:'true'} });

    li.addEventListener('dragstart', e => { dragId=task.id; e.dataTransfer.effectAllowed='move'; li.style.opacity='0.4'; });
    li.addEventListener('dragend', () => { li.style.opacity=''; document.querySelectorAll('.task-item.drag-over').forEach(x=>x.classList.remove('drag-over')); });
    li.addEventListener('dragover', e => { e.preventDefault(); li.classList.add('drag-over'); });
    li.addEventListener('dragleave', () => li.classList.remove('drag-over'));
    li.addEventListener('drop', e => {
      e.preventDefault(); e.stopPropagation(); li.classList.remove('drag-over');
      if(!dragId || dragId===task.id) return;
      const from=tasks.findIndex(t=>t.id===dragId), to=tasks.findIndex(t=>t.id===task.id);
      const [moved]=tasks.splice(from,1); if(from<to) tasks.splice(to-1,0,moved); else tasks.splice(to,0,moved);
      tasks.forEach((t,i)=>t.order=i);
      sortOrder='custom'; sortBtn.textContent='Сортировать по дате ↑';
      save(tasks); renderTasks();
    });

    const checkbox = el('input', { className:'task-checkbox', attrs:{type:'checkbox'} });
    checkbox.checked=!!task.completed
