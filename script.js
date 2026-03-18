document.addEventListener('DOMContentLoaded', () => {
  // Mobile Navigation Toggle
  const hamburger = document.querySelector('.hamburger');
  const navLinks = document.querySelector('.nav-links');
  const links = document.querySelectorAll('.nav-links li a');
  const overlay = document.getElementById('nav-overlay');

  function openNav() {
    navLinks.classList.add('nav-active');
    hamburger.classList.add('toggle');
    if (overlay) overlay.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent background scroll
  }

  function closeNav() {
    navLinks.classList.remove('nav-active');
    hamburger.classList.remove('toggle');
    if (overlay) overlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  hamburger.addEventListener('click', () => {
    if (navLinks.classList.contains('nav-active')) {
      closeNav();
    } else {
      openNav();
    }
  });

  // Close when clicking a nav link
  links.forEach(link => {
    link.addEventListener('click', closeNav);
  });

  // Close when clicking the overlay (outside the menu)
  if (overlay) {
    overlay.addEventListener('click', closeNav);
  }

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeNav();
  });

  // Sticky Navbar Update on scroll
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  // Scroll Reveal Animation (Intersection Observer)
  const reveals = document.querySelectorAll('.reveal, .reveal-right');
  
  const revealOptions = {
    threshold: 0.15,
    rootMargin: "0px 0px -50px 0px"
  };

  const revealOnScroll = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) {
        return;
      } else {
        entry.target.classList.add('active');
        observer.unobserve(entry.target); // Optional: stop observing once revealed
      }
    });
  }, revealOptions);

  reveals.forEach(reveal => {
    revealOnScroll.observe(reveal);
  });

  // Highlight Active Nav Link on Scroll
  const sections = document.querySelectorAll('section');
  
  window.addEventListener('scroll', () => {
    let current = '';
    
    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.clientHeight;
      
      if (scrollY >= (sectionTop - 200)) {
        current = section.getAttribute('id');
      }
    });

    links.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === `#${current}`) {
        link.classList.add('active');
      }
    });
  });

  // Category Filtering for Products
  const tabBtns = document.querySelectorAll('.tab-btn');
  const productCards = document.querySelectorAll('.product-card');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Remove active class from all tabs
      tabBtns.forEach(t => t.classList.remove('active'));
      // Add active to clicked tab
      btn.classList.add('active');
      
      const targetCategory = btn.getAttribute('data-target');
      
      productCards.forEach(card => {
        // Reset animation before showing
        card.style.display = 'none';
        
        if (targetCategory === 'all' || card.getAttribute('data-category') === targetCategory) {
          // Small delay for smooth re-rendering if needed, else just display flex
          card.style.display = 'flex';
          card.classList.add('reveal', 'active'); // Re-trigger reveal classes
        }
      });
    });
  });
});
