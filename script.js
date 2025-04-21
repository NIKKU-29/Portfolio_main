class CursorManager {
  constructor() {
    this.cursor = document.createElement('div');
    this.cursor.classList.add('cursor');
    document.body.appendChild(this.cursor);

    // Improved cursor styles with better performance hints
    this.cursor.style.cssText = `
      position: fixed;
      pointer-events: none;
      width: 15px;
      height: 15px;
      background: #fa0e45;
      border-radius: 50%;
      transform: translate(-50%, -50%);
      z-index: 999999999;
      transition: transform 0.15s cubic-bezier(0.25, 0.1, 0.25, 1), opacity 0.15s ease;
      will-change: transform, opacity;
      backface-visibility: hidden;
      -webkit-backface-visibility: hidden;
    `;

    this.boundMouseMove = this.throttle(this.handleMouseMove.bind(this), 8); // Increased responsiveness
    this.boundMouseOver = this.handleMouseOver.bind(this);
    this.boundMouseOut = this.handleMouseOut.bind(this);

    this.setupEventListeners();
  }

  throttle(func, limit) {
    let lastFunc;
    let lastRan;
    return function (...args) {
      if (!lastRan) {
        func.apply(this, args);
        lastRan = Date.now();
      } else {
        clearTimeout(lastFunc);
        lastFunc = setTimeout(() => {
          if ((Date.now() - lastRan) >= limit) {
            func.apply(this, args);
            lastRan = Date.now();
          }
        }, limit - (Date.now() - lastRan));
      }
    };
  }

  handleMouseMove(e) {
    if (e.target.closest('.navbar')) {
      this.cursor.style.opacity = '0';
      return;
    }

    this.cursor.style.opacity = '1';
    this.cursor.style.left = `${e.clientX}px`;
    this.cursor.style.top = `${e.clientY}px`;
  }

  handleMouseOver(e) {
    if (e.target.closest('.navbar')) return;

    if (
      e.target.closest('a') ||
      e.target.closest('button') ||
      e.target.closest('.language-btn') ||
      e.target.tagName === 'I' ||
      e.target.tagName === 'SPAN'
    ) {
      this.cursor.style.transform = 'translate(-50%, -50%) scale(1.5)';
      this.cursor.style.mixBlendMode = 'difference';
    }
  }

  handleMouseOut(e) {
    if (e.target.closest('.navbar')) return;

    if (
      e.target.closest('a') ||
      e.target.closest('button') ||
      e.target.closest('.language-btn') ||
      e.target.tagName === 'I' ||
      e.target.tagName === 'SPAN'
    ) {
      this.cursor.style.transform = 'translate(-50%, -50%) scale(1)';
      this.cursor.style.mixBlendMode = 'normal';
    }
  }

  setupEventListeners() {
    document.addEventListener('mousemove', this.boundMouseMove, { passive: true });
    document.addEventListener('mouseover', this.boundMouseOver, { passive: true });
    document.addEventListener('mouseout', this.boundMouseOut, { passive: true });
  }
}

// Optimize particle system for performance
const MIN_PARTICLES = 12; // Reduced from 15 for performance
const MAX_PARTICLES_DESKTOP = 50; // Reduced from 60 for performance
const MAX_PARTICLES_MOBILE = 25; // Reduced from 30 for performance
const MOBILE_BREAKPOINT = 768;

function getParticleCount() {
  const isMobile = window.innerWidth < MOBILE_BREAKPOINT;
  const maxParticles = isMobile ? MAX_PARTICLES_MOBILE : MAX_PARTICLES_DESKTOP;
  return Math.max(MIN_PARTICLES, Math.min(Math.floor(window.innerWidth / (isMobile ? 45 : 30)), maxParticles));
}

function destroyParticles() {
  if (window.pJSDom && window.pJSDom.length) {
    window.pJSDom.forEach(particle => particle.pJS && particle.pJS.fn.vendors.destroypJS());
    window.pJSDom = [];
  }
}

function initParticles() {
  destroyParticles(); // Destroy existing instance before creating a new one
  
  // Check if we're on a high-performance device
  const isHighPerformance = window.navigator.hardwareConcurrency > 4;
  
  particlesJS("particles-js", {
    particles: {
      number: { 
        value: isHighPerformance ? getParticleCount() : Math.floor(getParticleCount() / 1.5),
        density: { enable: false} 
      },
      color: { value: "#fa0e45" },
      shape: { type: "circle", stroke: { width: 1, color: "#fa0e45" } }, // Reduced stroke width for better performance
      opacity: { 
        value: 0.3,
        random: false,
        anim: {
          enable: true,
          speed: 0.5,
          opacity_min: 0,
          sync: false
        }
      },
      size: { value: 1, random: true },
      line_linked: { 
        enable: true, 
        distance: window.innerWidth < MOBILE_BREAKPOINT ? 100 : 150,
        color: "#fa0e45", 
        opacity: 0.2,
        width: window.innerWidth < MOBILE_BREAKPOINT ? 1 : 1.5 // Reduced for better performance
      },
      move: { 
        enable: true, 
        speed: window.innerWidth < MOBILE_BREAKPOINT ? 1.5 : 2,
        direction: "none",
        out_mode: "out"
      }
    },
    interactivity: {
      detect_on: "canvas",
      events: { 
        onhover: { enable: isHighPerformance, mode: "repulse" },
        onclick: { 
          enable: isHighPerformance, 
          mode: "push",
          count: 2
        },
        resize: true
      },
      modes: { 
        repulse: { 
          distance: window.innerWidth < MOBILE_BREAKPOINT ? 100 : 180,
          duration: 0.2
        },
        push: {
          particles_nb: 2
        }
      },
    },
    retina_detect: false // Keeping this disabled for performance
  });
}

// Better optimized resize handler
let resizeTimeout;
window.addEventListener("resize", () => {
  if (resizeTimeout) cancelAnimationFrame(resizeTimeout);
  resizeTimeout = requestAnimationFrame(() => {
    initParticles();
    adjustSidebarOrientation(); // Fix sidebar orientation on resize
  });
}, { passive: true });

// Fix sidebar orientation issues
function adjustSidebarOrientation() {
  const sidebar = document.querySelector('.navbar') || document.querySelector('.sidebar');
  if (sidebar) {
    // Force reflow to fix orientation issues
    sidebar.style.transform = 'translateZ(0)';
    sidebar.style.willChange = 'transform';
    
    // Reset any potential scroll issues
    const resetSidebarLayout = () => {
      sidebar.style.willChange = 'auto';
    };
    
    setTimeout(resetSidebarLayout, 100);
  }
}

// Lazy load GSAP animations with better performance
function initGSAPAnimations() {
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    // Wait and try again if GSAP isn't loaded yet
    setTimeout(initGSAPAnimations, 100);
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  const projectCards = document.querySelectorAll(".project-card");
  // Only initialize animations if elements exist
  if (projectCards.length > 0) {
    // Use batch for better performance
    gsap.utils.toArray(".project-card").forEach((card, index) => {
      gsap.fromTo(
        card,
        {
          opacity: 0,
          y: 20, // Further reduced distance for smoother animation
          scale: 0.98, // Less extreme scale for smoother animation
          rotateX: 3, // Less extreme rotation
          filter: "blur(3px)" // Less extreme blur
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          rotateX: 0,
          filter: "blur(0px)",
          duration: 0.6, // Faster animation
          ease: "power1.out", // Smoother easing
          delay: index * 0.05, // Shorter delay between cards
          scrollTrigger: {
            trigger: card,
            start: "top 95%",
            toggleActions: "play none none none",
          },
        }
      );
    });
  }
}

// Optimize form validation
function validateForm() {
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const contact = document.getElementById("contact").value.trim();
  const message = document.getElementById("message").value.trim();

  const existingErrors = document.querySelectorAll('.error-message');
  existingErrors.forEach(error => error.remove());

  let isValid = true;
  
  if (!name) {
    showError("name", "Name is required");
    isValid = false;
  }

  if (!email) {
    showError("email", "Email is required");
    isValid = false;
  } else if (!isValidEmail(email)) {
    showError("email", "Please enter a valid email");
    isValid = false;
  }

  if (!contact) {
    showError("contact", "Contact number is required");
    isValid = false;
  }

  if (!message) {
    showError("message", "Message is required");
    isValid = false;
  }

  return isValid;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showError(fieldId, message) {
  const field = document.getElementById(fieldId);
  if (!field) return;
  
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.textContent = message;
  
  // Apply styles directly instead of CSS transitions
  errorDiv.style.cssText = `
    color: #dc3545;
    font-size: 0.8rem;
    margin-top: 5px;
    margin-bottom: 10px;
    opacity: 0;
  `;
  
  field.parentNode.insertBefore(errorDiv, field.nextSibling);
  field.style.borderColor = '#dc3545';
  
  // Use requestAnimationFrame for smoother animation
  requestAnimationFrame(() => {
    errorDiv.style.opacity = '1';
    errorDiv.style.transition = 'opacity 0.3s ease';
  });
  
  // Use a single event listener for better performance
  if (!field.hasErrorListener) {
    field.addEventListener('input', function() {
      this.style.borderColor = '';
      const error = this.parentNode.querySelector('.error-message');
      if (error) {
        error.remove();
      }
    });
    field.hasErrorListener = true;
  }
}

// Add overlay loader animation with enhanced smoothness
document.addEventListener("DOMContentLoaded", () => {
  // Create overlay elements
  const overlay = document.createElement('div');
  overlay.classList.add('loader-overlay');
  
  const loaderContent = document.createElement('div');
  loaderContent.classList.add('loader-content');
  
  const loaderText = document.createElement('div');
  loaderText.classList.add('loader-text');
  
  // Add elements to DOM
  loaderContent.appendChild(loaderText);
  overlay.appendChild(loaderContent);
  document.body.appendChild(overlay);
  
  // Prevent scrolling while loader is active
  document.body.style.overflow = 'hidden';
  
  // Add CSS for the loader with enhanced animations
  const style = document.createElement('style');
  style.textContent = `
    .loader-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: #121212;
      z-index: 9999999;
      display: flex;
      justify-content: center;
      align-items: center;
      transform: translateY(0);
      transition: transform 0.8s cubic-bezier(0.7, 0, 0.3, 1);
      will-change: transform;
    }
    
    .loader-content {
      text-align: center;
      color: #fff;
      font-family: 'nin', sans-serif;
      transform: translateZ(0);
    }
    
    .loader-text {
      font-size: 2.5rem;
      font-weight: bold;
      background: linear-gradient(90deg, #fff, #fa0e45, #fff);
      background-size: 200% auto;
      background-clip: text;
      -webkit-background-clip: text;
      color: transparent;
      animation: shine 3s linear infinite;
      will-change: opacity, transform;
      transition: opacity 0.3s cubic-bezier(0.25, 0.1, 0.25, 1), transform 0.3s cubic-bezier(0.25, 0.1, 0.25, 1);
    }
    
    @keyframes shine {
      to {
        background-position: 200% center;
      }
    }
    
    @media (max-width: 768px) {
      .loader-text {
        font-size: 1.8rem;
      }
    }
  `;
  document.head.appendChild(style);
  
  // Words to display in sequence
  const words = ["Create", "Develop", "Experience", "Build", "Debug", "Solve", "Deliver"];
  let currentIndex = 0;
  
  // Initial text
  loaderText.textContent = words[currentIndex];
  
  // Animate text change with enhanced smoothness
  const textInterval = setInterval(() => {
    currentIndex = (currentIndex + 1) % words.length;
    
    // Fade out and move up current text
    loaderText.style.opacity = '0';
    loaderText.style.transform = 'translateY(-15px)';
    
    // Fade in and move up new text after a short delay
    setTimeout(() => {
      loaderText.textContent = words[currentIndex];
      loaderText.style.transform = 'translateY(0)';
      loaderText.style.opacity = '1';
    }, 300);
    
  }, 600); // Show each word for 600ms
  
  // Remove the loader after 3 seconds
  setTimeout(() => {
    clearInterval(textInterval);
    
    // Slide up animation
    overlay.style.transform = 'translateY(-100%)';
    
    // Re-enable scrolling
    setTimeout(() => {
      document.body.style.overflow = '';
      // Remove the loader elements when animation completes
      setTimeout(() => {
        overlay.remove();
        // Fix sidebar orientation after loader is removed
        adjustSidebarOrientation();
      }, 800);
    }, 800);
    
  }, 3000);
});

// Initialize everything with proper timing
document.addEventListener("DOMContentLoaded", () => {
  // Delay initialization to allow loader to show first
  setTimeout(() => {
    // Initialize base functionality first
    new CursorManager();
    
    // Initialize smooth scroll with enhanced behavior
    document.querySelectorAll('.navbar__link').forEach(anchor => {
      const span = anchor.querySelector('span');
      
      anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href').substring(1);
        const targetElement = document.getElementById(targetId);

        if (targetElement) {
          // Smoother scrolling with enhanced easing
          const startPosition = window.pageYOffset;
          const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset;
          const distance = targetPosition - startPosition;
          const duration = 800;
          let start = null;
          
          // Custom easing function for smoother scrolling
          function easeInOutQuad(t) {
            return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
          }
          
          function step(timestamp) {
            if (!start) start = timestamp;
            const progress = timestamp - start;
            const percentage = Math.min(progress / duration, 1);
            const easedPercentage = easeInOutQuad(percentage);
            
            window.scrollTo(0, startPosition + distance * easedPercentage);
            
            if (progress < duration) {
              window.requestAnimationFrame(step);
            }
          }
          
          window.requestAnimationFrame(step);
        }
      });

      // Enhanced hover effects
      anchor.addEventListener('mouseenter', () => {
        if (span) {
          span.style.opacity = '1';
          span.style.transform = 'translateY(0)';
          span.style.pointerEvents = 'auto';
        }
      });

      anchor.addEventListener('mouseleave', () => {
        if (span) {
          span.style.opacity = '0';
          span.style.transform = 'translateY(5px)';
          span.style.pointerEvents = 'none';
        }
      });
    });
    
    // Initialize form event listeners
    const sendButton = document.getElementById("send");
    if (sendButton) {
      sendButton.addEventListener("click", function(e) {
        e.preventDefault();

        if (!validateForm()) {
          return;
        }

        // Add loading animation to button
        this.innerHTML = '<span class="loading-spinner"></span> Sending...';
        this.disabled = true;
        
        // Add spinner style
        const spinnerStyle = document.createElement('style');
        spinnerStyle.textContent = `
          .loading-spinner {
            display: inline-block;
            width: 15px;
            height: 15px;
            margin-right: 8px;
            border: 2px solid rgba(255,255,255,0.3);
            border-radius: 50%;
            border-top-color: #fff;
            animation: spin 0.8s linear infinite;
            vertical-align: middle;
          }
          
          @keyframes spin {
            to {transform: rotate(360deg);}
          }
        `;
        document.head.appendChild(spinnerStyle);

        let formData = new FormData();

        formData.append("entry.998938801", document.getElementById("name").value.trim());
        formData.append("entry.1842017898", document.getElementById("email").value.trim());
        formData.append("entry.643032720", document.getElementById("contact").value.trim());
        formData.append("entry.1515541772", document.getElementById("message").value.trim());

        fetch("https://docs.google.com/forms/u/0/d/e/1FAIpQLSdJs9aRajaxhoKkOX6QAbV8m9_Qcbx_OfcU_Q7TfRxGUQS0FQ/formResponse", {
          method: "POST",
          mode: "no-cors",
          body: formData
        }).then(() => {
          window.location.href = "thankyou.html";
        }).catch(error => {
          console.error("❌ Error!", error);
          this.innerHTML = 'Send';
          this.disabled = false;
        });
      });
    }
    
    const cancelButton = document.getElementById("cancel");
    if (cancelButton) {
      cancelButton.addEventListener("click", function() {
        document.getElementById("name").value = "";
        document.getElementById("email").value = "";
        document.getElementById("contact").value = "";
        document.getElementById("message").value = "";

        const errorMessages = document.querySelectorAll('.error-message');
        errorMessages.forEach(error => error.remove());
        
        const formFields = document.querySelectorAll('input, textarea');
        formFields.forEach(field => field.style.borderColor = '');

        const feedbackMsg = document.createElement("div");
        feedbackMsg.textContent = "Form has been reset";
        feedbackMsg.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background-color: #fa0e40;
          color: white;
          padding: 10px 20px;
          border-radius: 5px;
          opacity: 0;
          transition: opacity 0.3s cubic-bezier(0.25, 0.1, 0.25, 1), transform 0.3s cubic-bezier(0.25, 0.1, 0.25, 1);
          transform: translateZ(0) translateX(20px);
          font-family: 'nin';
          box-shadow: 0 2px 10px rgba(250, 14, 64, 0.3);
        `;
        document.body.appendChild(feedbackMsg);

        requestAnimationFrame(() => {
          feedbackMsg.style.opacity = "1";
          feedbackMsg.style.transform = "translateZ(0) translateX(0)";
          setTimeout(() => {
            feedbackMsg.style.opacity = "0";
            feedbackMsg.style.transform = "translateZ(0) translateX(20px)";
            setTimeout(() => {
              feedbackMsg.remove();
            }, 300);
          }, 2000);
        });

        document.getElementById("name").focus();
      });
    }
    
    // Enhanced experience cards animation with smoother transitions
    const cards = document.querySelectorAll(".experience-card");
    if (cards.length > 0) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              entry.target.style.opacity = "1";
              entry.target.style.transform = "translateY(0) scale(1)";
              entry.target.style.filter = "blur(0)";
            }, index * 120); // Faster, smoother animation
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15, rootMargin: "0px 0px -10% 0px" });
      
      // Set initial state for cards
      cards.forEach(card => {
        card.style.opacity = "0";
        card.style.transform = "translateY(20px) scale(0.98)";
        card.style.filter = "blur(2px)";
        card.style.transition = "opacity 0.6s cubic-bezier(0.25, 0.1, 0.25, 1), transform 0.6s cubic-bezier(0.25, 0.1, 0.25, 1), filter 0.6s cubic-bezier(0.25, 0.1, 0.25, 1)";
        card.style.willChange = "opacity, transform, filter";
        observer.observe(card);
      });
    }
    
    // Enhance scroll container with better performance
    enhanceScrollContainer();
    
    // Delay particle initialization for better page load performance
    setTimeout(() => {
      initParticles();
    }, 500);
    
    // Delay GSAP initialization
    setTimeout(() => {
      initGSAPAnimations();
    }, 1000);
    
    // Fix sidebar orientation after everything is loaded
    setTimeout(() => {
      adjustSidebarOrientation();
    }, 3500);
    
  }, 3100); // Start initialization after loader animation is complete
});

// Enhance scroll container with better performance
function enhanceScrollContainer() {
  const scrollContainer = document.getElementById('scrollContainer');
  if (!scrollContainer) return;
  
  const scrollInner = document.getElementById('scrollInner');
  if (!scrollInner) return;
  
  const techRows = document.querySelectorAll('.tech-row');
  if (!techRows.length) return;
  
  // Clone the items to ensure continuous scroll
  const originalHeight = scrollInner.offsetHeight;
  
  // Create clones with better performance
  techRows.forEach(row => {
    const clone = row.cloneNode(true);
    // Apply GPU acceleration
    clone.style.transform = "translateZ(0)";
    scrollInner.appendChild(clone);
  });
  
  // Initialize with better performance
  let scrollPos = 0;
  let animationId = null;
  let isPaused = false;
  
  // Set the scroll speed (pixels per frame)
  const getScrollSpeed = () => {
    // Responsive speed based on viewport width
    return window.innerWidth * 0.0005; // Slightly reduced for smoother animation
  };
  
  let speed = getScrollSpeed();
  
  // Update speed on window resize with debounce
  let resizeScrollTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeScrollTimeout);
    resizeScrollTimeout = setTimeout(() => {
      speed = getScrollSpeed();
    }, 200);
  }, { passive: true });
  
  // Improve pause on hover - adds subtle slowdown instead of complete stop
  scrollContainer.addEventListener('mouseenter', () => {
    isPaused = true;
  }, { passive: true });
  
  scrollContainer.addEventListener('mouseleave', () => {
    isPaused = false;
  }, { passive: true });
  
  // Individual tech items also affect scroll speed
  techRows.forEach(row => {
    row.addEventListener('mouseenter', () => {
      isPaused = true;
    }, { passive: true });
    
    row.addEventListener('mouseleave', () => {
      isPaused = false;
    }, { passive: true });
  });
  
  // Smooth animation function using requestAnimationFrame
  function animate() {
    if (!isPaused) {
      scrollPos -= speed;
    } else {
      // Slow down rather than completely stop for smoother UX
      scrollPos -= speed * 0.1;
    }
    
    // Reset position when a full cycle is complete
    if (scrollPos <= -originalHeight) {
      // Instead of instant reset, add small offset for smoothness
      scrollPos = -5;
    }
    
    // Apply transform with hardware acceleration
    scrollInner.style.transform = `translate3d(0, ${scrollPos}px, 0)`;
    
    animationId = requestAnimationFrame(animate);
  }
  
  // Start the animation
  animate();
  
  // Clean up on page unload
  window.addEventListener('beforeunload', () => {
    if (animationId) {
      cancelAnimationFrame(animationId);
    }
  });
}

// Enhance resume link behavior with visual feedback
document.addEventListener("DOMContentLoaded", () => {
  const resumeLink = document.getElementById("resume-link");
  if (resumeLink) {
    resumeLink.addEventListener("click", function(event) {
      event.preventDefault(); // Prevent immediate download
      
      // Add visual feedback while waiting
      const feedbackText = document.createElement('div');
      feedbackText.textContent = "Preparing resume...";
      feedbackText.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background-color: #fa0e40;
        color: white;
        padding: 12px 24px;
        border-radius: 5px;
        font-family: 'nin', sans-serif;
        font-size: 14px;
        opacity: 0;
        transition: opacity 0.3s cubic-bezier(0.25, 0.1, 0.25, 1);
        z-index: 9999;
        box-shadow: 0 2px 10px rgba(250, 14, 64, 0.3);
      `;
      document.body.appendChild(feedbackText);
      
      requestAnimationFrame(() => {
        feedbackText.style.opacity = "1";
      });
      
      // Progress bar animation
      const progressBar = document.createElement('div');
      progressBar.style.cssText = `
        height: 3px;
        width: 0%;
        background-color: white;
        position: absolute;
        bottom: 0;
        left: 0;
        transition: width 2s cubic-bezier(0.25, 0.1, 0.25, 1);
      `;
      feedbackText.appendChild(progressBar);
      
      setTimeout(() => {
        progressBar.style.width = "100%";
      }, 50);

      const link = this;
      setTimeout(() => {
        window.location.href = link.href; // Trigger download after 2 seconds
        
        // Change message and fade out
        feedbackText.textContent = "Download started!";
        progressBar.remove();
        
        setTimeout(() => {
          feedbackText.style.opacity = "0";
          setTimeout(() => {
            feedbackText.remove();
          }, 300);
        }, 1000);
      }, 2000);
    });
  }
});
