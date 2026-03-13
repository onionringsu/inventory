  const firebaseConfig = {
    apiKey: "AIzaSyDqDrusuQqUVNv30nim7kRVgID_98XCfg",
    authDomain: "inventory-system-5a036.firebaseapp.com",
    databaseURL: "https://inventory-system-5a036-default-rtdb.firebaseio.com",
    projectId: "inventory-system-5a036",
    storageBucket: "inventory-system-5a036.firebasestorage.app",
    messagingSenderId: "834014896123",
    appId: "1:834014896123:web:58533a5f3d44b94ad1355e"
  };

  firebase.initializeApp(firebaseConfig);
  const db = firebase.database();



  const loadingScreen = document.getElementById('loadingScreen');
  const progressFill = document.getElementById('progressFill');
  const progressText = document.getElementById('progressText');
  const auth = document.getElementById('auth');
  let progress = 0;
  const loadingInterval = setInterval(() => {
    progress += 2;
    if (progress > 100) progress = 100;
    progressFill.style.width = progress + '%';
    progressText.textContent = progress + '%';
    if (progress >= 100) {
      clearInterval(loadingInterval);
      loadingScreen.style.transition = 'opacity 0.5s ease';
      loadingScreen.style.opacity = '0';
      setTimeout(() => {
        loadingScreen.classList.add('hidden');
        auth.classList.remove('hidden');
      }, 500);
    }
  }, 30);

  const authForm = document.getElementById('authForm');
  const authTitle = document.getElementById('authTitle');
  const authBtn = document.getElementById('authBtn');
  const switchMode = document.getElementById('switchMode');
  const msg = document.getElementById('msg');
  const username = document.getElementById('username');
  const password = document.getElementById('password');

  const dashBtn = document.getElementById('dashBtn');
  const accountsBtn = document.getElementById('accountsBtn');
  const settingsBtn = document.getElementById('settingsBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const historyBtn = document.getElementById('historyBtn');
  const salesBtn = document.getElementById('salesBtn');
  const sidebar = document.getElementById('sidebar');
  const toggleSidebar = document.getElementById('toggleSidebar');
  const lightTheme = document.getElementById('lightTheme');
  const darkTheme = document.getElementById('darkTheme');
  const dashboard = document.getElementById('dashboard');
  const notification = document.getElementById('notification');

  let users = [];
  db.ref("users").on("value", snapshot => {
    users = snapshot.val() || [];
  });

  let currentUser = null;
  let isLogin = true;

  switchMode.addEventListener('click', () => {
    isLogin = !isLogin;
    authTitle.textContent = isLogin ? 'Login' : 'Create Account';
    authBtn.textContent = isLogin ? 'Login' : 'Create';
    switchMode.textContent = isLogin ? "Don't have an account? Create one" : "Already have an account? Login";
    username.value = '';
    password.value = '';
    msg.textContent = '';
    msg.style.color = 'red';
  });

  authForm.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      authForm.requestSubmit();
    }
  });

  authForm.addEventListener('submit', e => {
    e.preventDefault();
    const u = username.value.trim();
    const p = password.value.trim();
    if (!u || !p) {
      msg.textContent = 'Fill all fields';
      return;
    }
    isLogin ? login(u, p) : register(u, p);
  });

  function register(u, p) {
    if (users.find(x => x.user === u)) {
      msg.textContent = 'Username exists';
      return;
    }
    const isAdmin = users.length === 0;
    users.push({ user: u, pass: p, admin: isAdmin });
    db.ref("users").set(users);
    msg.style.color = 'green';
    msg.textContent = 'Account created. Login now.';
    username.value = '';
    password.value = '';
  }

  function login(u, p) {
    const found = users.find(x => x.user === u && x.pass === p);
    if (!found) {
      msg.textContent = 'Invalid credentials';
      return;
    }
    currentUser = found;
    auth.classList.add('hidden');
    dashboard.classList.remove('hidden');
    document.getElementById('welcome').textContent = `Welcome: ${found.user}`;
    if (!found.admin) accountsBtn.style.display = 'none';
    showSection('dash');
    username.value = '';
    password.value = '';
  }

  dashBtn.onclick = () => showSection('dash');
  accountsBtn.onclick = () => showSection('accounts');
  settingsBtn.onclick = () => showSection('settings');
  historyBtn.onclick = () => showSection('history');
  salesBtn.onclick = () => showSection('sales');
  logoutBtn.onclick = () => location.reload();

  function showSection(id) {
    ['dash', 'accounts', 'settings', 'history', 'sales'].forEach(s => document.getElementById(s).classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
    document.querySelectorAll('.menu-btn').forEach(b => b.classList.remove('active'));
    if (id === 'dash') dashBtn.classList.add('active');
    else if (id === 'accounts') accountsBtn.classList.add('active');
    else if (id === 'settings') settingsBtn.classList.add('active');
    else if (id === 'history') historyBtn.classList.add('active');
    else if (id === 'sales') salesBtn.classList.add('active');
    if (id === 'accounts') loadUsers();
    if (id === 'history') renderHistory();
    if (id === 'sales') renderSales();
  }

  function loadUsers() {
    if (!currentUser.admin) return;
    const table = document.getElementById('userTable');
    table.innerHTML = '<tr><th>Username</th><th>Password</th><th>Action</th></tr>';
    users.forEach((u, i) => {
      table.innerHTML += `<tr>
        <td><input type="text" value="${u.user}" data-index="${i}" class="edit-user"></td>
        <td><input type="password" value="${u.pass}" data-index="${i}" class="edit-pass"></td>
        <td>
          <button class="edit-btn" onclick="saveUser(${i})">Save</button>
          <button class="delete-btn" onclick="deleteUser(${i})">Delete</button>
        </td>
      </tr>`;
    });
  }

  function saveUser(i) {
    const inputsUser = document.querySelectorAll('.edit-user');
    const inputsPass = document.querySelectorAll('.edit-pass');
    const newUser = inputsUser[i].value.trim();
    const newPass = inputsPass[i].value.trim();
    if (!newUser || !newPass) {
      alert('Fill all fields');
      return;
    }
    const oldUser = users[i].user;
    users[i].user = newUser;
    users[i].pass = newPass;
    db.ref("users").set(users);
    loadUsers();
    showNotification('User updated successfully!');
    addHistory('User Update', `Changed "${oldUser}" to "${newUser}"`);
  }

  function deleteUser(i) {
    const deletedUser = users[i].user;
    users.splice(i, 1);
    db.ref("users").set(users);
    loadUsers();
    showNotification('User deleted!');
    addHistory('User Delete', `Deleted user "${deletedUser}"`);
  }

  toggleSidebar.onclick = () => sidebar.classList.toggle('minimized');
  lightTheme.onclick = () => document.body.classList.remove('dark');
  darkTheme.onclick = () => document.body.classList.add('dark');

  function showNotification(text) {
    notification.textContent = text;
    notification.classList.add('show');
    setTimeout(() => notification.classList.remove('show'), 2000);
  }

  let inventory = [];
  db.ref("inventory").on("value", snapshot => {
  inventory = snapshot.val() || [];
  inventory.forEach(p => {
    if (typeof p.qty !== 'number') p.qty = Number(p.qty) || 0;
  });
  renderInventory();
});

  const addProductBtn = document.getElementById('addProductBtn');
  const productName = document.getElementById('productName');
  const productQty = document.getElementById('productQty');
  const searchProduct = document.getElementById('searchProduct');

  addProductBtn.addEventListener('click', () => {
    const name = productName.value.trim();
    const qty = parseInt(productQty.value);
    if (!name || isNaN(qty)) {
      alert('Fill all fields');
      return;
    }
    inventory.push({ name, qty });
    db.ref("inventory").set(inventory);
    addHistory('Stock In', `Added product "${name}" with quantity ${qty}`);
    productName.value = '';
    productQty.value = '';
    showNotification('Product added!');
  });

  searchProduct.addEventListener('input', renderInventory);

  function renderInventory() {
    const table = document.getElementById('inventoryTable');
    const filter = searchProduct.value.toLowerCase();
    table.innerHTML = '<tr><th>Name</th><th>Stock</th><th>Stock Status</th><th>Action</th></tr>';
    inventory.forEach((p, i) => {
      let statusText = '';
      if (p.qty === 0) statusText = 'out of stock';
      else if (p.qty <= 5) statusText = 'low stock';
      else statusText = 'in stock';
      const matches = p.name.toLowerCase().includes(filter) || p.qty.toString().includes(filter) || statusText.includes(filter);
      if (matches) {
        let statusDisplay = '';
        if (statusText === 'out of stock') statusDisplay = '<span style="color:red;font-weight:bold;">Out of Stock</span>';
        else if (statusText === 'low stock') statusDisplay = '<span style="color:orange;font-weight:bold;">Low Stock</span>';
        else statusDisplay = '<span style="color:green;font-weight:bold;">In Stock</span>';
        table.innerHTML += `<tr>
          <td class="editable" data-index="${i}" data-field="name">${p.name}</td>
          <td><div class="qty-container"><span class="qty" data-index="${i}">${p.qty}</span> <button class="minus" data-index="${i}">-</button> <button class="plus" data-index="${i}">+</button></div></td>
          <td>${statusDisplay}</td>
          <td><button class="delete-product-btn" data-index="${i}">Delete</button></td>
        </tr>`;
      }
    });
    attachInventoryEvents();
    updateInventorySummary();
  }

  function updateInventorySummary() {
    const totalProducts = inventory.length;
    const totalQty = inventory.reduce((a, b) => a + b.qty, 0);
    document.getElementById('inventorySummary').innerHTML = `<strong>Total Products:</strong> ${totalProducts} | <strong>Total Stock:</strong> ${totalQty}`;
  }

  function attachInventoryEvents() {
    document.querySelectorAll('.editable').forEach(td => {
      td.onclick = () => {
        const i = parseInt(td.dataset.index);
        const field = td.dataset.field;
        const current = inventory[i][field];
        const input = document.createElement('input');
        input.value = current;
        td.innerHTML = '';
        td.appendChild(input);
        input.focus();
        input.onblur = () => {
          inventory[i][field] = input.value.trim();
          db.ref("inventory").set(inventory);
          addHistory('Product Update', `Renamed product to "${inventory[i][field]}"`);

        };
      };
    });
    document.querySelectorAll('.minus').forEach(btn => {
      btn.onclick = () => showQtyModal(parseInt(btn.dataset.index), 'sale');
    });
    document.querySelectorAll('.plus').forEach(btn => {
      btn.onclick = () => showQtyModal(parseInt(btn.dataset.index), 'restock');
    });
    document.querySelectorAll('.delete-product-btn').forEach(btn => {
      btn.onclick = () => {
        const i = parseInt(btn.dataset.index);
        const name = inventory[i].name;
        inventory.splice(i, 1);
        db.ref("inventory").set(inventory);
        addHistory('Product Removed', `Deleted product "${name}"`);
        showNotification('Product deleted!');
      };
    });
  }

  function showQtyModal(i, type) {
    const p = inventory[i];
    const modal = document.createElement('div');
    modal.className = 'edit-modal';
    modal.innerHTML = `<h3>${type === 'sale' ? 'Reduce Stock' : 'Restock'} "${p.name}"</h3>
    <label>Quantity: <input type="number" id="qtyChange" min="1" value="1"></label>
    <p id="summary"></p>
    <button id="confirmBtn">Confirm</button>
    <button id="cancelBtn">Cancel</button>`;
    document.body.appendChild(modal);
    const input = modal.querySelector('#qtyChange');
    const summary = modal.querySelector('#summary');
    function updateSummary() {
      const val = parseInt(input.value);
      if (type === 'sale') summary.textContent = val > p.qty ? 'Invalid quantity' : 'New quantity: ' + (p.qty - val);
      else summary.textContent = 'New quantity: ' + (p.qty + val);
    }
    input.oninput = updateSummary;
    updateSummary();
    modal.querySelector('#confirmBtn').onclick = () => {
      const val = parseInt(input.value);
      if (isNaN(val) || val <= 0) {
        alert('Enter valid number');
        return;
      }
      if (type === 'sale') {
        if (val > p.qty) {
          alert('Cannot reduce more than stock');
          return;
        }
        p.qty -= val;
        logSale(p.name, val);
        addHistory('Stock Out', `Sold ${val} of "${p.name}" | Remaining stock: ${p.qty}`);
      } else {
        const oldStock = p.qty;
        p.qty += val;
        addHistory('Stock In', `Restocked ${val} of "${p.name}" | Previous stock: ${oldStock} | New stock: ${p.qty}`);
      }
      db.ref("inventory").set(inventory);
      document.body.removeChild(modal);
    };
    modal.querySelector('#cancelBtn').onclick = () => {
      document.body.removeChild(modal);
    };
  }


  let history = [];
  db.ref("history").on("value", snapshot => {
    history = snapshot.val() || [];
    renderHistory();
  });

  const historyDate = document.getElementById('historyDate');
  const historyType = document.getElementById('historyType');
  const historySearch = document.getElementById('historySearch');

  function addHistory(action, details) {
    const timestamp = new Date().toLocaleString();
    history.push({ timestamp, action, details });
    db.ref("history").set(history);
    renderHistory();
  }

  const clearHistoryBtn = document.getElementById('clearHistoryBtn');
  clearHistoryBtn.onclick = () => {
    if (confirm('Are you sure you want to clear the entire history?')) {
      history = [];
      db.ref("history").set(history);
      renderHistory();
      showNotification('History cleared!');
    }
  };

  historyDate.onchange = renderHistory;
  historyType.onchange = renderHistory;
  historySearch.addEventListener('input', renderHistory);

  function renderHistory() {
    const table = document.getElementById('historyTable').querySelector('tbody');
    table.innerHTML = '';
    let filtered = history;
    if (historyDate.value) {
      const d = new Date(historyDate.value);
      filtered = filtered.filter(h => {
        const ht = new Date(h.timestamp);
        return ht.getFullYear() === d.getFullYear() && ht.getMonth() === d.getMonth() && ht.getDate() === d.getDate();
      });
    }
    if (historyType.value && historyType.value !== 'all') {
      filtered = filtered.filter(h => h.action === historyType.value);
    }
    if (historySearch.value) {
      const search = historySearch.value.toLowerCase();
      filtered = filtered.filter(h => h.action.toLowerCase().includes(search) || h.details.toLowerCase().includes(search));
    }
    filtered.forEach(log => {
      const row = document.createElement('tr');
      row.innerHTML = `<td>${log.timestamp}</td><td>${log.action}</td><td>${log.details}</td>`;
      table.appendChild(row);
    });
  }
  let sales = [];
  db.ref("sales").on("value", snapshot => {
    sales = snapshot.val() || [];
    renderSales();
  });

  let saleTableBody = document.getElementById('saleTable').querySelector('tbody');
  const viewTypeSelect = document.getElementById('viewType');
  const startDate = document.getElementById('startDate');
  const endDate = document.getElementById('endDate');
  const applyFilterBtn = document.getElementById('applyFilter');
  const clearSalesBtn = document.getElementById('clearSales');

  function renderSales() {
    saleTableBody.innerHTML = '';
    let filteredSales = sales;
    if (startDate.value) {
      const start = new Date(startDate.value);
      filteredSales = filteredSales.filter(s => new Date(s.date) >= start);
    }
    if (endDate.value) {
      const end = new Date(endDate.value);
      end.setHours(23, 59, 59, 999);
      filteredSales = filteredSales.filter(s => new Date(s.date) <= end);
    }
    const productTotals = {};
    filteredSales.forEach(s => {
      if (!productTotals[s.product]) productTotals[s.product] = 0;
      productTotals[s.product] += s.qty;
    });
    let sortedProducts = Object.entries(productTotals);
    if (viewTypeSelect.value === 'best') sortedProducts.sort((a, b) => b[1] - a[1]);
    else sortedProducts.sort((a, b) => a[1] - b[1]);
    sortedProducts.forEach(([name, qty], idx) => {
      const lastSale = filteredSales.filter(s => s.product === name).sort((a, b) => new Date(b.date) - new Date(a.date))[0];
      const row = document.createElement('tr');
      if (idx === 0 && viewTypeSelect.value === 'best') row.classList.add('top-seller');
      row.innerHTML = `<td>${name}</td><td>${qty}</td><td>${new Date(lastSale.date).toLocaleString()}</td>`;
      saleTableBody.appendChild(row);
    });
  }

  applyFilterBtn.onclick = () => renderSales();
  clearSalesBtn.onclick = () => {
    if (confirm('Are you sure you want to clear all sales?')) {
      sales = [];
      db.ref("sales").set(sales);
      renderSales();
      showNotification('All sales cleared!');
    }
  };

  function logSale(product, qty) {
    sales.push({ product, qty, date: new Date().toISOString() });
    db.ref("sales").set(sales);
    renderSales();
  }
