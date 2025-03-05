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
      activeMonsters: new Set()
    };
    this.intervals = {
      spawn: null,
      timer: null
    };

    // Pre-create elements for reuse
    this.createGameElements();

    // Bind methods to avoid recreating functions
    this.boundDestroyMonster = this.destroyMonster.bind(this);

    // Initial setup
    this.elements.timer.style.display = 'none';
    this.elements.playButton.addEventListener('click', () => this.openGameWindow());
  }

  createGameElements() {
    // Create overlay
    this.elements.overlay = document.createElement('div');
    this.elements.overlay.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0, 0, 0, 0.8); z-index: 1000;
      display: none; justify-content: center; align-items: center;
      z-index: 1000001;
    `;

    // Create game window
    this.elements.gameWindow = document.createElement('div');
    this.elements.gameWindow.style.cssText = `
      width: 80vw; height: 80vh; background: #101010;
      position: relative; border-radius: 10px;
      box-shadow: 0 0 20px rgba(0,0,0,0.5);
      z-index: 1000001;
      cursor: default;
    `;

    // Create close button
    const closeButton = document.createElement('button');
    closeButton.textContent = '×';
    closeButton.style.cssText = `
      position: absolute; top: 0.2vw; right: 0.2vw;
      background: none; border: none; color: white;
      font-size: 2.2vw; cursor: pointer; z-index: 1000001;
    `;
    closeButton.addEventListener('click', () => this.closeGameWindow());

    // Append elements
    this.elements.gameWindow.appendChild(closeButton);
    this.elements.overlay.appendChild(this.elements.gameWindow);
    document.body.appendChild(this.elements.overlay);
  }

  openGameWindow() {
    this.elements.overlay.style.display = 'flex';
    this.startGame();
  }

  closeGameWindow() {
    this.endGame();
    this.elements.overlay.style.display = 'none';
    this.container.append(this.elements.score, this.elements.timer);
  }

  startGame() {
    if (this.state.isPlaying) return;

    this.state.isPlaying = true;
    this.elements.playButton.style.display = 'none';
    this.elements.score.style.display = 'block';
    this.elements.timer.style.display = 'block';
    this.elements.gameWindow.appendChild(this.elements.score);
    this.elements.gameWindow.appendChild(this.elements.timer);

    this.startTimer();
    this.intervals.spawn = setInterval(() => this.spawnMonsters(), 1000);
  }

  startTimer() {
    this.intervals.timer = setInterval(() => {
      this.state.timeLeft--;
      this.elements.timer.textContent = `Time Left: ${this.state.timeLeft}s`;
      if (this.state.timeLeft <= 0) {
        this.endGame();
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
      monster.style.left = `${Math.random() * (rect.width - 50)}px`;
      monster.style.top = `${Math.random() * (rect.height - 50)}px`;
      monster.addEventListener('click', this.boundDestroyMonster);
      fragment.appendChild(monster);

      this.state.activeMonsters.add(monster);
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
    explosion.style.left = `${monster.offsetLeft - 25}px`;
    explosion.style.top = `${monster.offsetTop - 25}px`;
    this.elements.gameWindow.appendChild(explosion);

    monster.remove();
    this.state.activeMonsters.delete(monster);
    this.incrementScore();

    setTimeout(() => explosion.remove(), 500);
  }

  incrementScore() {
    this.state.score++;
    this.elements.score.textContent = `Score: ${this.state.score}`;
  }

  endGame() {
    if (!this.state.isPlaying) return;

    this.state.isPlaying = false;
    clearInterval(this.intervals.spawn);
    clearInterval(this.intervals.timer);

    // Clean up remaining monsters
    this.state.activeMonsters.forEach(monster => monster.remove());
    this.state.activeMonsters.clear();

    alert(`Game Over! Final Score: ${this.state.score}`);
    this.resetGame();
  }

  resetGame() {
    this.state.score = 0;
    this.state.timeLeft = 20;
    this.elements.score.textContent = `Score: ${this.state.score}`;
    this.elements.timer.textContent = `Time Left: 20s`;
    this.elements.score.style.display = 'none';
    this.elements.timer.style.display = 'none';
    this.elements.playButton.style.display = 'block';
  }
}

// Optimize cursor handling with throttling and a single instance
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

// Initialize
const gameContainer = document.getElementById('game-container');
if (gameContainer) {
  new SpaceMonsterGame(gameContainer);
  new CursorManager();
}
const MIN_PARTICLES = 5;
const MAX_PARTICLES_DESKTOP = 50;
const MAX_PARTICLES_MOBILE = 30;
const MOBILE_BREAKPOINT = 768;
const PARTICLE_DECAY_DELAY = 2000; // Time in ms before particles start disappearing

function getParticleCount() {
  const isMobile = window.innerWidth < MOBILE_BREAKPOINT;
  const maxParticles = isMobile ? MAX_PARTICLES_MOBILE : MAX_PARTICLES_DESKTOP;
  return Math.max(MIN_PARTICLES, Math.min(Math.floor(window.innerWidth / (isMobile ? 30 : 15)), maxParticles));
}

function destroyParticles() {
  if (window.pJSDom && window.pJSDom.length) {
    window.pJSDom.forEach(particle => particle.pJS && particle.pJS.fn.vendors.destroypJS());
    window.pJSDom = [];
  }
}

function initParticles() {
  destroyParticles(); // Destroy existing instance before creating a new one

  particlesJS("particles-js", {
    particles: {
      number: { 
        value: getParticleCount(), 
        density: { enable: false} 
      },
      color: { value: "#fa0e45" },
      shape: { type: "circle", stroke: { width: 5, color: "#fa0e45" } },
      opacity: { 
        value: 0.5, 
        random: false,
        anim: {
          enable: true,
          speed: 1,
          opacity_min: 0,
          sync: false
        }
      },
      size: { value: 1, random: true },
      line_linked: { 
        enable: true, 
        distance: window.innerWidth < MOBILE_BREAKPOINT ? 100 : 150,
        color: "#fa0e45", 
        opacity: 0.4, 
        width: window.innerWidth < MOBILE_BREAKPOINT ? 2 : 4 
      },
      move: { 
        enable: true, 
        speed: window.innerWidth < MOBILE_BREAKPOINT ? 3 : 5,
        direction: "none" 
      }
    },
    interactivity: {
      detect_on: "canvas",
      events: { 
        onhover: { enable: true, mode: "repulse" }, 
        onclick: { 
          enable: true, 
          mode: "push",
          count: 0 // Limit particles created per click
        } 
      },
      modes: { 
        repulse: { 
          distance: window.innerWidth < MOBILE_BREAKPOINT ? 100 : 200,
          duration: 0.4 
        },
        push: {
          particles_nb: 1
        }
      },
    },
  });
}

// Reinitialize particles on window resize
window.addEventListener("resize", () => {
  clearTimeout(window.particleResizeTimeout);
  window.particleResizeTimeout = setTimeout(initParticles, 500); // Debounce to avoid excessive calls
});

// Initialize particles on page load
document.addEventListener("DOMContentLoaded", initParticles);


// Initialize
document.addEventListener("DOMContentLoaded", () => {
  const gameContainer = document.getElementById("game-container");
  if (gameContainer) {
    new CursorManager();
    initParticles();
  }
});



document.addEventListener("DOMContentLoaded", function () {
  gsap.registerPlugin(ScrollTrigger);

  gsap.utils.toArray(".project-card").forEach((card, index) => {
    gsap.fromTo(
      card,
      {
        opacity: 0,
        y: 50,
        scale: 0.85,
        rotateX: 15,
        filter: "blur(15px)",
      },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        rotateX: 0,
        filter: "blur(0px)",
        duration: 1.5,
        ease: "power4.out", // Changed to power4 for smoother end
        delay: index * 0.15,
        scrollTrigger: {
          trigger: card,
          start: "top 85%",
          end: "top 60%", // Added end point
          toggleActions: "play none none none",
          scrub: 0.5, // Added smooth scrubbing
        },
      }
    );
  });
});


document.addEventListener("DOMContentLoaded", function () {
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
});

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
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.style.cssText = `
      color: #dc3545;
      font-size: 0.8rem;
      margin-top: 0;
      margin-bottom: 10px;
      opacity: 0;
      transform: translateY(-10px);
      transition: all 0.3s ease-in-out;
  `;
  // Trigger the animation after a small delay
  setTimeout(() => {
      errorDiv.style.opacity = '1';
      errorDiv.style.marginTop = '5px';
      errorDiv.style.transform = 'translateY(0)';
  }, 10);
  errorDiv.textContent = message;
  field.parentNode.insertBefore(errorDiv, field.nextSibling);
  field.style.borderColor = '#dc3545';

  field.addEventListener('input', function() {
      this.style.borderColor = '';
      const error = this.parentNode.querySelector('.error-message');
      if (error) {
          error.remove();
      }
  });
}

document.getElementById("send").addEventListener("click", function(e) {
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

document.getElementById("cancel").addEventListener("click", function() {
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
  `;
  document.body.appendChild(feedbackMsg);

  setTimeout(() => {
      feedbackMsg.style.opacity = "1";
      setTimeout(() => {
          feedbackMsg.style.opacity = "0";
          setTimeout(() => {
              feedbackMsg.remove();
          }, 300);
      }, 2000);
  }, 0);

  document.getElementById("name").focus();
});


document.addEventListener("DOMContentLoaded", function() {
  const cards = document.querySelectorAll(".experience-card");
  cards.forEach((card, index) => {
      setTimeout(() => {
          card.style.opacity = "1";
          card.style.transform = "translateY(0)";
      }, index * 300);
  });
});
