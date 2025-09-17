// PlantCare AI Application
class PlantCareAI {
    constructor() {
        this.chatWidget = document.getElementById('chatWidget');
        this.chatToggle = document.getElementById('chatToggle');
        this.chatClose = document.getElementById('chatClose');
        this.chatInput = document.getElementById('chatInput');
        this.chatSend = document.getElementById('chatSend');
        this.chatMessages = document.getElementById('chatMessages');
        this.quickReplies = document.querySelectorAll('.quick-reply');
        this.navToggle = document.getElementById('navToggle');
        this.navMenu = document.getElementById('navMenu');
        this.isTyping = false;
        this.isChatOpen = false;
        
        // Backend API URL - you can change this if your server runs on a different port
        this.apiUrl = 'http://127.0.0.1:5000/chat';
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.initAnimations();
        this.addTypingIndicator();
    }

    bindEvents() {
        // Chat functionality
        if (this.chatToggle) {
            this.chatToggle.addEventListener('click', () => this.toggleChat());
        }

        if (this.chatClose) {
            this.chatClose.addEventListener('click', () => this.closeChat());
        }

        if (this.chatSend) {
            this.chatSend.addEventListener('click', () => this.sendMessage());
        }

        if (this.chatInput) {
            this.chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });

            // Show typing indicator
            this.chatInput.addEventListener('input', () => {
                this.updateSendButton();
            });
        }

        // Quick reply buttons
        this.quickReplies.forEach(button => {
            button.addEventListener('click', () => {
                const message = button.getAttribute('data-message');
                this.handleQuickReply(message);
            });
        });

        // Navigation
        if (this.navToggle) {
            this.navToggle.addEventListener('click', () => this.toggleNav());
        }

        // Smooth scrolling for navigation links
        document.querySelectorAll('a[href^="#"]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(link.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                    this.closeNav();
                }
            });
        });

        // Close chat when clicking outside
        document.addEventListener('click', (e) => {
            if (this.isChatOpen && 
                !this.chatWidget.contains(e.target) && 
                !this.chatToggle.contains(e.target)) {
                this.closeChat();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isChatOpen) {
                this.closeChat();
            }
        });
    }

    toggleChat() {
        if (this.isChatOpen) {
            this.closeChat();
        } else {
            this.openChat();
        }
    }

    openChat() {
        this.chatWidget.classList.remove('hidden');
        setTimeout(() => {
            this.chatWidget.classList.add('open');
        }, 10);
        this.isChatOpen = true;
        this.chatToggle.style.transform = 'scale(0.9)';

        // Focus input
        setTimeout(() => {
            this.chatInput?.focus();
        }, 300);
    }

    closeChat() {
        this.chatWidget.classList.remove('open');
        setTimeout(() => {
            this.chatWidget.classList.add('hidden');
        }, 300);
        this.isChatOpen = false;
        this.chatToggle.style.transform = 'scale(1)';
    }

    toggleNav() {
        this.navMenu.classList.toggle('active');
    }

    closeNav() {
        this.navMenu.classList.remove('active');
    }

    sendMessage() {
        const message = this.chatInput.value.trim();
        if (!message || this.isTyping) return;

        this.addUserMessage(message);
        this.chatInput.value = '';
        this.updateSendButton();
        this.handleBotResponse(message);
    }

    handleQuickReply(message) {
        this.addUserMessage(message);
        this.handleBotResponse(message);

        // Hide quick replies after use
        document.querySelector('.chat-quick-replies').style.display = 'none';
        setTimeout(() => {
            document.querySelector('.chat-quick-replies').style.display = 'flex';
        }, 2000);
    }

    addUserMessage(message) {
        const messageEl = this.createMessageElement(message, 'user');
        this.chatMessages.appendChild(messageEl);
        this.scrollToBottom();
    }

    async handleBotResponse(userMessage) {
        this.showTypingIndicator();
        
        try {
            // Make API call to Flask backend
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: userMessage
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            this.hideTypingIndicator();
            const messageEl = this.createMessageElement(data.bot, 'bot');
            this.chatMessages.appendChild(messageEl);
            this.scrollToBottom();

        } catch (error) {
            console.error('Error calling backend:', error);
            this.hideTypingIndicator();
            
            // Fallback response if backend is unavailable
            const fallbackMessage = "I'm having trouble connecting to my plant database right now. Please make sure the backend server is running on http://127.0.0.1:5000. You can try asking about crops like 'list crops' or specific plants like 'tomato general information'.";
            const messageEl = this.createMessageElement(fallbackMessage, 'bot');
            this.chatMessages.appendChild(messageEl);
            this.scrollToBottom();
        }
    }

    createMessageElement(message, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;

        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        avatar.textContent = sender === 'user' ? '👤' : '🌱';

        const content = document.createElement('div');
        content.className = 'message-content';

        const text = document.createElement('div');
        text.className = 'message-text';
        text.textContent = message;

        const time = document.createElement('div');
        time.className = 'message-time';
        time.textContent = this.getCurrentTime();

        content.appendChild(text);
        content.appendChild(time);
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(content);

        // Add animation
        messageDiv.style.opacity = '0';
        messageDiv.style.transform = 'translateY(20px)';
        setTimeout(() => {
            messageDiv.style.transition = 'all 0.3s ease';
            messageDiv.style.opacity = '1';
            messageDiv.style.transform = 'translateY(0)';
        }, 10);

        return messageDiv;
    }

    addTypingIndicator() {
        this.typingIndicator = document.createElement('div');
        this.typingIndicator.className = 'message bot-message typing-indicator hidden';
        this.typingIndicator.innerHTML = `
            <div class="message-avatar">🌱</div>
            <div class="message-content">
                <div class="message-text">
                    <div class="typing-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>
            </div>
        `;

        // Add CSS for typing animation
        const style = document.createElement('style');
        style.textContent = `
            .typing-dots {
                display: flex;
                gap: 4px;
                padding: 8px 0;
            }
            .typing-dots span {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: var(--color-text-secondary);
                animation: typing 1.4s infinite ease-in-out;
            }
            .typing-dots span:nth-child(1) { animation-delay: -0.32s; }
            .typing-dots span:nth-child(2) { animation-delay: -0.16s; }
            .typing-dots span:nth-child(3) { animation-delay: 0s; }
            @keyframes typing {
                0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
                40% { transform: scale(1); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }

    showTypingIndicator() {
        this.isTyping = true;
        this.typingIndicator.classList.remove('hidden');
        this.chatMessages.appendChild(this.typingIndicator);
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        this.isTyping = false;
        if (this.chatMessages.contains(this.typingIndicator)) {
            this.chatMessages.removeChild(this.typingIndicator);
        }
    }

    updateSendButton() {
        const hasText = this.chatInput.value.trim().length > 0;
        this.chatSend.style.opacity = hasText ? '1' : '0.6';
        this.chatSend.style.transform = hasText ? 'scale(1)' : 'scale(0.95)';
    }

    scrollToBottom() {
        setTimeout(() => {
            this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
        }, 100);
    }

    getCurrentTime() {
        const now = new Date();
        return now.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    }

    initAnimations() {
        // Intersection Observer for animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, observerOptions);

        // Observe elements for animation
        document.querySelectorAll('.feature-card, .stat-item, .info-card').forEach(el => {
            observer.observe(el);
        });

        // Stats counter animation
        this.animateStats();
    }

    animateStats() {
        const statNumbers = document.querySelectorAll('.stat-number');
        const statsObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !entry.target.classList.contains('animated')) {
                    this.animateNumber(entry.target);
                    entry.target.classList.add('animated');
                }
            });
        }, { threshold: 0.5 });

        statNumbers.forEach(stat => {
            statsObserver.observe(stat);
        });
    }

    animateNumber(element) {
        const text = element.textContent;
        const hasPlus = text.includes('+');
        const hasL = text.includes('L');
        const hasPercent = text.includes('%');
        const isDecimal = text.includes('.');
        let finalNumber = parseFloat(text);

        if (isNaN(finalNumber)) return;

        let currentNumber = 0;
        const increment = finalNumber / 50;
        const duration = 2000;
        const stepTime = duration / 50;

        const counter = setInterval(() => {
            currentNumber += increment;
            if (currentNumber >= finalNumber) {
                element.textContent = text;
                clearInterval(counter);
            } else {
                let displayValue = currentNumber;
                if (isDecimal) {
                    displayValue = currentNumber.toFixed(1);
                } else {
                    displayValue = Math.floor(currentNumber);
                }

                let displayText = displayValue.toString();
                if (hasPlus) displayText += '+';
                if (hasL) displayText += 'L';
                if (hasPercent) displayText += '%';

                element.textContent = displayText;
            }
        }, stepTime);
    }
}

// Enhanced UI interactions
class UIEnhancements {
    constructor() {
        this.initScrollEffects();
        this.initHoverEffects();
        this.initNotifications();
    }

    initScrollEffects() {
        let lastScrollTop = 0;
        const header = document.querySelector('.header');

        window.addEventListener('scroll', () => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

            if (scrollTop > lastScrollTop && scrollTop > 100) {
                // Scrolling down
                header.style.transform = 'translateY(-100%)';
            } else {
                // Scrolling up
                header.style.transform = 'translateY(0)';
            }

            lastScrollTop = scrollTop;
        });
    }

    initHoverEffects() {
        // Enhanced button hover effects
        document.querySelectorAll('.btn').forEach(btn => {
            btn.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-2px)';
            });

            btn.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0)';
            });
        });

        // Feature card hover effects
        document.querySelectorAll('.feature-card').forEach(card => {
            card.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-8px) scale(1.02)';
            });

            card.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0) scale(1)';
            });
        });
    }

    initNotifications() {
        // Show welcome notification
        setTimeout(() => {
            this.showNotification('🌱 Welcome to PlantCare AI! Your garden monitoring system is online.', 'success');
        }, 2000);
    }

    showNotification(message, type = 'info', duration = 4000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;

        // Styling
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '16px 20px',
            background: type === 'success' ? '#4CAF50' : '#333',
            color: 'white',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '500',
            maxWidth: '400px',
            zIndex: '10000',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s ease'
        });

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Remove after duration
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, duration);
    }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    try {
        // Initialize main application
        window.plantCareAI = new PlantCareAI();
        
        // Initialize UI enhancements
        new UIEnhancements();
        
        console.log('🌱 PlantCare AI application initialized successfully');
    } catch (error) {
        console.error('Error initializing PlantCare AI:', error);
    }
});

// Handle resize events
window.addEventListener('resize', () => {
    // Close mobile nav on resize
    const navMenu = document.getElementById('navMenu');
    if (navMenu) {
        navMenu.classList.remove('active');
    }
});

// Add some global utilities
window.PlantCareUtils = {
    formatTime: (date) => {
        return date.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    },

    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    smoothScrollTo: (element) => {
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
};