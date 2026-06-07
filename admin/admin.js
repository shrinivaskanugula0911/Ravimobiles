const SUPABASE_URL = "https://ajvvmvnwapqeivkbfdfj.supabase.co";
const SUPABASE_KEY = "sb_publishable_IWdtyPIKa78vE0xRWWdi9g_guQectu_";

async function fetchSupabaseData() {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/ravi_mobiles_config?select=key,value`, {
            headers: {
                "apikey": SUPABASE_KEY,
                "Authorization": `Bearer ${SUPABASE_KEY}`
            }
        });
        if (!response.ok) throw new Error("Supabase request failed");
        const data = await response.json();
        
        const config = {};
        data.forEach(item => {
            config[item.key] = item.value;
        });
        return config;
    } catch (err) {
        console.error("Error fetching from Supabase:", err);
        return null;
    }
}

async function saveToSupabase(key, value) {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/ravi_mobiles_config?on_conflict=key`, {
            method: 'POST',
            headers: {
                "apikey": SUPABASE_KEY,
                "Authorization": `Bearer ${SUPABASE_KEY}`,
                "Content-Type": "application/json",
                "Prefer": "resolution=merge-duplicates"
            },
            body: JSON.stringify({ key: key, value: value })
        });
        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Supabase update failed (${response.status}): ${errText}`);
        }
        return true;
    } catch (err) {
        console.error(`Error saving ${key} to Supabase:`, err);
        return false;
    }
}

async function uploadImageToSupabase(file) {
    // Sanitize filename to avoid weird character issues
    const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `${Date.now()}_${cleanName}`;
    
    try {
        const response = await fetch(`${SUPABASE_URL}/storage/v1/object/images/${filePath}`, {
            method: 'POST',
            headers: {
                "apikey": SUPABASE_KEY,
                "Authorization": `Bearer ${SUPABASE_KEY}`,
                "Content-Type": file.type
            },
            body: file
        });
        
        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Upload failed: ${errText}`);
        }
        
        // Return the public URL
        return `${SUPABASE_URL}/storage/v1/object/public/images/${filePath}`;
    } catch (err) {
        console.error("Storage upload error:", err);
        showToast("Error uploading file to storage.", "error");
        return null;
    }
}

// Image lists already uploaded in the images folder
const availableImages = [
    "images/boatSpeaker.jpeg",
    "images/boatWatch.jpeg",
    "images/fittickSmartWatch.jpeg",
    "images/hero_bg.png",
    "images/iphone.jpeg",
    "images/iphone_15.png",
    "images/logo.png",
    "images/redmiMobile.jpeg",
    "images/samsung_s24.png",
    "images/showroom_1.png",
    "images/showroom_2.png",
    "images/showroom_3.png",
    "images/smartWatch.jpeg",
    "images/varniBuds.jpeg",
    "images/vivoMobile.jpeg"
];

// Default site data
const defaultProducts = [
    {
        name: "Vivo Y19s",
        image: "images/vivoMobile.jpeg",
        status: "in-stock",
        statusText: "In Stock",
        price: "₹10,999",
        brand: "VIVO"
    },
    {
        name: "Redmi Note 11",
        image: "images/redmiMobile.jpeg",
        status: "limited",
        statusText: "Limited",
        price: "₹11,999",
        brand: "REDMI"
    },
    {
        name: "iPhone 12",
        image: "images/iphone.jpeg",
        status: "in-stock",
        statusText: "In Stock",
        price: "₹24,999",
        brand: "APPLE"
    },
    {
        name: "Boat Storm Call 3",
        image: "images/boatWatch.jpeg",
        status: "in-stock",
        statusText: "In Stock",
        price: "₹1,499",
        brand: "BOAT"
    },
    {
        name: "VARNI Earbuds",
        image: "images/varniBuds.jpeg",
        status: "in-stock",
        statusText: "In Stock",
        price: "₹999",
        brand: "VARNI"
    },
    {
        name: "Fit Tick Smart Watch",
        image: "images/fittickSmartWatch.jpeg",
        status: "in-stock",
        statusText: "In Stock",
        price: "₹1,499",
        brand: "FIT TICK"
    },
    {
        name: "BoAt Sound Bar",
        image: "images/boatSpeaker.jpeg",
        status: "in-stock",
        statusText: "In Stock",
        price: "₹1,999",
        brand: "BOAT"
    },
    {
        name: "FireBoult Smart Watch",
        image: "images/smartWatch.jpeg",
        status: "limited",
        statusText: "Limited",
        price: "₹1,399",
        brand: "FireBoult"
    }
];

const defaultScrollImages = [
    "images/showroom_1.png",
    "images/showroom_2.png"
];

// State variables
let products = [];
let scrollImages = [];

document.addEventListener('DOMContentLoaded', async () => {
    // Show loading state
    const tbody = document.getElementById('productTableBody');
    if (tbody) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); font-style: italic;"><i class="fa-solid fa-spinner fa-spin"></i> Loading data from Supabase Cloud...</td></tr>`;
    }

    // Initialize Data
    await initData();

    // Tab Navigation
    initTabs();

    // Dropdown populating
    populateImageDropdowns();

    // Setup forms & event listeners
    initProductForm();
    initScrollForm();
    initGlobalActions();

    // Initial renders
    renderProducts();
    renderScrollImages();
});

// Toast notification helper
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = 'fa-circle-check';
    if (type === 'error') icon = 'fa-circle-xmark';
    
    toast.innerHTML = `
        <i class="fa-solid ${icon}"></i>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    // Fade out and remove after 3 seconds
    setTimeout(() => {
        toast.classList.add('fade-out');
        toast.addEventListener('animationend', () => {
            toast.remove();
        });
    }, 3000);
}

// Fetch from Supabase (fallback to defaults if offline/empty)
async function initData() {
    let cloudData = await fetchSupabaseData();
    
    // Seed Supabase with defaults if empty
    if (cloudData && Object.keys(cloudData).length === 0) {
        showToast("Database is empty. Seeding default data to Supabase...", "info");
        await saveToSupabase('products', defaultProducts);
        await saveToSupabase('scroll_images', defaultScrollImages);
        cloudData = { products: defaultProducts, scroll_images: defaultScrollImages };
    }

    if (cloudData) {
        products = cloudData.products || [...defaultProducts];
        scrollImages = cloudData.scroll_images || [...defaultScrollImages];
    } else {
        products = [...defaultProducts];
        scrollImages = [...defaultScrollImages];
        showToast("Failed to load from Cloud database. Using defaults.", "error");
    }
}

// Tabs setup
function initTabs() {
    const navButtons = document.querySelectorAll('.nav-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const currentTabTitle = document.getElementById('currentTabTitle');
    const currentTabDesc = document.getElementById('currentTabDesc');

    const tabInfo = {
        products: {
            title: "Available Mobiles Manager",
            desc: "Add, edit, remove, and reorder products shown in the Available Mobiles section."
        },
        scroll: {
            title: "Scroll Images Manager",
            desc: "Add, remove, and reorder images shown in the showroom marquee scroll section."
        }
    };

    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.getAttribute('data-tab');

            // Toggle active menu button
            navButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            // Toggle active tab content
            tabContents.forEach(content => content.classList.remove('active'));
            document.getElementById(`tab-${tabName}`).classList.add('active');

            // Update titles
            currentTabTitle.textContent = tabInfo[tabName].title;
            currentTabDesc.textContent = tabInfo[tabName].desc;
        });
    });
}

// Populate Image Select elements
function populateImageDropdowns() {
    const prodImageSelect = document.getElementById('prodImage');
    const scrollImageSelect = document.getElementById('scrollImageSelect');

    let optionsHTML = '<option value="">-- Choose an Image --</option>';
    availableImages.forEach(img => {
        const displayName = img.replace('images/', '');
        optionsHTML += `<option value="${img}">${displayName}</option>`;
    });

    if (prodImageSelect) prodImageSelect.innerHTML = optionsHTML;
    if (scrollImageSelect) scrollImageSelect.innerHTML = optionsHTML;
}

// Product Form Logic
function initProductForm() {
    const form = document.getElementById('productForm');
    const brandSelect = document.getElementById('prodBrand');
    const customBrandGroup = document.getElementById('customBrandGroup');
    const customBrandInput = document.getElementById('prodBrandCustom');
    const imageSelect = document.getElementById('prodImage');
    const fileInput = document.getElementById('prodImageFile');
    const customImageInput = document.getElementById('prodImageCustom');
    const imagePreview = document.getElementById('productImagePreview');
    const editIndexInput = document.getElementById('editIndex');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    const saveProdBtn = document.getElementById('saveProdBtn');
    const formTitle = document.getElementById('formTitle');

    // Show/hide custom brand input
    brandSelect.addEventListener('change', () => {
        if (brandSelect.value === 'OTHER') {
            customBrandGroup.style.display = 'block';
            customBrandInput.setAttribute('required', 'true');
        } else {
            customBrandGroup.style.display = 'none';
            customBrandInput.removeAttribute('required');
        }
    });

    // Update image preview on selection change
    function updatePreview() {
        const customImgVal = customImageInput.value.trim();
        const selectedImgVal = imageSelect.value;

        if (fileInput && fileInput.files && fileInput.files[0]) {
            const file = fileInput.files[0];
            const localUrl = URL.createObjectURL(file);
            imagePreview.innerHTML = `<img src="${localUrl}" alt="Preview">`;
        } else if (customImgVal !== "") {
            // Because admin is inside a folder, we prefix '../' to the path to load from root level images folder
            const displayPath = customImgVal.startsWith('images/') ? '../' + customImgVal : customImgVal;
            imagePreview.innerHTML = `<img src="${displayPath}" alt="Preview" onerror="this.src='../images/logo.png';">`;
        } else if (selectedImgVal) {
            const displayPath = selectedImgVal.startsWith('images/') ? '../' + selectedImgVal : selectedImgVal;
            imagePreview.innerHTML = `<img src="${displayPath}" alt="Preview" onerror="this.src='../images/logo.png';">`;
        } else {
            imagePreview.innerHTML = '<div class="no-image">No Image Selected</div>';
        }
    }

    fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 0) {
            imageSelect.value = '';
            customImageInput.value = '';
        }
        updatePreview();
    });

    imageSelect.addEventListener('change', () => {
        customImageInput.value = '';
        fileInput.value = '';
        updatePreview();
    });

    customImageInput.addEventListener('input', () => {
        imageSelect.value = '';
        fileInput.value = '';
        updatePreview();
    });

    // Cancel edit
    cancelEditBtn.addEventListener('click', () => {
        resetProductForm();
    });

    // Submit form
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('prodName').value.trim();
        const price = document.getElementById('prodPrice').value.trim();
        const brand = brandSelect.value === 'OTHER' ? customBrandInput.value.trim() : brandSelect.value;
        const status = document.getElementById('prodStatus').value;
        const editIndex = parseInt(editIndexInput.value);

        const customImgVal = customImageInput.value.trim();
        const selectedImgVal = imageSelect.value;
        
        let image = "";

        if (fileInput && fileInput.files && fileInput.files[0]) {
            // Disable button and show uploading state
            saveProdBtn.disabled = true;
            saveProdBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Uploading Image...';
            
            const uploadedUrl = await uploadImageToSupabase(fileInput.files[0]);
            
            saveProdBtn.disabled = false;
            saveProdBtn.innerHTML = editIndex === -1 ? '<i class="fa-solid fa-plus"></i> Add Product' : '<i class="fa-solid fa-check"></i> Save Changes';
            
            if (!uploadedUrl) {
                return; // Upload failed, toast already shown by upload function
            }
            image = uploadedUrl;
        } else {
            image = customImgVal !== "" ? customImgVal : selectedImgVal;
        }

        if (!image) {
            showToast("Please select, upload, or enter a custom path for the image.", "error");
            return;
        }

        // Map status value to standard text
        let statusText = "In Stock";
        if (status === 'limited') statusText = "Limited";
        if (status === 'out-of-stock') statusText = "Out of Stock";

        const productData = { name, price, brand, status, statusText, image };

        if (editIndex === -1) {
            // Add new
            products.push(productData);
            showToast("Product added successfully!");
        } else {
            // Update
            products[editIndex] = productData;
            showToast("Product updated successfully!");
        }

        // Save & Render
        await saveProducts();
        renderProducts();
        resetProductForm();
    });
}

function resetProductForm() {
    const form = document.getElementById('productForm');
    form.reset();
    
    document.getElementById('editIndex').value = '-1';
    document.getElementById('customBrandGroup').style.display = 'none';
    document.getElementById('prodBrandCustom').removeAttribute('required');
    document.getElementById('productImagePreview').innerHTML = '<div class="no-image">No Image Selected</div>';
    document.getElementById('cancelEditBtn').style.display = 'none';
    
    const fileInput = document.getElementById('prodImageFile');
    if (fileInput) fileInput.value = '';
    
    const saveProdBtn = document.getElementById('saveProdBtn');
    saveProdBtn.innerHTML = '<i class="fa-solid fa-plus"></i> Add Product';
    document.getElementById('formTitle').textContent = "Add New Product";
}

// Scroll Marquee Form Logic
function initScrollForm() {
    const form = document.getElementById('scrollForm');
    const imageSelect = document.getElementById('scrollImageSelect');
    const fileInput = document.getElementById('scrollImageFile');
    const customImageInput = document.getElementById('scrollImageCustom');
    const imagePreview = document.getElementById('scrollImagePreview');
    const submitBtn = form.querySelector('button[type="submit"]');

    function updatePreview() {
        const customImgVal = customImageInput.value.trim();
        const selectedImgVal = imageSelect.value;

        if (fileInput && fileInput.files && fileInput.files[0]) {
            const file = fileInput.files[0];
            const localUrl = URL.createObjectURL(file);
            imagePreview.innerHTML = `<img src="${localUrl}" alt="Preview">`;
        } else if (customImgVal !== "") {
            const displayPath = customImgVal.startsWith('images/') ? '../' + customImgVal : customImgVal;
            imagePreview.innerHTML = `<img src="${displayPath}" alt="Preview" onerror="this.src='../images/logo.png';">`;
        } else if (selectedImgVal) {
            const displayPath = selectedImgVal.startsWith('images/') ? '../' + selectedImgVal : selectedImgVal;
            imagePreview.innerHTML = `<img src="${displayPath}" alt="Preview" onerror="this.src='../images/logo.png';">`;
        } else {
            imagePreview.innerHTML = '<div class="no-image">No Image Selected</div>';
        }
    }

    fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 0) {
            imageSelect.value = '';
            customImageInput.value = '';
        }
        updatePreview();
    });

    imageSelect.addEventListener('change', () => {
        customImageInput.value = '';
        fileInput.value = '';
        updatePreview();
    });

    customImageInput.addEventListener('input', () => {
        imageSelect.value = '';
        fileInput.value = '';
        updatePreview();
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const customImgVal = customImageInput.value.trim();
        const selectedImgVal = imageSelect.value;
        let image = "";

        if (fileInput && fileInput.files && fileInput.files[0]) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Uploading...';

            const uploadedUrl = await uploadImageToSupabase(fileInput.files[0]);

            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fa-solid fa-plus"></i> Add to Marquee';

            if (!uploadedUrl) {
                return;
            }
            image = uploadedUrl;
        } else {
            image = customImgVal !== "" ? customImgVal : selectedImgVal;
        }

        if (!image) {
            showToast("Please select, upload, or enter a custom path for the image.", "error");
            return;
        }

        // Add to scroll list
        scrollImages.push(image);
        await saveScrollImages();
        renderScrollImages();

        // Reset
        form.reset();
        fileInput.value = '';
        imagePreview.innerHTML = '<div class="no-image">No Image Selected</div>';
        showToast("Image added to marquee scroll!");
    });
}

// Global actions setup (Reset & View site)
function initGlobalActions() {
    const resetBtn = document.getElementById('resetBtn');

    resetBtn.addEventListener('click', async () => {
        if (confirm("Are you sure you want to reset all products and marquee images to their defaults? Any modifications will be lost.")) {
            products = [...defaultProducts];
            scrollImages = [...defaultScrollImages];
            
            showToast("Resetting cloud database...", "info");
            
            const pSuccess = await saveToSupabase('products', products);
            const sSuccess = await saveToSupabase('scroll_images', scrollImages);
            
            renderProducts();
            renderScrollImages();
            resetProductForm();
            
            if (pSuccess && sSuccess) {
                showToast("System reset to default data in the cloud.", "success");
            } else {
                showToast("Failed to reset cloud database.", "error");
            }
        }
    });
}

// Save helpers
async function saveProducts() {
    const success = await saveToSupabase('products', products);
    if (!success) {
        showToast("Failed to save to Supabase Cloud.", "error");
    }
}

async function saveScrollImages() {
    const success = await saveToSupabase('scroll_images', scrollImages);
    if (!success) {
        showToast("Failed to save to Supabase Cloud.", "error");
    }
}

// Render product list table
function renderProducts() {
    const tbody = document.getElementById('productTableBody');
    const productCountSpan = document.getElementById('productCount');
    
    if (!tbody) return;
    tbody.innerHTML = '';
    
    productCountSpan.textContent = `${products.length} Product${products.length === 1 ? '' : 's'}`;
    
    if (products.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); font-style: italic;">No products available. Add some in the left form!</td></tr>`;
        return;
    }

    products.forEach((prod, index) => {
        const tr = document.createElement('tr');
        
        // Setup image display path
        const displayPath = prod.image.startsWith('images/') ? '../' + prod.image : prod.image;
        
        tr.innerHTML = `
            <td>
                <div class="sort-btns">
                    <button class="btn-sort" onclick="moveProduct(${index}, -1)" title="Move Up"><i class="fa-solid fa-chevron-up"></i></button>
                    <button class="btn-sort" onclick="moveProduct(${index}, 1)" title="Move Down"><i class="fa-solid fa-chevron-down"></i></button>
                </div>
            </td>
            <td>
                <div class="table-img">
                    <img src="${displayPath}" alt="${prod.name}" onerror="this.src='../images/logo.png';">
                </div>
            </td>
            <td>
                <div class="table-prod-info">
                    <h4>${prod.name}</h4>
                    <span style="font-size: 11px; color: ${index >= 6 ? '#ff9800' : '#4caf50'}; font-weight: 600;">
                        ${index >= 6 ? '<i class="fa-solid fa-eye-slash"></i> Hidden (View All)' : '<i class="fa-solid fa-eye"></i> Visible Initially'}
                    </span>
                </div>
            </td>
            <td>
                <span class="badge" style="background: rgba(0, 210, 255, 0.05); color: var(--text-main); font-size: 11px; border: 1px solid var(--border-color);">${prod.brand}</span>
            </td>
            <td style="font-weight: 700; color: var(--primary);">${prod.price}</td>
            <td>
                <select class="row-status-select ${prod.status}" onchange="updateProductStatus(${index}, this.value, this)">
                    <option value="in-stock" ${prod.status === 'in-stock' ? 'selected' : ''}>In Stock</option>
                    <option value="limited" ${prod.status === 'limited' ? 'selected' : ''}>Limited</option>
                    <option value="out-of-stock" ${prod.status === 'out-of-stock' ? 'selected' : ''}>Out of Stock</option>
                </select>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-action btn-edit" onclick="editProduct(${index})" title="Edit Product">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="btn btn-action btn-delete" onclick="deleteProduct(${index})" title="Delete Product">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Render marquee scroll images grid
function renderScrollImages() {
    const grid = document.getElementById('scrollImagesGrid');
    const scrollCountSpan = document.getElementById('scrollCount');
    
    if (!grid) return;
    grid.innerHTML = '';
    
    scrollCountSpan.textContent = `${scrollImages.length} Image${scrollImages.length === 1 ? '' : 's'}`;

    if (scrollImages.length === 0) {
        grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); font-style: italic; padding: 40px 0;">No marquee images set. Select an image on the left!</div>`;
        return;
    }

    scrollImages.forEach((img, index) => {
        const card = document.createElement('div');
        card.className = 'scroll-image-card';
        
        const displayPath = img.startsWith('images/') ? '../' + img : img;
        const displayName = img.replace('images/', '');
        
        card.innerHTML = `
            <div class="image-wrapper">
                <img src="${displayPath}" alt="Scroll Image" onerror="this.src='../images/logo.png';">
            </div>
            <div class="card-actions">
                <span class="image-title" title="${displayName}">${displayName}</span>
                <div class="sort-arrows">
                    <button class="btn-arrow" onclick="moveScrollImage(${index}, -1)" title="Move Left"><i class="fa-solid fa-arrow-left"></i></button>
                    <button class="btn-arrow" onclick="moveScrollImage(${index}, 1)" title="Move Right"><i class="fa-solid fa-arrow-right"></i></button>
                </div>
                <button class="btn btn-action btn-delete" onclick="deleteScrollImage(${index})" title="Remove Image">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        `;
        grid.appendChild(card);
    });
}

// Product Edit/Delete/Sort Actions (global functions so onclick works)
window.editProduct = function(index) {
    const prod = products[index];
    
    document.getElementById('editIndex').value = index;
    document.getElementById('prodName').value = prod.name;
    document.getElementById('prodPrice').value = prod.price;
    document.getElementById('prodStatus').value = prod.status;

    // Handle brand selection
    const brandSelect = document.getElementById('prodBrand');
    const customBrandGroup = document.getElementById('customBrandGroup');
    const customBrandInput = document.getElementById('prodBrandCustom');

    // See if option exists in brand list
    let brandExists = false;
    for (let i = 0; i < brandSelect.options.length; i++) {
        if (brandSelect.options[i].value === prod.brand) {
            brandExists = true;
            break;
        }
    }

    if (brandExists) {
        brandSelect.value = prod.brand;
        customBrandGroup.style.display = 'none';
        customBrandInput.removeAttribute('required');
    } else {
        brandSelect.value = 'OTHER';
        customBrandGroup.style.display = 'block';
        customBrandInput.value = prod.brand;
        customBrandInput.setAttribute('required', 'true');
    }

    // Handle image selection
    const imageSelect = document.getElementById('prodImage');
    const customImageInput = document.getElementById('prodImageCustom');
    const fileInput = document.getElementById('prodImageFile');
    if (fileInput) fileInput.value = ''; // Clear file input on edit
    
    if (availableImages.includes(prod.image)) {
        imageSelect.value = prod.image;
        customImageInput.value = '';
    } else {
        imageSelect.value = '';
        customImageInput.value = prod.image;
    }

    // Trigger update preview
    const imagePreview = document.getElementById('productImagePreview');
    const displayPath = prod.image.startsWith('images/') ? '../' + prod.image : prod.image;
    imagePreview.innerHTML = `<img src="${displayPath}" alt="Preview" onerror="this.src='../images/logo.png';">`;

    // UI modifications for edit mode
    document.getElementById('cancelEditBtn').style.display = 'inline-flex';
    document.getElementById('saveProdBtn').innerHTML = '<i class="fa-solid fa-check"></i> Save Changes';
    document.getElementById('formTitle').textContent = "Edit Product Details";

    // Scroll form into view on mobile
    document.getElementById('productForm').scrollIntoView({ behavior: 'smooth' });
};

window.deleteProduct = function(index) {
    if (confirm(`Are you sure you want to delete "${products[index].name}"?`)) {
        const deletedName = products[index].name;
        products.splice(index, 1);
        saveProducts();
        renderProducts();
        
        // If we were editing the deleted product, reset the form
        const editIndex = parseInt(document.getElementById('editIndex').value);
        if (editIndex === index) {
            resetProductForm();
        } else if (editIndex > index) {
            // Shift index down by 1 since we deleted an item before it
            document.getElementById('editIndex').value = editIndex - 1;
        }

        showToast(`"${deletedName}" removed.`);
    }
};

window.moveProduct = function(index, direction) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= products.length) return;

    // Swap elements
    const temp = products[index];
    products[index] = products[targetIndex];
    products[targetIndex] = temp;

    saveProducts();
    renderProducts();
};

// Scroll image actions
window.deleteScrollImage = function(index) {
    if (confirm("Remove this image from scroll marquee?")) {
        scrollImages.splice(index, 1);
        saveScrollImages();
        renderScrollImages();
        showToast("Image removed from scroll.");
    }
};

window.moveScrollImage = function(index, direction) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= scrollImages.length) return;

    // Swap elements
    const temp = scrollImages[index];
    scrollImages[index] = scrollImages[targetIndex];
    scrollImages[targetIndex] = temp;

    saveScrollImages();
    renderScrollImages();
};

window.updateProductStatus = function(index, newStatus, selectElement) {
    if (index < 0 || index >= products.length) return;
    
    products[index].status = newStatus;
    
    let statusText = "In Stock";
    if (newStatus === 'limited') statusText = "Limited";
    if (newStatus === 'out-of-stock') statusText = "Out of Stock";
    products[index].statusText = statusText;
    
    saveProducts();
    
    // Dynamically update class for visual style update
    selectElement.className = `row-status-select ${newStatus}`;
    
    showToast(`"${products[index].name}" availability updated to "${statusText}".`);
};
