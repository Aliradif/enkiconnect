// 🏺 EnkiConnect - Gift Matching Algorithm Demo
// Interactive demonstration of AI-powered gift matching

let currentStep = 0;
let totalSteps = 4;
let demoInterval = null;

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('🏺 Gift Matching Algorithm Demo initialized');
});

async function startMatchingDemo() {
    console.log('🚀 Starting matching algorithm demo...');
    
    // Hide hero and show process
    document.querySelector('.matching-hero').style.display = 'none';
    document.getElementById('matchingProcess').style.display = 'block';
    
    // Reset progress
    currentStep = 0;
    updateProgress(0);
    resetSteps();
    
    // Start the demo process
    await runMatchingAlgorithm();
}

async function runMatchingAlgorithm() {
    const steps = [
        {
            id: 'step1',
            title: 'Analyzing User Data',
            duration: 2000,
            details: [
                'Processing 1,247 user profiles...',
                'Analyzing budget ranges: $20-$500',
                'Mapping cultural preferences',
                'Calculating geographic compatibility'
            ]
        },
        {
            id: 'step2', 
            title: 'Finding Perfect Matches',
            duration: 2500,
            details: [
                'Running compatibility algorithm...',
                'Cross-referencing preferences',
                'Optimizing for mutual satisfaction',
                'Generating match scores'
            ]
        },
        {
            id: 'step3',
            title: 'Selecting Ideal Gifts',
            duration: 3000,
            details: [
                'Analyzing 50,000+ gift options...',
                'Matching cultural preferences',
                'Considering budget constraints',
                'Optimizing for surprise factor'
            ]
        },
        {
            id: 'step4',
            title: 'Optimizing Delivery',
            duration: 2000,
            details: [
                'Connecting to local Amazon APIs...',
                'Verifying product availability',
                'Calculating delivery times',
                'Finalizing purchase options'
            ]
        }
    ];
    
    for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        
        // Update progress
        const progressPercent = ((i + 1) / totalSteps) * 100;
        updateProgress(progressPercent);
        updateProgressText(step.title);
        
        // Activate current step
        activateStep(step.id);
        
        // Simulate processing with dynamic details
        await simulateProcessing(step);
        
        // Complete step
        completeStep(step.id);
        
        // Small delay between steps
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Show results
    await showMatchingResults();
}

function updateProgress(percent) {
    const progressFill = document.getElementById('progressFill');
    progressFill.style.width = `${percent}%`;
}

function updateProgressText(text) {
    const progressText = document.getElementById('progressText');
    progressText.textContent = text;
}

function resetSteps() {
    const steps = document.querySelectorAll('.step-item');
    steps.forEach(step => {
        step.classList.remove('active', 'completed');
        const status = step.querySelector('.step-status i');
        status.className = 'fas fa-clock';
        const details = step.querySelector('.step-details');
        details.style.display = 'none';
    });
}

function activateStep(stepId) {
    const step = document.getElementById(stepId);
    step.classList.add('active');
    
    const status = step.querySelector('.step-status i');
    status.className = 'fas fa-spinner fa-spin';
    status.style.color = '#4c63d2';
    
    const details = step.querySelector('.step-details');
    details.style.display = 'block';
}

function completeStep(stepId) {
    const step = document.getElementById(stepId);
    step.classList.remove('active');
    step.classList.add('completed');
    
    const status = step.querySelector('.step-status i');
    status.className = 'fas fa-check-circle';
    status.style.color = '#10b981';
}

async function simulateProcessing(step) {
    const details = step.details;
    const detailsList = document.querySelector(`#${step.id} .step-details ul`);
    
    // Clear existing details
    detailsList.innerHTML = '';
    
    // Add details one by one with animation
    for (let i = 0; i < details.length; i++) {
        const li = document.createElement('li');
        li.textContent = details[i];
        li.style.opacity = '0';
        li.style.transform = 'translateX(-20px)';
        detailsList.appendChild(li);
        
        // Animate in
        setTimeout(() => {
            li.style.transition = 'all 0.3s ease';
            li.style.opacity = '1';
            li.style.transform = 'translateX(0)';
        }, i * 200);
        
        await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    // Wait for step duration
    await new Promise(resolve => setTimeout(resolve, step.duration - (details.length * 200)));
}

async function showMatchingResults() {
    // Hide process and show results
    document.getElementById('matchingProcess').style.display = 'none';
    document.getElementById('matchingResults').style.display = 'block';
    
    // Animate results appearing
    const matchCards = document.querySelectorAll('.match-card');
    matchCards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        
        setTimeout(() => {
            card.style.transition = 'all 0.6s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 200);
    });
    
    // Animate stats
    setTimeout(() => {
        animateStats();
    }, 1000);
    
    // Show action buttons
    setTimeout(() => {
        const buttons = document.querySelectorAll('.action-buttons button');
        buttons.forEach((button, index) => {
            button.style.opacity = '0';
            button.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                button.style.transition = 'all 0.4s ease';
                button.style.opacity = '1';
                button.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }, 1500);
    
    console.log('✅ Matching algorithm demo completed successfully!');
}

function animateStats() {
    const statNumbers = document.querySelectorAll('.stat-number');
    const finalValues = ['95%', '2.3s', '100%', '6'];
    
    statNumbers.forEach((stat, index) => {
        let current = 0;
        const target = parseInt(finalValues[index]) || 100;
        const increment = target / 30; // 30 frames for smooth animation
        
        const animate = () => {
            current += increment;
            if (current >= target) {
                stat.textContent = finalValues[index];
            } else {
                if (finalValues[index].includes('%')) {
                    stat.textContent = Math.round(current) + '%';
                } else if (finalValues[index].includes('s')) {
                    stat.textContent = (current / 10).toFixed(1) + 's';
                } else {
                    stat.textContent = Math.round(current);
                }
                requestAnimationFrame(animate);
            }
        };
        
        setTimeout(() => animate(), index * 200);
    });
}

// Action button handlers
function startChatSession() {
    console.log('🗨️ Starting chat sessions for matched pairs...');
    showNotification('Chat sessions initiated for all matched pairs! 🎉', 'success');
    
    // Simulate redirecting to chat
    setTimeout(() => {
        window.location.href = 'realtime-chat.html?match=demo';
    }, 2000);
}

function viewAnalytics() {
    console.log('📊 Opening matching analytics...');
    showNotification('Analytics dashboard opening soon! 📈', 'info');
}

function exportResults() {
    console.log('📥 Exporting matching results...');
    
    // Simulate file download
    const results = {
        timestamp: new Date().toISOString(),
        algorithm_version: 'v2.1.0',
        total_participants: 6,
        successful_matches: 3,
        average_compatibility: '95%',
        processing_time: '2.3s',
        matches: [
            {
                participants: ['Sarah (Germany)', 'Mike (Canada)'],
                compatibility: '98%',
                gifts: ['German Chocolate Collection', 'Canadian Maple Syrup Set']
            },
            {
                participants: ['Lisa (Japan)', 'Emma (Australia)'],
                compatibility: '95%',
                gifts: ['Japanese Tea Ceremony Kit', 'Australian Gourmet Collection']
            },
            {
                participants: ['Alex (USA)', 'Sophie (France)'],
                compatibility: '92%',
                gifts: ['American Craft Collection', 'French Wine Accessories']
            }
        ]
    };
    
    const dataStr = JSON.stringify(results, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `enkiconnect-matches-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    showNotification('Match results exported successfully! 📁', 'success');
}

// Utility functions
function showNotification(message, type = 'info') {
    // Remove existing notifications
    document.querySelectorAll('.matching-notification').forEach(n => n.remove());
    
    const notification = document.createElement('div');
    notification.className = `matching-notification setup-notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'error' ? 'exclamation-circle' : type === 'success' ? 'check-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, type === 'error' ? 5000 : 3000);
}

// Restart demo functionality
document.addEventListener('keydown', function(event) {
    // Press 'R' to restart demo
    if (event.key.toLowerCase() === 'r' && event.ctrlKey) {
        event.preventDefault();
        restartDemo();
    }
});

function restartDemo() {
    console.log('🔄 Restarting gift matching demo...');
    
    // Reset all sections
    document.querySelector('.matching-hero').style.display = 'block';
    document.getElementById('matchingProcess').style.display = 'none';
    document.getElementById('matchingResults').style.display = 'none';
    
    // Reset progress
    updateProgress(0);
    updateProgressText('Initializing...');
    resetSteps();
    
    showNotification('Demo reset! Click "Start Matching Demo" to begin again.', 'info');
}

// Add some Easter eggs for fun
let clickCount = 0;
document.querySelector('.algorithm-badge').addEventListener('click', function() {
    clickCount++;
    if (clickCount === 5) {
        showNotification('🤖 Easter egg found! Our AI is watching... 👁️', 'success');
        clickCount = 0;
    }
});

// Performance monitoring
const startTime = performance.now();
window.addEventListener('load', function() {
    const loadTime = performance.now() - startTime;
    console.log(`🏺 Gift Matching Demo loaded in ${loadTime.toFixed(2)}ms`);
}); 