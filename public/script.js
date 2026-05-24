// Product Dataset Mapping
const catalog = {
    followers: [
        { qty: "5,000", price: 100 }, { qty: "10,000", price: 180 }, { qty: "15,000", price: 250 },
        { qty: "20,000", price: 330 }, { qty: "30,000", price: 400 }, { qty: "50,000", price: 600 },
        { qty: "100,000", price: 900 }
    ],
    likes: [
        { qty: "20,000", price: 100 }, { qty: "30,000", price: 180 }, { qty: "50,000", price: 300 },
        { qty: "80,000", price: 420 }, { qty: "100,000", price: 550 }, { qty: "150,000", price: 700 }
    ],
    views: [
        { qty: "50,000", price: 100 }, { qty: "100,000", price: 180 }, { qty: "150,000", price: 250 },
        { qty: "200,000", price: 330 }, { qty: "500,000", price: 400 }, { qty: "1,000,000", price: 600 },
        { qty: "1,500,000", price: 900 }
    ],
    comments: [
        { qty: "500", price: 100 }, { qty: "1,000", price: 180 }, { qty: "1,500", price: 250 },
        { qty: "2,000", price: 330 }, { qty: "3,000", price: 400 }, { qty: "5,000", price: 600 },
        { qty: "10,000", price: 900 }
    ]
};

let activeOrder = null;

// Page 1: Transition Splash Screen to Page 2 smoothly
document.addEventListener("DOMContentLoaded", () => {
    renderGridCards();
    
    // Give the splash screen 2.5 seconds to show off before transitioning
    setTimeout(() => {
        const splash = document.getElementById('splash-screen');
        const mainStore = document.getElementById('main-store');
        
        // Phase 1: Fade out the splash screen smoothly
        splash.classList.remove('opacity-100');
        splash.classList.add('opacity-0');
        
        // Phase 2: Once hidden, swap visibility layout entirely
        setTimeout(() => {
            splash.style.display = 'none';
            
            // Reveal the main storefront
            mainStore.classList.remove('hidden');
            // Allow a tiny layout tick before fading it in
            setTimeout(() => {
                mainStore.classList.add('opacity-100');
            }, 50);
        }, 700); // Matches the duration-700 fade class
    }, 2500); // 2.5 seconds showcase delay
});

// Build Responsive Cards Dynamically
function renderGridCards() {
    Object.keys(catalog).forEach(category => {
        const targetGrid = document.getElementById(`${category}-container`);
        if (!targetGrid) return;

        catalog[category].forEach((item, index) => {
            const cardId = `${category}-${index}`;
            const isPurchased = localStorage.getItem(cardId) === 'true';

            const card = document.createElement('div');
            card.className = `bg-zinc-900/60 border ${isPurchased ? 'border-zinc-800 opacity-60' : 'border-zinc-800'} rounded-2xl p-4 flex flex-col justify-between items-center text-center card-glow transition-all duration-300`;
            card.id = `card-${cardId}`;

            card.innerHTML = `
                <div class="mb-4">
                    <span class="text-xs uppercase font-semibold text-zinc-500 tracking-wider">${category}</span>
                    <div class="text-xl font-black mt-1">${item.qty}</div>
                </div>
                <div class="w-full">
                    <div class="text-sm font-bold text-zinc-300 mb-3">Ksh ${item.price}</div>
                    <button 
                        onclick="initiateCheckout('${category}', '${item.qty}', ${item.price}, '${cardId}')"
                        ${isPurchased ? 'disabled' : ''}
                        class="w-full ${isPurchased ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' : 'bg-white text-black hover:bg-zinc-200'} font-bold py-2 px-3 rounded-xl text-xs transition-colors"
                    >
                        ${isPurchased ? 'Purchased' : 'Buy Now'}
                    </button>
                </div>
            `;
            targetGrid.appendChild(card);
        });
    });
}

// Intercept to Modal Presentation
function initiateCheckout(service, qty, price, uniqueCardId) {
    activeOrder = { service, qty, price, uniqueCardId };

    document.getElementById('summary-service').innerText = service;
    document.getElementById('summary-qty').innerText = qty;
    document.getElementById('summary-price').innerText = `Ksh ${price}`;
    
    const modal = document.getElementById('checkout-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeModal() {
    document.getElementById('checkout-modal').classList.replace('flex', 'hidden');
    activeOrder = null;
}

// Execute Form Actions via Payload Streams
async function handlePayment(event) {
    event.preventDefault();
    if (!activeOrder) return;

    const username = document.getElementById('tiktok-username').value;
    const phone = document.getElementById('phone-number').value;
    
    // UI Elements for Live Loading Status Change
    const btn = document.getElementById('submit-pay-btn');
    const txt = document.getElementById('btn-text');
    const spinner = document.getElementById('btn-spinner');

    // Enable Live Loading State
    btn.disabled = true;
    txt.innerText = "Connecting to MegaPay...";
    spinner.classList.remove('hidden');

    try {
        const response = await fetch('/api/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                phone: phone,
                amount: activeOrder.price,
                service: activeOrder.service,
                packageSize: activeOrder.qty,
                username: username
            })
        });

        // 1. Check if the server returned a failing status code
        if (!response.ok) {
            const errorText = await response.text();
            console.error("Backend HTML/Text Error Response:", errorText);
            alert(`Server error (${response.status}). Check your VS Code terminal for details.`);
            return;
        }

        // 2. Safely read text first to prevent unexpected crashes
        const rawText = await response.text();
        if (!rawText) {
            throw new Error("Server returned a completely empty response.");
        }

        // 3. Now parse it manually
        const data = JSON.parse(rawText);

        if (data.success) {
            alert(data.message);
            localStorage.setItem(activeOrder.uniqueCardId, 'true');
            
            const currentCardButton = document.querySelector(`#card-${activeOrder.uniqueCardId} button`);
            if (currentCardButton) {
                currentCardButton.disabled = true;
                currentCardButton.innerText = "Purchased";
                currentCardButton.className = "w-full bg-zinc-800 text-zinc-500 cursor-not-allowed font-bold py-2 px-3 rounded-xl text-xs";
                document.getElementById(`card-${activeOrder.uniqueCardId}`).classList.add('opacity-60');
            }
            
            closeModal();
        } else {
            alert(data.message || "An error occurred while pushing transaction request.");
        }
    } catch (err) {
        console.error("Caught Frontend Error:", err);
        alert(`Payment error: ${err.message}`);
    
    } finally {
        // Disable Live Loading State
        btn.disabled = false;
        txt.innerText = "Initialize M-Pesa STK Push";
        spinner.classList.add('hidden');
    }
}