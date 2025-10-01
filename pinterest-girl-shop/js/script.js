const productlist = [
    {
        id: 1,
        name: "Ice Latte",
        price: 500,
        description: "айс латте с карамельным сиропом",
        img: {
            pic: 'images/ice-latte.jpg',
            alt: 'ice latte'
        }
    },
    {
        id: 2,
        name: "Бальзам для губ",
        price: 3000,
        description: "Бальзам для губ в оттенке 'вареная сгущенка' ",
        img: {
            pic:'images/lip-balm.jpg',
            alt: 'lip balm'
        }
    },
    {   
        id: 3,
        name: "Matcha Latte",
        price: 500,
        description: "айс матча латте",
        img: {
            pic:'images/matcha-latte.jpg',
            alt: 'matcha latte'
        }
    },
    {
        id: 4,
        name: "Крабики для волос",
        price: 2000,
        description: "Набор из 4 крабиков для волос",
        img: {
            pic:'images/claw-clip.jpg',
            alt: 'claw-clip'
        }
    },
    {
        id: 5,
        name: "Шелковая резинка для волос",
        price: 300,
        description: "Шелковая резинка, которая не травмирует волосы",
        img: {
            pic:'images/hair-scrunchie.jpg',
            alt: 'hair-scrunchie'
        }
    },
    {
        id: 6,
        name: "Камера Instax",
        price: 50000,
        description: "Камера для винтажных фото",
        img: {
            pic:'images/photo-camera.jpg',
            alt: 'photo-camera'
        }
    },
    {
        id: 7,
        name: "Набор колец",
        price: 3000,
        description: "Набор колец (бижутерия)",
        img: {
            pic:'images/set-of-rings.jpg',
            alt: 'set-of-rings'
        }
    }
];
const basket = [];
const catalogList = document.getElementById('catalog-list');

const modal = document.querySelector('.modal');
const closeModalBtn = document.querySelector('.close-button');
const form = document.getElementById('order-form');
const successBlock = document.querySelector('.success');

function createCard(product) {
    const card = document.createElement('div');
    card.className = 'card';
    card.id = product.id;
    card.innerHTML = `
        <img src="${product.img.pic}" alt="${product.img.alt}" class="card-img">
        <h2 class="card-title">${product.name}</h2>
        <p class="card-description">${product.description}</p>
        <p class="card-price">Цена: ${product.price} руб.</p>
        <button class="buy-button">Купить</button>
    `;
    return card;
}

function addToBasket(product) {
  const idx = basket.findIndex(p => p.id === product.id);
  if (idx > -1) {
    basket[idx].quantity = (basket[idx].quantity || 1) + 1;
  } else {
    basket.push({ ...product, quantity: 1 });
  }
  renderbasket();
}

function changeQuantity(id, delta) {
  const idx = basket.findIndex(p => p.id === id);
  if (idx === -1) return;
  const current = basket[idx].quantity || 1;
  const next = current + delta;
  if (next <= 0) {
    basket.splice(idx, 1);
  } else {
    basket[idx].quantity = next;
  }
  renderbasket();
}

function basketTotal() {
  return basket.reduce((sum, item) => {
    const q = item.quantity || 1;
    return sum + item.price * q;
  }, 0);
}

function bindCheckout() {
    const checkoutButton = document.querySelector('.checkout-button');
    if (!checkoutButton) return;
    checkoutButton.onclick = () => {
        if (!basket.length) return alert('Ваша корзина пуста!');
        document.querySelector('.modal').classList.add('is-open');
    };
}

function renderbasket() {
    const basketList = document.querySelector('.basket-list');

    const itemsHtml = basket.map(item => {
      const q = item.quantity || 1;
      return `
        <li data-id="${item.id}">
            <div class="basket-item">
              <p>${item.name} — ${item.price} руб.</p>
              <div class="quantity-controls">
                  <button class="decrease" aria-label="Уменьшить">−</button>
                  <span class="quantity">${q}</span>
                  <button class="increase" aria-label="Увеличить">+</button>
              </div>
            </div>
        </li>
      `;
    }).join('');
    localStorage.setItem('basket', JSON.stringify(basket)); 
    basketList.innerHTML = `
        <div>
            <ul class="basket-ul">
            ${itemsHtml || '<li><em>Корзина пуста</em></li>'}
            </ul>
        </div><br>
        <div class="price-counter">
            <p>Общая сумма: <strong>${basketTotal()} руб.</strong></p>
            <button class="checkout-button">Оформить заказ</button>
        </div>
      `;
    bindCheckout();
}

localStorage.getItem('basket') && JSON.parse(localStorage.getItem('basket')).forEach(item => basket.push(item));
renderbasket();

document.addEventListener('click', (e) => {
  const decBtn = e.target.closest('.decrease');
  const incBtn = e.target.closest('.increase');
  if (!decBtn && !incBtn) return;

  const li = e.target.closest('li[data-id]');

  if (!li) return;

  const id = Number(li.getAttribute('data-id'));
  changeQuantity(id, incBtn ? +1 : -1);
});

productlist.forEach(product => {
    const card = createCard(product);
    catalogList.appendChild(card);
});

const buyButtons = document.querySelectorAll('.buy-button');

buyButtons.forEach(button => {
    button.addEventListener('click', () => {
        let flag = true;
        const productId = button.parentElement.getAttribute('id');
        const product = productlist.find(p => p.id == productId);
        basket.forEach(itemId => { 
            if (itemId.id == productId) { 
                itemId.quantity = (itemId.quantity || 1) + 1; 
                flag = false;
            }
        });
        if (flag) {
            basket.push(product);
        }
        renderbasket();
    })
});

closeModalBtn.addEventListener('click', () => {
    modal.classList.remove('is-open');
});

form.addEventListener('submit', (e) => {
    e.preventDefault();
    successBlock.style.display = 'block';
    form.style.display = 'none';
    basket.length = 0;
    renderbasket();
    form.reset();
});
window.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.classList.remove('is-open');
    }
});
