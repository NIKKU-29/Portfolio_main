class SpaceMonsterGame {
  constructor(container) {
    this.container = container;
    this.elements = {
      score: document.getElementById('score'),
      playButton: document.getElementById('play-button'),
      timer: document.getElementById('timer'),
      overlay: null,
      gameWindow: null
    };
    this.state = {
      score: 0,
      timeLeft: 20,
      isPlaying: false,
      activeMonsters: new Set(),
      frameId: null
    };
    this.intervals = {
      timer: null
    };
    this.lastTime = 0;
    this.spawnAccumulator = 0;

    // Pre-create elements for reuse
    this.createGameElements();

    // Bind methods to avoid recreating functions
    this.boundDestroyMonster = this.destroyMonster.bind(this);
    this.boundGameLoop = this.gameLoop.bind(this);

    // Initial setup: hide timer, show play button, etc.
    this.elements.timer.style.display = 'none';
    this.elements.playButton.addEventListener('click', () => this.openGameWindow());
  }

  createGameElements() {
    // Create overlay
    this.elements.overlay = document.createElement('div');
    this.elements.overlay.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: none; justify-content: center; align-items: center;
      z-index: 1000001;
    `;

    // Create game window
    this.elements.gameWindow = document.createElement('div');
    this.elements.gameWindow.style.cssText = `
      width: 80vw; height: 80vh; background: #101010;
      position: relative; border-radius: 10px;
      box-shadow: 0 0 20px rgba(0,0,0,0.5);
      cursor: default; overflow: hidden;
      z-index: 1000001;
    `;

    // Create close button
    const closeButton = document.createElement('button');
    closeButton.textContent = '×';
    closeButton.style.cssText = `
      position: absolute; top: 0.2vw; right: 0.2vw;
      background: none; border: none; color: white;
      font-size: 2.2vw; cursor: pointer;
      z-index: 1000002;
    `;
    closeButton.addEventListener('click', () => this.closeGameWindow());

    // Append elements
    this.elements.gameWindow.appendChild(closeButton);
    this.elements.overlay.appendChild(this.elements.gameWindow);
    document.body.appendChild(this.elements.overlay);
  }

  openGameWindow() {
    // Remove any lingering modal before starting a new game
    const existingModal = this.elements.gameWindow.querySelector('.game-over-modal');
    if (existingModal) existingModal.remove();

    this.elements.overlay.style.display = 'flex';
    this.startGame();
  }

  closeGameWindow() {
    // End game without showing modal (pass false)
    this.endGame(false);
    this.elements.overlay.style.display = 'none';

    // Move score and timer back to the original container
    this.container.appendChild(this.elements.score);
    this.container.appendChild(this.elements.timer);

    // Hide score and timer; show play button
    this.elements.score.style.display = 'none';
    this.elements.timer.style.display = 'none';
    this.elements.playButton.style.display = 'block';

    // Fully reset game state
    this.resetGame();
  }

  startGame() {
    if (this.state.isPlaying) return;

    this.state.isPlaying = true;
    this.state.score = 0;
    this.state.timeLeft = 20;

    // Hide play button, show score & timer in the game window
    this.elements.playButton.style.display = 'none';
    this.elements.score.style.display = 'block';
    this.elements.timer.style.display = 'block';

    // Ensure score and timer are inside gameWindow
    if (!this.elements.gameWindow.contains(this.elements.score)) {
      this.elements.gameWindow.appendChild(this.elements.score);
    }
    if (!this.elements.gameWindow.contains(this.elements.timer)) {
      this.elements.gameWindow.appendChild(this.elements.timer);
    }

    this.elements.score.textContent = `Score: ${this.state.score}`;
    this.elements.timer.textContent = `Time Left: ${this.state.timeLeft}s`;

    this.startTimer();
    this.lastTime = performance.now();
    this.state.frameId = requestAnimationFrame(this.boundGameLoop);
  }

  gameLoop(timestamp) {
    if (!this.state.isPlaying) return;
    
    const deltaTime = timestamp - this.lastTime;
    this.lastTime = timestamp;
    
    // Accumulate time to spawn monsters every 1 second
    this.spawnAccumulator += deltaTime;
    if (this.spawnAccumulator >= 1000) {
      this.spawnMonsters();
      this.spawnAccumulator -= 1000;
    }
    
    // Continue game loop
    this.state.frameId = requestAnimationFrame(this.boundGameLoop);
  }

  startTimer() {
    this.state.timeLeft = 20;
    this.elements.timer.textContent = `Time Left: ${this.state.timeLeft}s`;
    
    clearInterval(this.intervals.timer);
    this.intervals.timer = setInterval(() => {
      this.state.timeLeft--;
      this.elements.timer.textContent = `Time Left: ${this.state.timeLeft}s`;
      if (this.state.timeLeft <= 0) {
        this.endGame(); // default shows modal
      }
    }, 1000);
  }

  spawnMonsters() {
    const fragment = document.createDocumentFragment();
    const count = Math.floor(Math.random() * 3) + 1;
    const rect = this.elements.gameWindow.getBoundingClientRect();

    for (let i = 0; i < count; i++) {
      const monster = document.createElement('div');
      monster.classList.add('monster');
      
      // Use transform for positioning (better performance than left/top)
      const x = Math.random() * (rect.width - 50);
      const y = Math.random() * (rect.height - 50);
      monster.style.transform = `translate(${x}px, ${y}px)`;
      monster.style.position = 'absolute';
      monster.style.willChange = 'transform';
      
      monster.addEventListener('click', this.boundDestroyMonster);
      fragment.appendChild(monster);

      this.state.activeMonsters.add(monster);
      // Remove monster after 3 seconds if not clicked
      setTimeout(() => {
        if (monster.parentElement) {
          monster.remove();
          this.state.activeMonsters.delete(monster);
        }
      }, 3000);
    }

    this.elements.gameWindow.appendChild(fragment);
  }

  destroyMonster(e) {
    const monster = e.target;
    if (!this.state.activeMonsters.has(monster)) return;

    const explosion = document.createElement('div');
    explosion.classList.add('explosion');
    
    // Extract transform values for accurate explosion positioning
    const computedStyle = window.getComputedStyle(monster).transform;
    let x = 0, y = 0;
    if (computedStyle && computedStyle !== 'none') {
      const matrixValues = computedStyle.match(/matrix.*\((.+)\)/)[1].split(', ');
      x = parseFloat(matrixValues[4]);
      y = parseFloat(matrixValues[5]);
    }
    
    explosion.style.transform = `translate(${x - 25}px, ${y - 25}px)`;
    explosion.style.position = 'absolute';
    explosion.style.willChange = 'opacity';
    
    this.elements.gameWindow.appendChild(explosion);

    monster.remove();
    this.state.activeMonsters.delete(monster);
    this.incrementScore();

    // Animate explosion and remove after finish
    explosion.animate(
      [
        { opacity: 1, transform: `translate(${x - 25}px, ${y - 25}px) scale(0.8)` },
        { opacity: 0, transform: `translate(${x - 25}px, ${y - 25}px) scale(1.2)` }
      ],
      { duration: 500, easing: 'ease-out' }
    ).onfinish = () => explosion.remove();
  }

  incrementScore() {
    this.state.score++;
    this.elements.score.textContent = `Score: ${this.state.score}`;
  }

  /**
   * Ends the game.
   * @param {boolean} [showModal=true] - If true, display the Game Over modal.
   */
  endGame(showModal = true) {
    if (!this.state.isPlaying) return;

    this.state.isPlaying = false;
    clearInterval(this.intervals.timer);
    if (this.state.frameId) {
      cancelAnimationFrame(this.state.frameId);
      this.state.frameId = null;
    }

    // Remove any remaining monsters
    this.state.activeMonsters.forEach(monster => monster.remove());
    this.state.activeMonsters.clear();

    if (showModal) {
      this.showGameOverModal();
    }
  }
  
  showGameOverModal() {
    const modal = document.createElement('div');
    modal.classList.add('game-over-modal');
    modal.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.9);
      padding: 2rem;
      border-radius: 10px;
      text-align: center;
      color: white;
      z-index: 1000002;
    `;
    
    const title = document.createElement('h2');
    title.textContent = 'Game Over!';
    
    const scoreText = document.createElement('p');
    scoreText.textContent = `Final Score: ${this.state.score}`;
    
    const button = document.createElement('button');
    button.textContent = 'Play Again';
    button.style.cssText = `
      background: #fa0e45;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      margin-top: 1rem;
      border-radius: 5px;
      cursor: pointer;
    `;
    
    button.addEventListener('click', () => {
      modal.remove();
      this.resetGame();
      this.startGame();
    });
    
    modal.appendChild(title);
    modal.appendChild(scoreText);
    modal.appendChild(button);
    
    this.elements.gameWindow.appendChild(modal);
  }

  resetGame() {
    // Remove existing modal if any
    const existingModal = this.elements.gameWindow.querySelector('.game-over-modal');
    if (existingModal) existingModal.remove();
    
    this.state.score = 0;
    this.state.timeLeft = 20;
    this.elements.score.textContent = `Score: ${this.state.score}`;
    this.elements.timer.textContent = `Time Left: ${this.state.timeLeft}s`;
    
    // Hide score and timer; show play button
    this.elements.score.style.display = 'none';
    this.elements.timer.style.display = 'none';
    this.elements.playButton.style.display = 'block';
  }
}


// Optimize cursor handling with RAF instead of throttling
class CursorManager {
  constructor() {
    this.cursor = document.createElement('div');
    this.cursor.classList.add('cursor');
    document.body.appendChild(this.cursor);

    this.boundMouseMove = this.throttle(this.handleMouseMove.bind(this), 16);
    this.boundMouseOver = this.handleMouseOver.bind(this);
    this.boundMouseOut = this.handleMouseOut.bind(this);

    this.setupEventListeners();
  }

  throttle(func, limit) {
    let inThrottle;
    return function (...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  handleMouseMove(e) {
    if (e.target.closest('.navbar')) {
      this.cursor.style.display = 'none';
      return;
    }

    this.cursor.style.display = 'block';
    this.cursor.style.position = 'fixed';
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
      this.cursor.classList.add('link-hover');
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
      this.cursor.classList.remove('link-hover');
    }
  }
  setupEventListeners() {
    document.addEventListener('mousemove', this.boundMouseMove);
    document.addEventListener('mouseover', this.boundMouseOver);
    document.addEventListener('mouseout', this.boundMouseOut);
  }
}



// Optimize particle system for performance
const MIN_PARTICLES = 15; // Increased from 10
const MAX_PARTICLES_DESKTOP = 60; // Increased from 40
const MAX_PARTICLES_MOBILE = 30; // Increased from 25
const MOBILE_BREAKPOINT = 768;

function getParticleCount() {
  const isMobile = window.innerWidth < MOBILE_BREAKPOINT;
  const maxParticles = isMobile ? MAX_PARTICLES_MOBILE : MAX_PARTICLES_DESKTOP;
  return Math.max(MIN_PARTICLES, Math.min(Math.floor(window.innerWidth / (isMobile ? 45 : 25)), maxParticles));
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
        value: isHighPerformance ? getParticleCount() : Math.floor(getParticleCount() / 1.5), // Increased density
        density: { enable: false} 
      },
      color: { value: "#fa0e45" },
      shape: { type: "circle", stroke: { width: 2, color: "#fa0e45" } },
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
        distance: window.innerWidth < MOBILE_BREAKPOINT ? 100 : 150, // Increased distance
        color: "#fa0e45", 
        opacity: 0.2,
        width: window.innerWidth < MOBILE_BREAKPOINT ? 1 : 2
      },
      move: { 
        enable: true, 
        speed: window.innerWidth < MOBILE_BREAKPOINT ? 1.5 : 2.5,
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
          count: 2 // Increased from 0
        },
        resize: true
      },
      modes: { 
        repulse: { 
          distance: window.innerWidth < MOBILE_BREAKPOINT ? 100 : 180, // Increased distance
          duration: 0.2
        },
        push: {
          particles_nb: 2 // Increased from 1
        }
      },
    },
    retina_detect: false
  });
}

// Use a more efficient resize handler with debounce
let resizeTimeout;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    initParticles();
  }, 500);
}, { passive: true });

// Lazy load GSAP animations
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
          y: 30, // Reduced distance
          scale: 0.95, // Less extreme scale
          rotateX: 5, // Less extreme rotation
          filter: "blur(5px)" // Less extreme blur
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          rotateX: 0,
          filter: "blur(0px)",
          duration: 0.8, // Faster animation
          ease: "power2.out", // Simpler easing
          delay: index * 0.1, // Shorter delay
          scrollTrigger: {
            trigger: card,
            start: "top 85%", 
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

// Initialize everything with proper timing
document.addEventListener("DOMContentLoaded", () => {
  // Initialize base functionality first
  const gameContainer = document.getElementById("game-container");
  if (gameContainer) {
    new SpaceMonsterGame(gameContainer);
    new CursorManager();
  }
  
  // Initialize smooth scroll
  document.querySelectorAll('.navbar__link').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const targetId = this.getAttribute('href').substring(1);
      const targetElement = document.getElementById(targetId);

      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
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
      }).catch(error => console.error("❌ Error!", error));
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
        transition: opacity 0.3s ease;
        transform: translateZ(0);
        font-family: 'nin';
      `;
      document.body.appendChild(feedbackMsg);

      requestAnimationFrame(() => {
        feedbackMsg.style.opacity = "1";
        setTimeout(() => {
          feedbackMsg.style.opacity = "0";
          setTimeout(() => {
            feedbackMsg.remove();
          }, 300);
        }, 2000);
      });

      document.getElementById("name").focus();
    });
  }
  
  // Initialize experience cards animation
  const cards = document.querySelectorAll(".experience-card");
  if (cards.length > 0) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.style.opacity = "1";
            entry.target.style.transform = "translateY(0)";
          }, index * 150); // Faster animation
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    
    cards.forEach(card => observer.observe(card));
  }
  
  // Delay particle initialization for better page load performance
  setTimeout(() => {
    initParticles();
  }, 500);
  
  // Delay GSAP initialization
  setTimeout(() => {
    initGSAPAnimations();
  }, 1000);
});

// // Add CSS to optimize the cursor
// document.addEventListener("DOMContentLoaded", () => {
//   const style = document.createElement('style');
//   style.textContent = `
//     .cursor {
//       pointer-events: none;
//       will-change: transform;
//       transform: translate3d(0, 0, 0);
//     }
//     .monster {
//       will-change: transform;
//       transform: translate3d(0, 0, 0);
//     }
//     .explosion {
//       will-change: transform, opacity;
//       transform: translate3d(0, 0, 0);
//     }
//   `;
//   document.head.appendChild(style);
// });

// Add ability to disable particle effects for low-end devices
document.addEventListener("DOMContentLoaded", () => {
  // Check if we're on a low-performance device
  const isLowPerformance = 
    window.navigator.hardwareConcurrency <= 2 || 
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  if (isLowPerformance) {
    // Create a toggle button for particles
    const toggleBtn = document.createElement('button');
    toggleBtn.textContent = 'Disable Effects';
    toggleBtn.style.cssText = `
      position: fixed;
      bottom: 1vw;
      right: 1vw;
      background-color: #fa0e40;
      color: white;
      border: none;
      padding: 0.5vw 0.9vw;
      border-radius: 5px;
      font-size: 0.8vw;
      z-index: 9999;
      font-family: 'nin';
      cursor: pointer;
    `;
    
    let effectsEnabled = true;
    
    toggleBtn.addEventListener('click', () => {
      effectsEnabled = !effectsEnabled;
      
      if (effectsEnabled) {
        initParticles();
        toggleBtn.textContent = 'Disable Effects';
      } else {
        destroyParticles();
        toggleBtn.textContent = 'Enable Effects';
      }
    });
    
    document.body.appendChild(toggleBtn);
  }
});

 document.addEventListener("DOMContentLoaded", function() {
      const scrollContainer = document.getElementById('scrollContainer');
      const scrollInner = document.getElementById('scrollInner');
      const techRows = document.querySelectorAll('.tech-row');
      
      // Clone the items to ensure continuous scroll
      const originalHeight = scrollInner.offsetHeight;
      
      // Create clones
      techRows.forEach(row => {
        const clone = row.cloneNode(true);
        scrollInner.appendChild(clone);
      });
      
      // Initialize
      let scrollPos = 0;
      let animationId = null;
      let isPaused = false;
      
      // Set the scroll speed (pixels per frame)
      const getScrollSpeed = () => {
        // Responsive speed based on viewport width
        return window.innerWidth * 0.0006;
      };
      
      let speed = getScrollSpeed();
      
      // Update speed on window resize
      window.addEventListener('resize', () => {
        speed = getScrollSpeed();
      });
      
      // Pause on hover
      scrollContainer.addEventListener('mouseenter', () => {
        isPaused = true;
      });
      
      scrollContainer.addEventListener('mouseleave', () => {
        isPaused = false;
      });
      
      // Individual tech items also pause scroll
      techRows.forEach(row => {
        row.addEventListener('mouseenter', () => {
          isPaused = true;
        });
        
        row.addEventListener('mouseleave', () => {
          isPaused = false;
        });
      });
      
      // Smooth animation function using CSS transforms
      function animate() {
        if (!isPaused) {
          scrollPos -= speed;
          
          // Reset position when a full cycle is complete
          if (scrollPos <= -originalHeight) {
            scrollPos = 0;
          }
          
          // Apply transform with translateY for smoother animation
          scrollInner.style.transform = `translateY(${scrollPos}px)`;
        }
        
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
    });

  const resumeLink = document.getElementById("resume-link");
  if (resumeLink) {
      resumeLink.addEventListener("click", function(event) {
          event.preventDefault(); // Prevent immediate download

          const link = this;
          setTimeout(() => {
              window.location.href = link.href; // Trigger download after 2 seconds
          }, 2000); // Changed to 2 seconds to match the comment
      });
  }