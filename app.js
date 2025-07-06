// Simple Vanilla JS + Tailwind PWA App

// App state and render functions
let items = JSON.parse(localStorage.getItem("shelflife-items") || "[]");
let screen = "home";
let dark = window.matchMedia("(prefers-color-scheme: dark)").matches;

function saveItems() {
  localStorage.setItem("shelflife-items", JSON.stringify(items));
}

function notifyExpiry() {
  if (!("Notification" in window)) return;
  Notification.requestPermission().then((perm) => {
    if (perm !== "granted") return;
    const now = Date.now();
    items.forEach(item => {
      const diff = new Date(item.expiry) - now;
      if (diff > 0 && diff <= 86400000) {
        new Notification("Expiry Alert", { body: `${item.name} expires tomorrow!`, icon: "icons/icon-192.png" });
      }
    });
  });
}

function render() {
  const root = document.getElementById("root");
  root.innerHTML = "";

  // Navigation
  const nav = document.createElement("nav");
  nav.className = "flex justify-around p-4 bg-purple-600 text-white fixed bottom-0 w-full";
  ["home","add","all","settings"].forEach(s => {
    const btn = document.createElement("button");
    btn.textContent = { home:"🏠",add:"➕",all:"📦",settings:"⚙️" }[s];
    btn.className = `text-xl ${screen===s?"opacity-100":"opacity-60"}`;
    btn.onclick = () => { screen = s; render(); };
    nav.appendChild(btn);
  });

  const main = document.createElement("div");
  main.className = "pb-16";
  if (screen === "home") renderHome(main);
  if (screen === "add") renderAdd(main);
  if (screen === "all") renderAll(main);
  if (screen === "settings") renderSettings(main);

  root.appendChild(main);
  root.appendChild(nav);
}

function renderHome(main) {
  const weekAgo = Date.now() - 7*86400000;
  const total = items.filter(i=>new Date(i.dateAdded)>=weekAgo).reduce((a,i)=>a+parseFloat(i.price),0);
  const soon = items.filter(i => {
    const d = new Date(i.expiry) - Date.now();
    return d>=0 && d<=3*86400000;
  });
  main.innerHTML = `
    <div class="p-4">
      <h1 class="text-2xl font-bold">ShelfLife</h1>
      <div class="mt-4 grid gap-4">
        <div class="p-4 bg-purple-100 rounded">This week's expenses: €${total.toFixed(2)}</div>
        <div class="p-4 bg-yellow-100 rounded">Expiring soon: ${soon.length} items</div>
      </div>
    </div>`;
}

function renderAdd(main) {
  main.innerHTML = `
    <div class="p-4">
      <h1 class="text-xl font-semibold">Add Item</h1>
      <form id="addForm" class="space-y-4 mt-4">
        <input id="name" type="text" placeholder="Name" required class="w-full p-2 border rounded" />
        <div id="suggestions" class="bg-gray-100 rounded"></div>
        <input id="price" type="number" placeholder="Price (€)" required class="w-full p-2 border rounded" />
        <input id="quantity" type="number" placeholder="Quantity" class="w-full p-2 border rounded" />
        <input id="category" placeholder="Category" class="w-full p-2 border rounded" />
        <input id="expiry" type="date" required class="w-full p-2 border rounded" />
        <button type="submit" class="w-full bg-purple-600 text-white p-2 rounded">Save</button>
      </form>
    </div>`;
  const form = document.getElementById("addForm");
  const nameI = document.getElementById("name");
  const sugg = document.getElementById("suggestions");

  nameI.oninput = () => {
    const matches = items.filter(i=>i.name.toLowerCase().startsWith(nameI.value.toLowerCase()));
    sugg.innerHTML = matches.slice(0,3).map(m => `<div class="px-2 py-1 hover:bg-gray-200 cursor-pointer">${m.name} – €${m.price} – ${m.category}</div>`).join("");
    sugg.querySelectorAll("div").forEach((el,i)=>{
      el.onclick = ()=> {
        const m = matches[i];
        nameI.value = m.name;
        document.getElementById("price").value = m.price;
        document.getElementById("category").value = m.category;
        sugg.innerHTML = "";
      }
    });
  };

  form.onsubmit = e => {
    e.preventDefault();
    items.push({
      name: nameI.value,
      price: document.getElementById("price").value,
      quantity: document.getElementById("quantity").value,
      category: document.getElementById("category").value,
      expiry: document.getElementById("expiry").value,
      dateAdded: new Date().toISOString()
    });
    saveItems();
    form.reset();
    render();
    notifyExpiry();
  };
}

function renderAll(main) {
  main.innerHTML = `
    <div class="p-4">
      <h1 class="text-xl font-semibold">All Items</h1>
      <div class="mt-4 space-y-2">${items.map(i => `
        <div class="p-2 bg-gray-100 rounded dark:bg-gray-800">
          <div class="font-bold">${i.name}</div>
          <div>€${i.price} • ${i.category} • ${i.expiry}</div>
        </div>`).join("")}
      </div>
    </div>`;
}

function renderSettings(main) {
  main.innerHTML = `
    <div class="p-4">
      <h1 class="text-xl font-semibold">Settings</h1>
      <button id="toggleDark" class="bg-purple-600 text-white p-2 rounded mt-4">${dark?"Light":"Dark"} Mode</button>
    </div>`;
  document.getElementById("toggleDark").onclick = () => {
    dark = !dark;
    document.documentElement.classList.toggle("dark", dark);
  };
}

render();
notifyExpiry();
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("serviceWorker.js"));
}
