// Scroll Reveal Animation
const observerOptions = {
    threshold: 0.1
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('reveal');
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

document.addEventListener('DOMContentLoaded', () => {
    // Add reveal class to sections
    const sections = document.querySelectorAll('section');
    sections.forEach(section => {
        section.style.opacity = "0";
        section.style.transform = "translateY(20px)";
        section.style.transition = "all 0.6s ease-out";
        observer.observe(section);
    });

    // Handle reveal animation logic in JS instead of CSS for simplicity in this demo
    window.addEventListener('scroll', () => {
        sections.forEach(section => {
            const sectionTop = section.getBoundingClientRect().top;
            if (sectionTop < window.innerHeight - 100) {
                section.style.opacity = "1";
                section.style.transform = "translateY(0)";
            }
        });
    });

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
    const viewAllBtn = document.getElementById('viewAllBtn');
    const productList = document.getElementById('productList');
    
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
                // Scroll back to product list top if needed
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
    const marqueeContent = document.querySelector('.marquee-content');
    if (marqueeContent) {
        const originalItems = Array.from(marqueeContent.children);
        if (originalItems.length > 0) {
            const initMarquee = () => {
                // Measure sizes while currently rendered items are in DOM
                const firstChild = marqueeContent.querySelector('.photo-item');
                const itemWidth = (firstChild && firstChild.getBoundingClientRect().width) || 320;
                const gap = parseFloat(window.getComputedStyle(marqueeContent).gap) || 20;
                const singleItemSpace = itemWidth + gap;
                const screenWidth = window.innerWidth;
                
                // Clear container
                marqueeContent.innerHTML = '';
                
                // Calculate minimum items needed to exceed screen width
                const minItemsNeeded = Math.ceil(screenWidth / singleItemSpace) + 1;
                const repeatCount = Math.ceil(minItemsNeeded / originalItems.length);
                
                // Create base sequence of cloned items
                const baseSet = [];
                for (let i = 0; i < repeatCount; i++) {
                    originalItems.forEach(item => {
                        baseSet.push(item.cloneNode(true));
                    });
                }
                
                // Append base set
                baseSet.forEach(item => {
                    marqueeContent.appendChild(item);
                });
                
                // Append duplicate set for seamless looping
                baseSet.forEach(item => {
                    marqueeContent.appendChild(item.cloneNode(true));
                });
            };
            
            initMarquee();
            
            // Re-initialize marquee on window resize (debounced)
            let resizeTimeout;
            window.addEventListener('resize', () => {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(initMarquee, 250);
            });
        }
    }
});
