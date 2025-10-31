(function () {
  const STORAGE_KEY = 'todo_v1';

  function makeElement(tag, props = {}) {
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

  /*function loadTasks() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
      return [];
    } catch {
      return [];
    }
  }*/

  function loadTasks() {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      return Array.isArray(data) ? data : [];
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


  const main = makeElement('main', { className: 'app-root' });
  const titleH1 = makeElement('h1', { className: 'app-title', text: 'TODO list' });


  const createCard = makeElement('section', { className: 'todo-card' });
  const form = makeElement('form', { className: 'todo-form', attrs: { action: '#', 'aria-label':'Добавить задачу' } });

  const fieldRow = makeElement('div', { className: 'field-row' });
  const inputTitle = makeElement('input', { className: 'task-input', attrs:{type:'text', placeholder:'Название задачи'} });
  const inputDate = makeElement('input', { className: 'date-input', attrs:{type:'date', placeholder:'Дата задачи'} });
  fieldRow.append(inputTitle, inputDate);

  const addBtn = makeElement('button', { className:'primary-btn', attrs:{type:'submit'} });
  addBtn.textContent = 'Добавить задачу';

  form.append(fieldRow, addBtn);
  createCard.appendChild(form);


  const tasksCard = makeElement('section', { className: 'tasks-card' });

  const controls = makeElement('div', { className: 'controls' });
  const filterSelect = makeElement('select', { className: 'filter-select' });
  filterSelect.innerHTML = '<option value="all">Все</option><option value="active">Активные</option><option value="done">Выполненные</option>';
  const sortBtn = makeElement('button', { className:'sort-btn', attrs:{type:'button'} }); sortBtn.textContent='Сортировать по дате ↑';
  const searchInput = makeElement('input', { className:'search-input', attrs:{type:'search', placeholder:'Поиск по названию'} });

  controls.append(filterSelect, sortBtn, searchInput);

  const tasksList = makeElement('ul', { className:'tasks-list', attrs:{role:'list'} });
  const noTasks = makeElement('div', { className:'no-tasks', text:'Задач нет' });

  tasksCard.append(controls, tasksList);

  main.append(titleH1, createCard, tasksCard);
  document.body.appendChild(main);


  let tasks = loadTasks();

  tasks = tasks.map((t,i)=>({order: typeof t.order === 'number' ? t.order : i, ...t}));


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


    if(sortOrder==='asc') {
      filtered.sort((a,b)=>{
        if(!a.date && !b.date) return 0;
        if(!a.date) return -1;
        if(!b.date) return 1;
        return new Date(a.date) - new Date(b.date);
      });
    } else if(sortOrder==='desc') {
      filtered.sort((a,b)=>{
        if(!a.date && !b.date) return 0;
        if(!a.date) return -1;
        if(!b.date) return 1;
        return new Date(b.date) - new Date(a.date);
      });
    } 

    if(filtered.length===0){ tasksList.appendChild(noTasks); return; }

    let dragTaskId = null;

    filtered.forEach(task=>{
      const li = makeElement('li', {className:'task-item', attrs:{draggable:'true'}});


      li.addEventListener('dragstart', e => {
        dragTaskId = task.id;
        e.dataTransfer.effectAllowed = 'move';

        try { e.dataTransfer.setData('text/plain', dragTaskId); } catch (err) {}
        li.style.opacity = '0.4';
      });

      li.addEventListener('dragend', () => {
        li.style.opacity = '';

        document.querySelectorAll('.task-item.drag-over').forEach(x=>x.classList.remove('drag-over'));
      });

      li.addEventListener('dragover', e => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        li.classList.add('drag-over');
      });

      li.addEventListener('dragleave', () => {
        li.classList.remove('drag-over');
      });

      li.addEventListener('drop', e => {
        e.preventDefault();
        e.stopPropagation();
        li.classList.remove('drag-over');

        if(!dragTaskId) return;
        if(dragTaskId === task.id) return;

        const srcIndex = tasks.findIndex(t => t.id === dragTaskId);
        let dstIndex = tasks.findIndex(t => t.id === task.id);
        if(srcIndex === -1 || dstIndex === -1) return;

        const [dragTask] = tasks.splice(srcIndex, 1);
        if (srcIndex < dstIndex) dstIndex = dstIndex - 1;
        tasks.splice(dstIndex, 0, dragTask);

        sortOrder = 'custom';
        sortBtn.textContent = 'Сортировать по дате ↑';

        tasks.forEach((t,i)=>t.order=i);
        saveTasks(tasks);
        renderTasks();
      });

      const checkbox = makeElement('input', {className:'task-checkbox', attrs:{type:'checkbox'}});
      checkbox.checked = !!task.completed;
      checkbox.addEventListener('change', ()=>{ task.completed=checkbox.checked; saveTasks(tasks); renderTasks(); });

      const content = makeElement('div', {className:'task-content'});
      const titleSpan = makeElement('div', {className:'task-title', text:task.title||'(Без названия)'});
      if(task.completed) titleSpan.classList.add('completed');
      const dateSpan = makeElement('div', {className:'task-date', text: task.date ? formatDateReadable(task.date) : ''});
      content.append(titleSpan,dateSpan);

      const leftBox = makeElement('div',{className:'task-left'});
      leftBox.append(checkbox, content);

      const actions = makeElement('div',{className:'task-actions'});
      const editBtn = makeElement('button',{className:'icon-btn', attrs:{title:'Редактировать'}}); editBtn.textContent='✏️';
      editBtn.addEventListener('click',()=>enterEditMode(li,task));
      const delBtn = makeElement('button',{className:'icon-btn', attrs:{title:'Удалить'}}); delBtn.textContent='❌';
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

  function enterEditMode(li, task){
    li.innerHTML='';
    li.style.flexDirection='column';
    const titleInput = makeElement('input',{attrs:{type:'text'}}); titleInput.value=task.title;
    const dateInput = makeElement('input',{attrs:{type:'date'}}); dateInput.value=task.date||'';
    const saveBtn = makeElement('button',{className:'primary-btn', attrs:{type:'button'}}); saveBtn.textContent='Сохранить';
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

    if(sortOrder === 'custom') {
      sortOrder = 'asc';
    } else {
      sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    }
    sortBtn.textContent = sortOrder==='asc' ? 'Сортировать по дате ↑' : (sortOrder==='desc' ? 'Сортировать по дате ↓' : 'Пользовательский порядок');
    renderTasks();
  });

  renderTasks();
})();
