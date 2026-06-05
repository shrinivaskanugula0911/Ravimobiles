

// Default site data if localStorage is empty
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

document.addEventListener('DOMContentLoaded', () => {
    // 1. Fetch & Initialize Data from LocalStorage
    let products = JSON.parse(localStorage.getItem('ravi_mobiles_products'));
    if (!products) {
        products = defaultProducts;
        localStorage.setItem('ravi_mobiles_products', JSON.stringify(products));
    }

    let scrollImages = JSON.parse(localStorage.getItem('ravi_mobiles_scroll_images'));
    if (!scrollImages) {
        scrollImages = defaultScrollImages;
        localStorage.setItem('ravi_mobiles_scroll_images', JSON.stringify(scrollImages));
    }

    // 2. Render Products
    const productList = document.getElementById('productList');
    const viewAllBtn = document.getElementById('viewAllBtn');

    if (productList) {
        productList.innerHTML = '';
        products.forEach((product, index) => {
            const card = document.createElement('div');
            card.className = `product-card${index >= 6 ? ' hidden' : ''}`;
            
            let statusIcon = 'fa-circle-check';
            if (product.status === 'limited') {
                statusIcon = 'fa-circle-exclamation';
            } else if (product.status === 'out-of-stock') {
                statusIcon = 'fa-circle-xmark';
            }

            card.innerHTML = `
                <div class="product-image">
                    <img src="${product.image}" alt="${product.name}">
                </div>
                <div class="product-details">
                    <div class="product-top">
                        <h3>${product.name}</h3>
                        <div class="stock-status ${product.status}">
                            <i class="fa-solid ${statusIcon}"></i> ${product.statusText || (product.status === 'in-stock' ? 'In Stock' : product.status === 'limited' ? 'Limited' : 'Out of Stock')}
                        </div>
                    </div>
                    <div class="price">${product.price}</div>
                    <div class="product-footer">
                        <div class="brand">
                            <span>${product.brand}</span>
                        </div>
                    </div>
                </div>
            `;
            productList.appendChild(card);
        });

        // Toggle button visibility based on product count
        if (viewAllBtn) {
            if (products.length <= 6) {
                viewAllBtn.style.display = 'none';
            } else {
                viewAllBtn.style.display = 'block';
                viewAllBtn.textContent = 'View All Products';
            }
        }
    }

    // 3. Render Scroll Images
    const marqueeContent = document.querySelector('.marquee-content');
    if (marqueeContent) {
        marqueeContent.innerHTML = '';
        scrollImages.forEach((imgSrc, index) => {
            const item = document.createElement('div');
            item.className = 'photo-item';
            item.innerHTML = `<img src="${imgSrc}" alt="Showroom ${index + 1}">`;
            marqueeContent.appendChild(item);
        });
    }



    // Smooth scroll for anchors
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // View All Products Toggle
    if (viewAllBtn && productList) {
        viewAllBtn.addEventListener('click', () => {
            const hiddenProducts = productList.querySelectorAll('.product-card.hidden');
            if (hiddenProducts.length > 0) {
                hiddenProducts.forEach(product => {
                    product.classList.remove('hidden');
                    product.style.opacity = "0";
                    product.style.transform = "translateY(20px)";
                    setTimeout(() => {
                        product.style.transition = "all 0.5s ease-out";
                        product.style.opacity = "1";
                        product.style.transform = "translateY(0)";
                    }, 50);
                });
                viewAllBtn.textContent = "Show Less";
            } else {
                const allProducts = productList.querySelectorAll('.product-card');
                allProducts.forEach((product, index) => {
                    if (index >= 6) {
                        product.classList.add('hidden');
                    }
                });
                viewAllBtn.textContent = "View All Products";
                document.getElementById('productList').scrollIntoView({ behavior: 'smooth' });
            }
        });
    }

    // Floating button animation
    const fab = document.querySelector('.fab-call');
    if (fab) {
        setInterval(() => {
            fab.style.transform = "scale(1.1)";
            setTimeout(() => {
                fab.style.transform = "scale(1)";
            }, 300);
        }, 3000);
    }

    // Infinite Marquee Scroll
    if (marqueeContent) {
        const originalItems = Array.from(marqueeContent.children);
        if (originalItems.length > 0) {
            const initMarquee = () => {
                const firstChild = marqueeContent.querySelector('.photo-item');
                const itemWidth = (firstChild && firstChild.getBoundingClientRect().width) || 320;
                const gap = parseFloat(window.getComputedStyle(marqueeContent).gap) || 20;
                const singleItemSpace = itemWidth + gap;
                const screenWidth = window.innerWidth;
                
                marqueeContent.innerHTML = '';
                
                const minItemsNeeded = Math.ceil(screenWidth / singleItemSpace) + 1;
                const repeatCount = Math.ceil(minItemsNeeded / originalItems.length);
                
                const baseSet = [];
                for (let i = 0; i < repeatCount; i++) {
                    originalItems.forEach(item => {
                        baseSet.push(item.cloneNode(true));
                    });
                }
                
                baseSet.forEach(item => {
                    marqueeContent.appendChild(item);
                });
                
                baseSet.forEach(item => {
                    marqueeContent.appendChild(item.cloneNode(true));
                });
            };
            
            initMarquee();
            
            let resizeTimeout;
            window.addEventListener('resize', () => {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(initMarquee, 250);
            });
        }
    }
});
