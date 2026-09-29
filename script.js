// AUTH GUARD
if (!localStorage.getItem('firstName')) {
    window.location.href = 'Page1.html';
}

const user = localStorage.getItem('firstName');

const userNameElement = document.getElementById('userName');
if (userNameElement) userNameElement.textContent = user;

let products = [];
let filteredProducts = [];
let cart = JSON.parse(localStorage.getItem('cart')) || [];
let limit = 10;

const productGrid = document.getElementById('productGrid');
const errorBox = document.getElementById('globalError');

function showError(msg){
    errorBox.textContent = msg;
    errorBox.classList.remove('hidden');
}

async function loadProducts(){
    try{
        // limit=0 = ambil SEMUA produk (default API cuma balikin 30 dari 194 produk)
        const res = await fetch('https://dummyjson.com/products?limit=0');
        if(!res.ok) throw new Error('Gagal mengambil produk');
        const data = await res.json();
        products = data.products;
        filteredProducts = [...products];
        createCategory();
        renderProducts();
        updateCart();
    }catch(err){
        showError('Produk gagal dimuat. Cek koneksi internet.');
    }
}

function renderProducts(){
    productGrid.innerHTML = '';

    filteredProducts.slice(0, limit).forEach(product=>{
        productGrid.innerHTML += `
        <div class="product-card" data-id="${product.id}">
            <img src="${product.thumbnail}">
            <h3>${product.title}</h3>
            <p>$${product.price}</p>
            <p>⭐ ${product.rating}</p>
            <p>Diskon ${product.discountPercentage}%</p>
            <p>${product.category}</p>
            <button onclick="addCart(${product.id}); event.stopPropagation();">Tambah ke Keranjang</button>
        </div>`;
    });
}

function createCategory(){
    const select = document.getElementById('categorySelect');
    const categories = [...new Set(products.map(p=>p.category))];

    categories.forEach(cat=>{
        select.innerHTML += `<option value="${cat}">${cat}</option>`;
    });
}

// Debounce + Closure
function debounce(fn, delay){
    let timer;
    return function(){
        clearTimeout(timer);
        timer=setTimeout(fn,delay);
    }
}

document.getElementById('searchInput').addEventListener('input', debounce(()=>{
    const key=document.getElementById('searchInput').value.toLowerCase();
    filteredProducts=products.filter(p=>
        p.title.toLowerCase().includes(key) ||
        p.category.toLowerCase().includes(key)
    );
    renderProducts();
},500));

// filter kategori
document.getElementById('categorySelect').addEventListener('change',e=>{
    filteredProducts=e.target.value ? products.filter(p=>p.category===e.target.value) : [...products];
    renderProducts();
});

// sorting
document.getElementById('sortSelect').addEventListener('change',e=>{
    if(e.target.value==='asc') filteredProducts.sort((a,b)=>a.price-b.price);
    if(e.target.value==='desc') filteredProducts.sort((a,b)=>b.price-a.price);
    if(e.target.value==='rating_desc') filteredProducts.sort((a,b)=>b.rating-a.rating);
    if(e.target.value==='rating_asc') filteredProducts.sort((a,b)=>a.rating-b.rating);
    renderProducts();
});

// cart localStorage
window.addCart=function(id){
    const item=products.find(p=>p.id===id);
    cart.push(item);
    localStorage.setItem('cart',JSON.stringify(cart));
    updateCart();
}

function updateCart(){
    document.getElementById('cartCount').textContent = cart.length;

    const totalElement = document.getElementById('cartTotal');
    if(totalElement){
        const total = cart.reduce((sum,item)=>sum + item.price, 0);
        totalElement.textContent = "Total: $" + total.toFixed(2);
    }

    if(cart.length === 0){
        localStorage.removeItem('cart');
    } else {
        localStorage.setItem('cart', JSON.stringify(cart));
    }

    renderCartItems();
}

// Menampilkan daftar item di dalam modal keranjang (#cartItemsList tadinya belum pernah diisi)
function renderCartItems(){
    const list = document.getElementById('cartItemsList');
    if(!list) return;

    if(cart.length === 0){
        list.innerHTML = '<p>Keranjang masih kosong.</p>';
        return;
    }

    list.innerHTML = cart.map((item, index) => `
        <div class="cart-item-row">
            <span>${item.title} - $${item.price}</span>
            <button onclick="removeCartItem(${index})">Hapus</button>
        </div>
    `).join('');
}

// Hapus satu item dari keranjang berdasarkan posisinya
window.removeCartItem = function(index){
    cart.splice(index, 1);
    updateCart();
}

// load more
document.getElementById('loadMoreBtn').addEventListener('click',()=>{
    limit += 10;
    renderProducts();
});

// modal event delegation
document.getElementById('productGrid').addEventListener('click',e=>{
    const card=e.target.closest('.product-card');
    if(!card) return;

    const product=products.find(p=>p.id==card.dataset.id);

    document.getElementById('modalBody').innerHTML=`
        <h2>${product.title}</h2>
        <p>Brand: ${product.brand}</p>
        <p>Stock: ${product.stock}</p>
        <p>${product.description}</p>`;

    document.getElementById('productModal').classList.remove('hidden');
});

document.getElementById('closeModal').onclick=()=>{
    document.getElementById('productModal').classList.add('hidden');
};

// logout
function logout(){
    localStorage.removeItem('firstName');
    localStorage.removeItem('username');
    window.location.href='Page1.html';
}

document.getElementById('btnLogoutModal').onclick=logout;

document.getElementById('cartBtn').onclick=()=>{
    document.getElementById('cartModal').classList.remove('hidden');
};

document.getElementById('closeCartModal').onclick=()=>{
    document.getElementById('cartModal').classList.add('hidden');
};

if(document.getElementById('closeUserMenuModal')){
 document.getElementById('closeUserMenuModal').onclick=()=>{
    document.getElementById('userMenuModal').classList.add('hidden');
 };
}

if(document.getElementById('userIconBtn')){
 document.getElementById('userIconBtn').onclick=()=>{
    document.getElementById('userMenuModal').classList.remove('hidden');
 };
}

loadProducts();
