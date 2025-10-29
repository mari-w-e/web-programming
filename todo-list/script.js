(function () {
  const STORAGE_KEY = 'todo_app_tasks_v1';

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

  // ====== Styles ======
  const styles = `
    :root {
      --bg: #f7c774;
      --panel-bg: #ffffff;
      --accent: #f7c774;
      --accent-text: #000000;
      --muted: #666666;
      --success: #2e7d32;
      --danger: #c62828;
      --shadow: 0 6px 18px rgba(0,0,0,0.12);
      --max-width: 420px;
    }
    html, body {
      height:100%;
      margin:0;
      font-family: Inter, Roboto, Arial, sans-serif;
      background: var(--bg);
      color: #222;
    }
    h1.app-title {
      text-align:center;
      font-size:24px;
      font-weight:600;
      margin:24px 0 0 0;
    }
    main.app-root {
      min-height:100vh;
      display:flex;
      flex-direction:column;
      align-items:center;
      padding:16px;
      box-sizing:border-box;
    }
    .todo-card {
      width:100%;
      max-width:var(--max-width);
      background:var(--panel-bg);
      border-radius:12px;
      box-shadow:var(--shadow);
      padding:16px;
      box-sizing:border-box;
      display:flex;
      flex-direction:column;
      margin-bottom:16px;
    }
    .todo-form {
      display:flex;
      flex-direction:column;
      gap:8px;
    }
    .field-row {
      display:flex;
      gap:8px;
      flex-wrap:wrap;
      padding: 0; 
      width: 100%; 
      box-sizing: border-box;
    }
    input.task-input, input.date-input {
      flex:1;
      padding:10px 12px;
      border-radius:8px;
      border:1px solid #ddd;
      font-size:14px;
      outline:none;
    }
    input.date-input::placeholder {
      color: var(--muted);
    }
    button.primary-btn {
      padding:10px;
      border-radius:8px;
      border:0;
      cursor:pointer;
      background: var(--accent);
      color: var(--accent-text);
      font-weight:600;
    }
    .tasks-card {
      width:100%;
      max-width:var(--max-width);
      background:var(--panel-bg);
      border-radius:12px;
      box-shadow:var(--shadow);
      padding:16px;
      box-sizing:border-box;
      display:flex;
      flex-direction:column;
    }
    .controls {
      display:flex;
      gap:8px;
      flex-wrap:wrap;
      margin-bottom:12px;
      align-items:center;
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
      min-height:60px;
      width: 100%;
      box-sizing: border-box;
    }
    .task-item {
      display:flex;
      justify-content:space-between;
      align-items:flex-start;
      padding:10px;
      border-radius:8px;
      border:1px solid #f0f0f0;
      background: #fafafa;
      width: 100%;     
      box-sizing: border-box;
    }
    .task-left {
      display:flex;
      gap:10px;
      align-items:flex-start;
      flex:1;
    }
    .task-content {
      display:flex;
      flex-direction:column;
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
      flex-shrink:0;
    }
    .icon-btn {
      border:0;
      background:transparent;
      cursor:pointer;
      padding:6px;
      border-radius:6px;
    }
    .no-tasks {
      text-align:center;
      color:var(--muted);
      padding:12px;
    }
    @media (max-width:480px) {
      .field-row { flex-direction:column; }
      .task-item { flex-direction:column; align-items:flex-start; }
      .task-actions { margin-top:6px; }
    }
  `;
  const styleElem = el('style');
  styleElem.textContent = styles;
  document.head.appendChild(styleElem);

  // ====== DOM ======
  const main = el('main', { className: 'app-root' });
  const titleH1 = el('h1', { className: 'app-title', text: 'TODO list' });

  // --- форма создания задачи ---
  const createCard = el('section', { className: 'todo-card' });
  const form = el('form', { className: 'todo-form', attrs: { action: '#', 'aria-label':'Добавить задачу' } });

  const fieldRow = el('div', { className: 'field-row' });
  const inputTitle = el('input', { className: 'task-input', attrs:{type:'text', placeholder:'Название задачи'} });
  const inputDate = el('input', { className: 'date-input', attrs:{type:'date', placeholder:'Дата задачи'} });
  fieldRow.append(inputTitle, inputDate);

  const addBtn = el('button', { className:'primary-btn', attrs:{type:'submit'} });
  addBtn.textContent = 'Добавить задачу';

  form.append(fieldRow, addBtn);
  createCard.appendChild(form);

  // --- блок задач ---
  const tasksCard = el('section', { className: 'tasks-card' });

  const controls = el('div', { className: 'controls' });
  const filterSelect = el('select', { className: 'filter-select' });
  filterSelect.innerHTML = '<option value="all">Все</option><option value="active">Активные</option><option value="done">Выполненные</option>';
  const sortBtn = el('button', { className:'sort-btn', attrs:{type:'button'} }); sortBtn.textContent='Сортировать по дате ↑';
  const searchInput = el('input', { className:'search-input', attrs:{type:'search', placeholder:'Поиск по названию'} });

  controls.append(filterSelect, sortBtn, searchInput);

  const tasksList = el('ul', { className:'tasks-list', attrs:{role:'list'} });
  const noTasks = el('div', { className:'no-tasks', text:'Задач нет' });

  tasksCard.append(controls, tasksList);

  main.append(titleH1, createCard, tasksCard);
  document.body.appendChild(main);

  // ====== Логика ======
  let tasks = loadTasks();
  tasks = tasks.map((t,i)=>({order:i,...t}));

  let sortOrder = 'asc';
  let currentFilter = 'all';
  let currentSearch = '';

  function renderTasks() {
    while(tasksList.firstChild) tasksList.removeChild(tasksList.firstChild);
    let filtered = tasks.slice().sort((a,b)=>a.order-b.order)
      .filter(t=>{
        if(currentFilter==='active' && t.completed) return false;
        if(currentFilter==='done' && !t.completed) return false;
        if(currentSearch && !t.title.toLowerCase().includes(currentSearch.toLowerCase())) return false;
        return true;
      });

    if(sortOrder==='asc') filtered.sort((a,b)=> a.date? (b.date? new Date(a.date)-new Date(b.date): -1):-1);
    else if(sortOrder==='desc') filtered.sort((a,b)=> a.date? (b.date? new Date(b.date)-new Date(a.date): -1):-1);

    if(filtered.length===0){ tasksList.appendChild(noTasks); return; }

    filtered.forEach(task=>{
      const li = el('li', {className:'task-item', attrs:{draggable:'true'}});

      li.addEventListener('dragstart', (e) => {
        dragSrcEl = li;
        e.dataTransfer.effectAllowed = 'move';
        li.style.opacity = '0.4';
      });
      li.addEventListener('dragend', () => {
        li.style.opacity = '';
      });
      li.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
      });
      li.addEventListener('drop', (e) => {
        e.stopPropagation();
        if(dragSrcEl !== li){
          const srcIndex = tasks.findIndex(t => t.id === task.id);
          const dstIndex = tasks.findIndex(t => t.id === task.id);

          const dragTask = tasks.find(t => t.id === task.id);
          const srcTaskIndex = tasks.findIndex(t=>t.id===dragTask.id);
          const dstTaskIndex = tasks.findIndex(t=>t.id===task.id);
          tasks.splice(srcTaskIndex,1);
          tasks.splice(dstTaskIndex,0,dragTask);

          tasks.forEach((t,i)=>t.order=i);
          saveTasks(tasks);
          renderTasks();
        }
        return false;
      });

      const checkbox = el('input', {className:'task-checkbox', attrs:{type:'checkbox'}});
      checkbox.checked = !!task.completed;
      checkbox.addEventListener('change', ()=>{ task.completed=checkbox.checked; saveTasks(tasks); renderTasks(); });
  
      const content = el('div', {className:'task-content'});
      const titleSpan = el('div', {className:'task-title', text:task.title||'(Без названия)'});
      if(task.completed) titleSpan.classList.add('completed');
      const dateSpan = el('div', {className:'task-date', text: task.date ? formatDateReadable(task.date) : ''});
      content.append(titleSpan,dateSpan);
  
      const leftBox = el('div',{className:'task-left'});
      leftBox.append(checkbox, content);
  
      const actions = el('div',{className:'task-actions'});
      const editBtn = el('button',{className:'icon-btn', attrs:{title:'Редактировать'}}); editBtn.textContent='✏️';
      editBtn.addEventListener('click',()=>enterEditMode(li,task));
      const delBtn = el('button',{className:'icon-btn', attrs:{title:'Удалить'}}); delBtn.textContent='🗑️';
      delBtn.addEventListener('click',()=>{
        tasks = tasks.filter(t=>t.id!==task.id);
        tasks.forEach((t,i)=>t.order=i);
        saveTasks(tasks);
        renderTasks();
      });
      actions.append(editBtn,delBtn);
  
      li.append(leftBox,actions);
      tasksList.appendChild(li);
    });
  }
      
      
      /*const checkbox = el('input', {className:'task-checkbox', attrs:{type:'checkbox'}});
      checkbox.checked = !!task.completed;
      checkbox.addEventListener('change', ()=>{ task.completed=checkbox.checked; saveTasks(tasks); renderTasks(); });

      const content = el('div', {className:'task-content'});
      const titleSpan = el('div', {className:'task-title', text:task.title||'(Без названия)'});
      if(task.completed) titleSpan.classList.add('completed');
      const dateSpan = el('div', {className:'task-date', text: task.date ? formatDateReadable(task.date) : ''});
      content.append(titleSpan,dateSpan);

      const leftBox = el('div',{className:'task-left'});
      leftBox.append(checkbox, content);

      const actions = el('div',{className:'task-actions'});
      const editBtn = el('button',{className:'icon-btn', attrs:{title:'Редактировать'}}); editBtn.textContent='✏️';
      editBtn.addEventListener('click',()=>enterEditMode(li,task));
      const delBtn = el('button',{className:'icon-btn', attrs:{title:'Удалить'}}); delBtn.textContent='🗑️';
      delBtn.addEventListener('click',()=>{
        tasks = tasks.filter(t=>t.id!==task.id);
        tasks.forEach((t,i)=>t.order=i);
        saveTasks(tasks);
        renderTasks();
      });
      actions.append(editBtn,delBtn);

      li.append(leftBox,actions);
      tasksList.appendChild(li);
    });
  }*/

  function enterEditMode(li, task){
    li.innerHTML='';
    li.style.flexDirection='column';
    const titleInput = el('input',{attrs:{type:'text'}}); titleInput.value=task.title;
    const dateInput = el('input',{attrs:{type:'date'}}); dateInput.value=task.date||'';
    const saveBtn = el('button',{className:'primary-btn', attrs:{type:'button'}}); saveBtn.textContent='Сохранить';
    saveBtn.addEventListener('click',()=>{
      const todayStr = formatDateInputValue(new Date());
      if(!dateInput.value){
        alert('Дата обязательна'); dateInput.focus(); return;
      }
      if(dateInput.value<todayStr){
        alert('Введите актуальную дату'); dateInput.focus(); return;
      }
      task.title = titleInput.value||'(Без названия)';
      task.date = dateInput.value;
      saveTasks(tasks); renderTasks();
    });
    li.append(titleInput,dateInput,saveBtn);
  }

  form.addEventListener('submit',(e)=>{
    e.preventDefault();
    const titleVal = inputTitle.value.trim();
    const dateVal = formatDateInputValue(inputDate.value);
    const todayStr = formatDateInputValue(new Date());
    if(!titleVal){ alert('Введите название задачи'); inputTitle.focus(); return; }
    if(!dateVal){ alert('Введите дату'); inputDate.focus(); return; }
    if(dateVal<todayStr){ alert('Введите актуальную дату'); inputDate.focus(); return; }

    const newTask={id:generateId(), title:titleVal, date:dateVal, completed:false, order:tasks.length};
    tasks.push(newTask);
    saveTasks(tasks);
    inputTitle.value=''; inputDate.value='';
    renderTasks();
  });

  filterSelect.addEventListener('change',()=>{currentFilter=filterSelect.value; renderTasks();});
  searchInput.addEventListener('input',()=>{currentSearch=searchInput.value; renderTasks();});
  sortBtn.addEventListener('click',()=>{
    sortOrder = sortOrder==='asc'?'desc':'asc';
    sortBtn.textContent = sortOrder==='asc'?'Сортировать по дате ↑':'Сортировать по дате ↓';
    renderTasks();
  });

  renderTasks();
})();
