document.addEventListener("DOMContentLoaded", () => {
    const path = window.location.pathname;

    // Deteksi halaman berdasarkan nama file
    if (path.includes("login.html") || path.endsWith("/")) {
        initLoginPage();
    } else if (path.includes("index.html")) {
        initCatalogPage();
    }
});

/* ==========================================================
   1. LOGIC HALAMAN LOGIN
   ========================================================== */
function initLoginPage() {
    // Jika sudah ada sesi, langsung lempar ke index.html (Auth Guard kebalikannya)
    if (localStorage.getItem("firstName")) {
        window.location.href = "index.html";
        return;
    }

    const loginForm = document.getElementById("loginForm");
    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");
    const errorMessage = document.getElementById("errorMessage");
    const loadingIndicator = document.getElementById("loadingIndicator");

    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();

        errorMessage.textContent = "";
        loadingIndicator.classList.remove("hidden");

        try {
            const response = await fetch("https://dummyjson.com/users");
            if (!response.ok) throw new Error("Gagal terhubung ke server API.");
            
            const data = await response.json();
            // Validasi data user dari API DummyJSON
            const validUser = data.users.find(
                (user) => user.username === username && user.password === password
            );

            if (validUser) {
                localStorage.setItem("firstName", validUser.firstName);
                window.location.href = "index.html";
            } else {
                throw new Error("Username atau password salah!");
            }
        } catch (error) {
            errorMessage.textContent = error.message;
        } finally {
            loadingIndicator.classList.add("hidden");
        }
    });
}

/* ==========================================================
   2. LOGIC HALAMAN KATALOG PRODUK (`index.html`)
   ========================================================== */
function initCatalogPage() {
    // Auth Guard: Cek apakah user sudah login
    const firstName = localStorage.getItem("firstName");
    if (!firstName) {
        window.location.href = "login.html";
        return;
    }

    document.getElementById("welcomeUser").textContent = `Halo, ${firstName}`;

    // Elemen DOM
    const logoutBtn = document.getElementById("logoutBtn");
    const productGrid = document.getElementById("productGrid");
    const searchInput = document.getElementById("searchInput");
    const categorySelect = document.getElementById("categorySelect");
    const sortSelect = document.getElementById("sortSelect");
    const loadMoreBtn = document.getElementById("loadMoreBtn");
    const globalError = document.getElementById("globalError");

    // Tombol Logout
    logoutBtn.addEventListener("click", () => {
        localStorage.removeItem("firstName");
        window.location.href = "login.html";
    });

    // State Aplikasi
    let allProducts = [];
    let displayedLimit = 9; // Diatur menjadi 9 produk awal sesuai permintaan
    let currentFilteredProducts = [];

    // Fetch Data Produk
    async function fetchProducts() {
        try {
            globalError.classList.add("hidden");
            const response = await fetch("https://dummyjson.com/products?limit=100");
            if (!response.ok) throw new Error("Gagal memuat data produk dari server.");
            
            const data = await response.json();
            allProducts = data.products;
            currentFilteredProducts = allProducts;

            loadCategories();
            renderProducts();
        } catch (error) {
            globalError.textContent = error.message;
            globalError.classList.remove("hidden");
        }
    }

    // Load Dropdown Kategori secara dinamis
    function loadCategories() {
        const categories = [...new Set(allProducts.map((p) => p.category))];
        categories.forEach((cat) => {
            const option = document.createElement("option");
            option.value = cat;
            option.textContent = cat.toUpperCase();
            categorySelect.appendChild(option);
        });
    }

    // Render Produk ke Grid (Menggunakan Array Slicing untuk Pagination/Load More)
    function renderProducts() {
        productGrid.innerHTML = "";
        const slicedProducts = currentFilteredProducts.slice(0, displayedLimit);

        if (slicedProducts.length === 0) {
            productGrid.innerHTML = "<p>Tidak ada produk yang ditemukan.</p>";
            loadMoreBtn.classList.add("hidden");
            return;
        }

        slicedProducts.forEach((product) => {
            const card = document.createElement("div");
            card.classList.add("product-card");
            card.dataset.id = product.id; // Untuk Event Delegation

            card.innerHTML = `
                <img src="${product.thumbnail}" alt="${product.title}">
                <h3>${product.title}</h3>
                <div class="product-price">$${product.price}</div>
                <button class="add-to-cart-btn" data-id="${product.id}">Tambah ke Keranjang</button>
            `;
            productGrid.appendChild(card);
        });

        // Sembunyikan tombol load more jika semua data sudah tampil
        if (displayedLimit >= currentFilteredProducts.length) {
            loadMoreBtn.classList.add("hidden");
        } else {
            loadMoreBtn.classList.remove("hidden");
        }
    }

    // Tombol Load More (menambahkan 9 produk lagi setiap kali diklik)
    loadMoreBtn.addEventListener("click", () => {
        displayedLimit += 9;
        renderProducts();
    });

    /* --- Functional Programming: Filter & Sorting --- */
    function applyFiltersAndSorting() {
        const keyword = searchInput.value.toLowerCase();
        const selectedCategory = categorySelect.value;
        const sortOrder = sortSelect.value;

        // 1. Filter berdasarkan Search & Kategori
        currentFilteredProducts = allProducts.filter((product) => {
            const matchesSearch = product.title.toLowerCase().includes(keyword);
            const matchesCategory = selectedCategory === "" || product.category === selectedCategory;
            return matchesSearch && matchesCategory;
        });

        // 2. Sorting Berdasarkan Harga
        if (sortOrder === "asc") {
            currentFilteredProducts.sort((a, b) => a.price - b.price);
        } else if (sortOrder === "desc") {
            currentFilteredProducts.sort((a, b) => b.price - a.price);
        }

        displayedLimit = 9; // Reset batch ke 9 produk pertama setiap filter berubah
        renderProducts();
    }

    /* --- Debounce via Closures untuk Search Input --- */
    function debounce(func, delay) {
        let timeoutId;
        return function (...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                func.apply(this, args);
            }, delay);
        };
    }

    searchInput.addEventListener("input", debounce(() => {
        applyFiltersAndSorting();
    }, 300));

    categorySelect.addEventListener("change", applyFiltersAndSorting);
    sortSelect.addEventListener("change", applyFiltersAndSorting);

    /* --- Event Delegation untuk Modal Detail & Add to Cart --- */
    const productModal = document.getElementById("productModal");
    const modalBody = document.getElementById("modalBody");
    const closeModal = document.getElementById("closeModal");

    productGrid.addEventListener("click", (e) => {
        const card = e.target.closest(".product-card");
        if (!card) return;

        const productId = card.dataset.id;
        const product = allProducts.find((p) => p.id == productId);

        // Jika tombol "Tambah ke Keranjang" diklik, jangan buka modal
        if (e.target.classList.contains("add-to-cart-btn")) {
            addToCart(product);
            return;
        }

        // Buka Modal Detail Produk
        if (product) {
            modalBody.innerHTML = `
                <img src="${product.thumbnail}" style="width:100%; height:200px; object-fit:contain; margin-bottom:15px;">
                <h2>${product.title}</h2>
                <p><strong>Kategori:</strong> ${product.category}</p>
                <p><strong>Brand:</strong> ${product.brand || 'N/A'}</p>
                <p><strong>Harga:</strong> $${product.price}</p>
                <p><strong>Rating:</strong> ⭐ ${product.rating}</p>
                <p><strong>Stok:</strong> ${product.stock}</p>
                <p style="margin-top:10px;">${product.description}</p>
            `;
            productModal.classList.remove("hidden");
        }
    });

    closeModal.addEventListener("click", () => {
        productModal.classList.add("hidden");
    });

    window.addEventListener("click", (e) => {
        if (e.target === productModal) productModal.classList.add("hidden");
        if (e.target === cartModal) cartModal.classList.add("hidden");
    });

    /* --- Keranjang Belanja & LocalStorage CRUD --- */
    const cartBtn = document.getElementById("cartBtn");
    const cartModal = document.getElementById("cartModal");
    const closeCartModal = document.getElementById("closeCartModal");
    const cartItemsList = document.getElementById("cartItemsList");
    const cartTotal = document.getElementById("cartTotal");
    const cartCount = document.getElementById("cartCount");

    function getCart() {
        return JSON.parse(localStorage.getItem("cart")) || [];
    }

    function saveCart(cart) {
        localStorage.setItem("cart", JSON.stringify(cart));
        updateCartBadge();
    }

    function updateCartBadge() {
        const cart = getCart();
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = totalItems;
    }

    function addToCart(product) {
        let cart = getCart();
        const existingIndex = cart.findIndex((item) => item.id === product.id);

        if (existingIndex > -1) {
            cart[existingIndex].quantity += 1;
        } else {
            cart.push({ ...product, quantity: 1 });
        }

        saveCart(cart);
        alert(`Produk "${product.title}" berhasil ditambahkan ke keranjang!`);
    }

    cartBtn.addEventListener("click", () => {
        renderCartModal();
        cartModal.classList.remove("hidden");
    });

    closeCartModal.addEventListener("click", () => {
        cartModal.classList.add("hidden");
    });

    function renderCartModal() {
        const cart = getCart();
        cartItemsList.innerHTML = "";

        if (cart.length === 0) {
            cartItemsList.innerHTML = "<p>Keranjang masih kosong.</p>";
            cartTotal.innerHTML = "";
            return;
        }

        let totalPrice = 0;
        cart.forEach((item) => {
            totalPrice += item.price * item.quantity;
            const itemDiv = document.createElement("div");
            itemDiv.style.cssText = "display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; border-bottom:1px solid #eee; padding-bottom:8px;";
            
            itemDiv.innerHTML = `
                <div>
                    <strong>${item.title}</strong><br>
                    $${item.price} x ${item.quantity}
                </div>
                <button onclick="window.removeFromCart(${item.id})" style="background:#e74c3c; padding:5px 10px; font-size:12px;">Hapus</button>
            `;
            cartItemsList.appendChild(itemDiv);
        });

        cartTotal.innerHTML = `<strong>Total Belanja: $${totalPrice.toFixed(2)}</strong>`;
    }

    // Fungsi global untuk hapus item keranjang dari DOM handler
    window.removeFromCart = function (id) {
        let cart = getCart();
        cart = cart.filter((item) => item.id !== id);
        saveCart(cart);
        renderCartModal();
    };

    // Inisialisasi awal saat halaman katalog dibuka
    updateCartBadge();
    fetchProducts();

    // Elemen DOM untuk Modal Menu User
    const userIconBtn = document.getElementById("userIconBtn");
    const userMenuModal = document.getElementById("userMenuModal");
    const closeUserMenuModal = document.getElementById("closeUserMenuModal");
    const btnKeranjangKu = document.getElementById("btnKeranjangKu");
    const btnLogoutModal = document.getElementById("btnLogoutModal");

    // Tampilkan Nama Depan User
    document.getElementById("welcomeUser").textContent = firstName;

    // Buka Modal Overlay saat ikon user diklik
    userIconBtn.addEventListener("click", () => {
        userMenuModal.classList.remove("hidden");
    });

    // Tutup Modal Overlay
    closeUserMenuModal.addEventListener("click", () => {
        userMenuModal.classList.add("hidden");
    });

    // Aksi tombol "Keranjang-ku" di dalam modal overlay
    btnKeranjangKu.addEventListener("click", () => {
        userMenuModal.classList.add("hidden");
        renderCartModal();
        cartModal.classList.remove("hidden");
    });

    // Aksi tombol "Logout" di dalam modal overlay
    btnLogoutModal.addEventListener("click", () => {
        localStorage.removeItem("firstName");
        window.location.href = "login.html";
    });

    // Tutup modal jika area luar kotak diklik
    window.addEventListener("click", (e) => {
        if (e.target === productModal) productModal.classList.add("hidden");
        if (e.target === cartModal) cartModal.classList.add("hidden");
        if (e.target === userMenuModal) userMenuModal.classList.add("hidden");
    });
}


