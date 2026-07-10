// assets/admin.js

let products = [];

document.addEventListener('DOMContentLoaded', fetchProducts);

async function fetchProducts() {
    try {
        const res = await fetch('/api/products');
        products = await res.json();
        renderTable();
    } catch (e) {
        console.error('Error fetching products', e);
    }
}

function renderTable() {
    const tbody = document.getElementById('products-body');
    tbody.innerHTML = '';
    
    products.forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><img src="${p.image}" class="thumb" alt="${p.title}"></td>
            <td>${p.title}</td>
            <td>${p.handle}</td>
            <td>$${parseFloat(p.price).toFixed(2)}</td>
            <td>
                <button class="btn-edit" onclick="editProduct(${p.id})">Edit</button>
                <button class="btn-danger" onclick="deleteProduct(${p.id})">Delete</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Modal logic
const modal = document.getElementById('productModal');
const form = document.getElementById('productForm');

function openModal() {
    form.reset();
    document.getElementById('productId').value = '';
    document.getElementById('modal-title').innerText = 'Add Product';
    modal.style.display = 'block';
}

function closeModal() {
    modal.style.display = 'none';
}

function editProduct(id) {
    const p = products.find(prod => prod.id === id);
    if (!p) return;
    
    document.getElementById('productId').value = p.id;
    document.getElementById('productTitle').value = p.title;
    document.getElementById('productHandle').value = p.handle;
    document.getElementById('productPrice').value = p.price;
    document.getElementById('productImage').value = p.image;
    document.getElementById('productImageHover').value = p.image_hover || '';
    document.getElementById('productDescription').value = p.description || '';
    
    document.getElementById('modal-title').innerText = 'Edit Product';
    modal.style.display = 'block';
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = document.getElementById('productId').value;
    const isEdit = !!id;
    
    const payload = {
        title: document.getElementById('productTitle').value,
        handle: document.getElementById('productHandle').value,
        price: parseFloat(document.getElementById('productPrice').value),
        image: document.getElementById('productImage').value,
        image_hover: document.getElementById('productImageHover').value,
        description: document.getElementById('productDescription').value
    };
    
    const url = isEdit ? `/api/admin/products/${id}` : '/api/admin/products';
    const method = isEdit ? 'PUT' : 'POST';
    
    try {
        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        
        if (res.ok) {
            closeModal();
            fetchProducts();
        } else {
            alert('Error saving product');
        }
    } catch(e) {
        console.error(e);
        alert('Network error');
    }
});

async function deleteProduct(id) {
    if(!confirm('Are you sure you want to delete this product?')) return;
    
    try {
        const res = await fetch(`/api/admin/products/${id}`, {
            method: 'DELETE'
        });
        
        if (res.ok) {
            fetchProducts();
        } else {
            alert('Error deleting product');
        }
    } catch(e) {
        console.error(e);
    }
}
