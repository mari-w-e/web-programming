'use strict';

const SIZE = 4;
const boardContainer = document.getElementById('board-container');
const scoreEl = document.getElementById('score');
const btnUndo = document.getElementById('btn-undo');
const btnRestart = document.getElementById('btn-restart');
const btnLeader = document.getElementById('btn-leader');
const modalGameOver = document.getElementById('modal-gameover');
const modalLeader = document.getElementById('modal-leader');
const modalTitle = document.getElementById('modal-title');
const modalMsg = document.getElementById('modal-msg');
const finalScoreEl = document.getElementById('final-score');
const nameRow = document.getElementById('name-row');
const playerNameInput = document.getElementById('player-name');
const saveScoreBtn = document.getElementById('save-score');
const savedMsg = document.getElementById('saved-msg');
const modalRestart = document.getElementById('modal-restart');
const modalClose = document.getElementById('modal-close');
const leaderClose = document.getElementById('leader-close');
const leaderClear = document.getElementById('leader-clear');
const leaderTableBody = document.querySelector('#leader-table tbody');
const mobileControls = document.getElementById('mobile-controls');

if (!boardContainer || !scoreEl) {
  console.error('Critical DOM elements not found. Check HTML IDs.');
}

let grid = createEmptyGrid();
let score = 0;
let prevState = null;
let canUndo = false;
let gameOver = false;

let cellSize = 0;
let gap = 10;

function createEmptyGrid(){
  return Array.from({length: SIZE}, ()=> Array.from({length: SIZE}, ()=> 0));
}

function createGridDOM(){
  while (boardContainer.firstChild) boardContainer.removeChild(boardContainer.firstChild);

  for (let r=0;r<SIZE;r++){
    for (let c=0;c<SIZE;c++){
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.r = r;
      cell.dataset.c = c;
      boardContainer.appendChild(cell);
    }
  }
  updateMetrics();
}

function updateMetrics(){
  const rect = boardContainer.getBoundingClientRect();
  cellSize = Math.floor(rect.width / SIZE) - Math.floor(gap * (SIZE-1) / SIZE);
}

function createTile(value, r, c, extraClass){
  const t = document.createElement('div');
  t.className = 'tile';
  t.dataset.r = r;
  t.dataset.c = c;
  t.dataset.value = value;
  t.textContent = value;
  t.classList.add(`v${value}`);

  const lightValues = [2,4,8,16];
  if (lightValues.includes(value)) t.classList.add('tile-light'); else t.classList.add('tile-dark');
  if (extraClass) t.classList.add(extraClass);
  placeTileElement(t, r, c);
  boardContainer.appendChild(t);

  requestAnimationFrame(()=> t.classList.add('tile-appear'));
  return t;
}

function placeTileElement(el, r, c){
  const rect = boardContainer.getBoundingClientRect();
  const gapVal = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--gap')) || gap;
  const total = rect.width;
  const tileSize = (total - gapVal * (SIZE-1)) / SIZE;
  const left = c * (tileSize + gapVal);
  const top = r * (tileSize + gapVal);
  el.style.width = `${tileSize}px`;
  el.style.height = `${tileSize}px`;
  el.style.left = `${left}px`;
  el.style.top = `${top}px`;
  el.style.fontSize = `${Math.max(12, Math.floor(tileSize/4.5))}px`;
}

function redrawGrid(){
  const existingTiles = Array.from(boardContainer.querySelectorAll('.tile'));
  existingTiles.forEach(t => boardContainer.removeChild(t));

  for (let r=0;r<SIZE;r++){
    for (let c=0;c<SIZE;c++){
      const v = grid[r][c];
      if (v !== 0){
        createTile(v, r, c);
      }
    }
  }
}

function getEmptyCells(){
  const empty = [];
  for (let r=0;r<SIZE;r++) for (let c=0;c<SIZE;c++) if (grid[r][c] === 0) empty.push({r,c});
  return empty;
}

function spawnTiles(){
  const empties = getEmptyCells();
  if (empties.length === 0) return;
  const count = Math.min(empties.length, (Math.random() < 0.2 && empties.length>1) ? 2 : 1);
  for (let i=0;i<count;i++){
    const idx = Math.floor(Math.random()*empties.length);
    const cell = empties.splice(idx,1)[0];
    const val = Math.random() < 0.9 ? 2 : 4;
    grid[cell.r][cell.c] = val;
  }
}

function newGame(clearStorage = false){
  grid = createEmptyGrid();
  score = 0;
  prevState = null;
  canUndo = false;
  gameOver = false;
  createGridDOM();

  const initialCount = Math.floor(Math.random()*3) + 1;
  for (let i=0;i<initialCount;i++) spawnTiles();
  redrawGrid();
  updateScore();
  
  hideModal(modalGameOver);
  hideModal(modalLeader);
  
  saveState();
  showMobileControlsIfNeeded();
  if (clearStorage) localStorage.removeItem('leaderboard');
}

function copyGrid(g){ return g.map(row => row.slice()); }

function compressAndMerge(arr){
  const original = arr.slice();                
  let newArr = arr.filter(v => v !== 0);       
  let mergedScore = 0;
  let anyMerged = false;

  
  let mergedThisPass = true;
  while (mergedThisPass && newArr.length > 1){
    mergedThisPass = false;
    for (let i = 0; i < newArr.length - 1; i++){
     
      if (newArr[i] !== 0 && newArr[i] === newArr[i+1]){
        newArr[i] = newArr[i] * 2;
        mergedScore += newArr[i];
        newArr.splice(i+1, 1);
        mergedThisPass = true;
        anyMerged = true;
        
      }
    }
  }

 
  while (newArr.length < SIZE) newArr.push(0);

 
  let changed = false;
  for (let i = 0; i < SIZE; i++){
    if (newArr[i] !== original[i]) { changed = true; break; }
  }

  return { arr: newArr, changed, mergedScore };
}


function move(direction){
  if (gameOver) return false;
  const prevGrid = copyGrid(grid);
  const prevScore = score;
  let moved = false;
  let totalMerged = 0;

  if (direction === 'left' || direction === 'right'){
    for (let r=0;r<SIZE;r++){
      const row = grid[r].slice();
      const working = (direction === 'left') ? row : row.slice().reverse();
      const {arr, changed, mergedScore} = compressAndMerge(working);
      totalMerged += mergedScore;
      const newRow = (direction === 'left') ? arr : arr.slice().reverse();
      grid[r] = newRow;
      if (!moved && changed) moved = true;
    }
  } else {
    for (let c=0;c<SIZE;c++){
      const col = [];
      for (let r=0;r<SIZE;r++) col.push(grid[r][c]);
      const working = (direction === 'up') ? col : col.slice().reverse();
      const {arr, changed, mergedScore} = compressAndMerge(working);
      totalMerged += mergedScore;
      const newCol = (direction === 'up') ? arr : arr.slice().reverse();
      for (let r=0;r<SIZE;r++) grid[r][c] = newCol[r];
      if (!moved && changed) moved = true;
    }
  }

  if (moved){
    prevState = {grid: prevGrid, score: prevScore};
    canUndo = true;
    score += totalMerged;
    spawnTiles();
    redrawGrid();
    updateScore();
    saveState();
    if (isGameOver()){
      endGame();
    }
    return true;
  } else {
    return false;
  }
}

function isGameOver(){
  for (let r=0;r<SIZE;r++) for (let c=0;c<SIZE;c++) if (grid[r][c]===0) return false;
  for (let r=0;r<SIZE;r++){
    for (let c=0;c<SIZE;c++){
      const v = grid[r][c];
      if (r+1<SIZE && grid[r+1][c]===v) return false;
      if (c+1<SIZE && grid[r][c+1]===v) return false;
      if (r-1>=0 && grid[r-1][c]===v) return false;
      if (c-1>=0 && grid[r][c-1]===v) return false;
    }
  }
  return true;
}

function undo(){
  if (!prevState || !canUndo || gameOver) return;
  grid = copyGrid(prevState.grid);
  score = prevState.score;
  prevState = null;
  canUndo = false;
  redrawGrid();
  updateScore();
  saveState();
}

function updateScore(){
  scoreEl.textContent = String(score);
}

function endGame(){
  gameOver = true;
  finalScoreEl.textContent = String(score);
  modalTitle.textContent = 'Игра окончена';
  modalMsg.textContent = `Вы набрали ${score} очков.`;
  nameRow.classList.remove('hidden');
  savedMsg.classList.add('hidden');
  playerNameInput.value = '';
  showModal(modalGameOver);
  canUndo = false;
  prevState = null;
  hideMobileControls();
  saveState();
}

function showModal(modal){
  if (!modal) return;
  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden','false');
}
function hideModal(modal){
  if (!modal) return;
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden','true');
}

function loadLeaderboard(){
  const raw = localStorage.getItem('leaderboard');
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) return arr;
  } catch(e){ console.warn('leaderboard parse error', e); }
  return [];
}
function saveLeaderboard(list){
  localStorage.setItem('leaderboard', JSON.stringify(list));
}
function addToLeaderboard(name, scoreVal){
  const list = loadLeaderboard();
  const entry = {name: name || 'Без имени', score: scoreVal, date: new Date().toISOString()};
  list.push(entry);
  list.sort((a,b)=> b.score - a.score);
  const top = list.slice(0,10);
  saveLeaderboard(top);
}

function renderLeaderboard(){
  const list = loadLeaderboard();
  while (leaderTableBody.firstChild) leaderTableBody.removeChild(leaderTableBody.firstChild);
  for (let i=0;i<10;i++){
    const tr = document.createElement('tr');
    const tdIdx = document.createElement('td');
    tdIdx.textContent = (i+1) + '.';
    const tdName = document.createElement('td');
    const tdScore = document.createElement('td');
    const tdDate = document.createElement('td');
    if (list[i]){
      tdName.textContent = list[i].name;
      tdScore.textContent = String(list[i].score);
      tdDate.textContent = (new Date(list[i].date)).toLocaleString();
    } else {
      tdName.textContent = '-';
      tdScore.textContent = '-';
      tdDate.textContent = '-';
    }
    tr.appendChild(tdIdx);
    tr.appendChild(tdName);
    tr.appendChild(tdScore);
    tr.appendChild(tdDate);
    leaderTableBody.appendChild(tr);
  }
}

function saveState(){
  const state = {grid, score};
  try {
    localStorage.setItem('gameState', JSON.stringify(state));
  } catch(e){}
}
function loadState(){
  try {
    const raw = localStorage.getItem('gameState');
    if (!raw) return false;
    const state = JSON.parse(raw);
    if (state && state.grid && state.score !== undefined){
      grid = state.grid;
      score = state.score;
      return true;
    }
  } catch(e){}
  return false;
}

function tryResume(){
  const ok = loadState();
  if (ok){
    redrawGrid();
    updateScore();
    showMobileControlsIfNeeded();
    return true;
  } else {
    newGame();
    return false;
  }
}

document.addEventListener('keydown', (e)=>{
  if (modalLeader.classList.contains('hidden') && modalGameOver.classList.contains('hidden')){
    if (e.key === 'ArrowLeft') { if (move('left')) e.preventDefault(); }
    if (e.key === 'ArrowRight') { if (move('right')) e.preventDefault(); }
    if (e.key === 'ArrowUp') { if (move('up')) e.preventDefault(); }
    if (e.key === 'ArrowDown') { if (move('down')) e.preventDefault(); }
  }
});

btnUndo.addEventListener('click', ()=> { undo(); });
btnRestart.addEventListener('click', ()=> { newGame(); });

btnLeader.addEventListener('click', ()=>{
  renderLeaderboard();
  showModal(modalLeader);
  hideMobileControls();
});

saveScoreBtn.addEventListener('click', ()=>{
  const name = playerNameInput.value.trim() || 'Без имени';
  addToLeaderboard(name, score);
  savedMsg.classList.remove('hidden');
  nameRow.classList.add('hidden');
  saveState();
});

modalRestart.addEventListener('click', ()=> {
  newGame();
  hideModal(modalGameOver);
  showMobileControlsIfNeeded();
});
modalClose.addEventListener('click', ()=> {
  hideModal(modalGameOver);
  showMobileControlsIfNeeded();
});
leaderClose.addEventListener('click', ()=> {
  hideModal(modalLeader);
  showMobileControlsIfNeeded();
});
leaderClear.addEventListener('click', ()=>{
  if (confirm('Очистить таблицу лидеров?')) {
    localStorage.removeItem('leaderboard');
    renderLeaderboard();
  }
});

mobileControls.addEventListener('click', (e)=>{
  const btn = e.target.closest('button');
  if (!btn) return;
  const dir = btn.dataset.dir;
  if (dir) move(dir);
});


window.addEventListener('resize', ()=>{
  const tiles = Array.from(boardContainer.querySelectorAll('.tile'));
  tiles.forEach(t => {
    const r = Number(t.dataset.r), c = Number(t.dataset.c);
    placeTileElement(t, r, c);
  });
});

function showMobileControlsIfNeeded(){
  const isSmall = window.matchMedia('(max-width:600px)').matches;
  if (!isSmall) { mobileControls.classList.add('hidden'); return; }
  if (!modalLeader.classList.contains('hidden') || !modalGameOver.classList.contains('hidden')) {
    mobileControls.classList.add('hidden');
    return;
  }
  mobileControls.classList.remove('hidden');
}
function hideMobileControls(){ mobileControls.classList.add('hidden'); }


hideModal(modalGameOver);
hideModal(modalLeader);

createGridDOM();

const resumed = tryResume();
if (!resumed) newGame();

updateScore();
showMobileControlsIfNeeded();
