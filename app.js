// DEGEN - Crypto Social with Real Data Integration
// =================================================
console.log('DEGEN: app.js loaded');
window.addEventListener('error', (e) => {
    console.error('DEGEN: Global error:', e.message, 'at', e.filename, ':', e.lineno);
});

// Configuration - Supabase Project: soltag (mvglowfvayvpqsfbortv)
const SUPABASE_URL = 'https://mvglowfvayvpqsfbortv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12Z2xvd2Z2YXl2cHFzZmJvcnR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5ODEyNTgsImV4cCI6MjA4MDU1NzI1OH0.AMt0qkySg8amOyrBbypFZnrRaEPbIrpmMYGGMxksPks';

const JUPITER_API = 'https://quote-api.jup.ag/v6';
const COINGECKO_API = 'https://api.coingecko.com/api/v3';
const HELIUS_RPC = 'https://mainnet.helius-rpc.com/?api-key=15319bf4-5b40-4958-ac8d-6313aa55eb92';

// CoinGecko ID mapping for each token
const COINGECKO_IDS = {
    SOL: 'solana',
    USDC: 'usd-coin',
    USDT: 'tether',
    BONK: 'bonk',
    WIF: 'dogwifcoin',
    JUP: 'jupiter-exchange-solana',
    RAY: 'raydium',
    PYTH: 'pyth-network',
    RNDR: 'render-token',
    JITO: 'jito-governance-token'
};

// Token List (Common Solana tokens with accurate mints)
const TOKENS = {
    SOL: { symbol: 'SOL', name: 'Solana', mint: 'So11111111111111111111111111111111111111112', decimals: 9, logo: 'SO' },
    USDC: { symbol: 'USDC', name: 'USD Coin', mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', decimals: 6, logo: 'US' },
    USDT: { symbol: 'USDT', name: 'Tether USD', mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', decimals: 6, logo: 'UT' },
    BONK: { symbol: 'BONK', name: 'Bonk', mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', decimals: 5, logo: 'BK' },
    WIF: { symbol: 'WIF', name: 'dogwifhat', mint: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm', decimals: 6, logo: 'WF' },
    JUP: { symbol: 'JUP', name: 'Jupiter', mint: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', decimals: 6, logo: 'JP' },
    RAY: { symbol: 'RAY', name: 'Raydium', mint: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R', decimals: 6, logo: 'RY' },
    PYTH: { symbol: 'PYTH', name: 'Pyth Network', mint: 'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3', decimals: 6, logo: 'PY' },
    RNDR: { symbol: 'RNDR', name: 'Render', mint: 'rndrizKT3MK1iimdxRdWabcF7Zg7AR5T4nud4EkHBof', decimals: 8, logo: 'RN' },
    JITO: { symbol: 'JITO', name: 'Jito', mint: 'jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL', decimals: 9, logo: 'JT' }
};

// State
let wallet = null;
let publicKey = null;
let tokenBalances = {};
let currentQuote = null;
let currentPrices = {
    SOL: 144.00,
    USDC: 1.00,
    USDT: 1.00,
    BONK: 0.00001,
    WIF: 0.39,
    JUP: 0.22,
    RAY: 1.14,
    PYTH: 0.07,
    RNDR: 2.28,
    JITO: 0.42
};
let posts = [];
let supabaseClient = null;
let currentUser = null;

let swapState = {
    fromToken: TOKENS.SOL,
    toToken: TOKENS.USDC
};

// Initialize Supabase client
function initSupabase() {
    if (typeof window.supabase !== 'undefined') {
        supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('Supabase initialized');

        // Listen for auth state changes
        supabaseClient.auth.onAuthStateChange((event, session) => {
            console.log('Auth state changed:', event);
            if (session) {
                currentUser = session.user;
                updateUIForLoggedInUser(session.user);
            } else {
                currentUser = null;
                updateUIForLoggedOutUser();
            }
        });

        // Check for existing session
        checkExistingSession();

        return true;
    }
    console.warn('Supabase SDK not loaded');
    return false;
}

async function checkExistingSession() {
    if (!supabaseClient) return;

    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        currentUser = session.user;
        updateUIForLoggedInUser(session.user);
    }
}

function updateUIForLoggedInUser(user) {
    const connectBtn = document.getElementById('connectWallet');
    const userAvatar = document.getElementById('userAvatar');
    const userName = document.getElementById('userName');
    const userEmail = document.getElementById('userEmail');

    if (connectBtn) {
        connectBtn.classList.add('connected');
        const email = user.email || 'User';
        const initial = email.charAt(0).toUpperCase();
        connectBtn.innerHTML = `
            <span class="user-initial">${initial}</span>
            <span>${email.split('@')[0]}</span>
        `;
    }

    if (userAvatar) userAvatar.textContent = user.email?.charAt(0).toUpperCase() || 'U';
    if (userName) userName.textContent = user.user_metadata?.username || user.email?.split('@')[0] || 'User';
    if (userEmail) userEmail.textContent = user.email || '';

    // Close auth modal if open
    const authModal = document.getElementById('authModal');
    if (authModal) authModal.classList.remove('active');

    showToast('Signed in successfully!', 'success');
}

function updateUIForLoggedOutUser() {
    const connectBtn = document.getElementById('connectWallet');
    if (connectBtn) {
        connectBtn.classList.remove('connected');
        connectBtn.innerHTML = `
            <svg class="wallet-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                <line x1="1" y1="10" x2="23" y2="10" />
            </svg>
            <span class="wallet-text">Connect</span>
        `;
    }
}

function startApp() {
    console.log('DEGEN: Starting app...');
    try {
        const hasSupabase = initSupabase();
        console.log('DEGEN: Supabase status:', hasSupabase);

        initializeApp();
    } catch (err) {
        console.error('DEGEN: Critical initialization error:', err);
        alert('DEGEN: App failed to start. Check console for details.');
    }
}

function initializeApp() {
    console.log('DEGEN: Initializing UI components...');
    const elements = getElements();
    window.appElements = elements;

    // Check for missing elements to avoid crashing
    const missing = Object.entries(elements).filter(([k, v]) => !v).map(([k]) => k);
    if (missing.length > 0) {
        console.warn('DEGEN: Missing DOM elements:', missing);
    }

    try {
        if (elements.navItems && elements.navItems.length > 0) setupNavigation(elements);
        if (elements.connectWallet) setupWalletConnection(elements);
        if (elements.postBtn) setupFeed(elements);
        if (elements.swapBtn) setupSwap(elements);
        if (elements.tokenModal) setupTokenModal(elements);

        // Load real data
        loadPosts(elements);
        fetchRealPrices(elements);
        if (elements.popularTokens) renderTokenList(elements, '');
        if (elements.trendingTokens) renderTrendingTokens(elements);

        // Refresh data periodically
        setInterval(() => fetchRealPrices(elements), 15000);
        setInterval(() => loadPosts(elements), 30000);

        console.log('DEGEN: App initialized successfully');
    } catch (err) {
        console.error('DEGEN: Component setup failed:', err);
    }
}

function getElements() {
    return {
        connectWallet: document.getElementById('connectWallet'),
        walletText: document.getElementById('walletText'),
        feed: document.getElementById('feed'),
        postInput: document.getElementById('postInput'),
        postBtn: document.getElementById('postBtn'),
        charCount: document.getElementById('charCount'),
        priceList: document.getElementById('priceList'),
        trendingList: document.getElementById('trendingList'),
        navItems: document.querySelectorAll('.nav-item, .mobile-nav-item'),
        views: document.querySelectorAll('.view'),
        fromAmount: document.getElementById('fromAmount'),
        toAmount: document.getElementById('toAmount'),
        fromTokenSelect: document.getElementById('fromTokenSelect'),
        toTokenSelect: document.getElementById('toTokenSelect'),
        fromTokenSymbol: document.getElementById('fromTokenSymbol'),
        toTokenSymbol: document.getElementById('toTokenSymbol'),
        fromBalance: document.getElementById('fromBalance'),
        swapBtn: document.getElementById('swapBtn'),
        swapDirection: document.getElementById('swapDirection'),
        swapInfo: document.getElementById('swapInfo'),
        swapRate: document.getElementById('swapRate'),
        priceImpact: document.getElementById('priceImpact'),
        minReceived: document.getElementById('minReceived'),
        maxBtn: document.getElementById('maxBtn'),
        tokenModal: document.getElementById('tokenModal'),
        closeTokenModal: document.getElementById('closeTokenModal'),
        tokenSearchInput: document.getElementById('tokenSearchInput'),
        popularTokens: document.getElementById('popularTokens'),
        tokenResults: document.getElementById('tokenResults'),
        portfolioTotal: document.getElementById('portfolioTotal'),
        tokenList: document.getElementById('tokenList'),
        trendingTokens: document.getElementById('trendingTokens'),
        tokenSearch: document.getElementById('tokenSearch'),
        toastContainer: document.getElementById('toastContainer')
    };
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function formatNumber(num, decimals = 2) {
    if (num === undefined || num === null || isNaN(num)) return '0';
    if (num >= 1e9) return (num / 1e9).toFixed(decimals) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(decimals) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(decimals) + 'K';
    return num.toFixed(decimals);
}

function formatPrice(price) {
    if (price === undefined || price === null || isNaN(price)) return '0.00';
    if (price < 0.0001) return price.toExponential(2);
    if (price < 1) return price.toFixed(6);
    if (price < 100) return price.toFixed(4);
    return price.toFixed(2);
}

function shortenAddress(address) {
    if (!address) return '';
    return address.slice(0, 4) + '...' + address.slice(-4);
}

function showToast(message, type = 'info') {
    const container = window.appElements?.toastContainer;
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span class="toast-message">${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 200);
    }, 3000);
}

function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

function parseContent(content) {
    return content
        .replace(/\$([A-Z]+)/g, '<span class="token">$$$1</span>')
        .replace(/@(\w+)/g, '<span class="mention">@$1</span>');
}

function timeAgo(date) {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'now';
    if (seconds < 3600) return Math.floor(seconds / 60) + 'm';
    if (seconds < 86400) return Math.floor(seconds / 3600) + 'h';
    return Math.floor(seconds / 86400) + 'd';
}

// ============================================
// NAVIGATION
// ============================================

function setupNavigation(elements) {
    elements.navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();

            // Handle Wallet Button separately if it's the mobile one
            if (item.id === 'mobileWalletBtn') {
                const connectWallet = document.getElementById('connectWallet');
                if (connectWallet) connectWallet.click();
                return;
            }

            const page = item.dataset.page;
            if (!page) return;

            // Deactivate all nav items
            elements.navItems.forEach(i => i.classList.remove('active'));

            // Activate all nav items representing this page (desktop & mobile)
            elements.navItems.forEach(i => {
                if (i.dataset.page === page) {
                    i.classList.add('active');
                }
            });

            // Switch View
            elements.views.forEach(view => view.classList.remove('active'));
            const targetView = document.getElementById(`${page}View`);
            if (targetView) targetView.classList.add('active');

            // Scroll to top
            window.scrollTo(0, 0);
        });
    });
}

// ============================================
// REAL WALLET CONNECTION
// ============================================

function setupWalletConnection(elements) {
    elements.connectWallet.addEventListener('click', async () => {
        if (publicKey) {
            await disconnectWallet(elements);
        } else {
            await connectWallet(elements);
        }
    });
}

async function connectWallet(elements) {
    try {
        if (!window.solana || !window.solana.isPhantom) {
            showToast('Please install Phantom wallet', 'error');
            window.open('https://phantom.app/', '_blank');
            return;
        }

        const resp = await window.solana.connect();
        publicKey = resp.publicKey.toString();
        wallet = window.solana;

        elements.walletText.textContent = shortenAddress(publicKey);
        elements.connectWallet.classList.add('connected');

        showToast('Wallet connected', 'success');

        await fetchRealBalances();
        updatePortfolio(elements);
        updateSwapBalance(elements);

    } catch (err) {
        console.error('Wallet connection failed:', err);
        showToast('Failed to connect wallet', 'error');
    }
}

async function disconnectWallet(elements) {
    try {
        if (wallet) await wallet.disconnect();
    } catch (e) { }

    wallet = null;
    publicKey = null;
    tokenBalances = {};

    elements.walletText.textContent = 'Connect Wallet';
    elements.connectWallet.classList.remove('connected');
    elements.tokenList.innerHTML = '<div class="empty-state">Connect wallet to view portfolio</div>';
    elements.portfolioTotal.textContent = '$0.00';
    elements.fromBalance.textContent = '0.00';

    showToast('Wallet disconnected');
}

async function fetchRealBalances() {
    if (!publicKey) return;

    try {
        if (typeof solanaWeb3 === 'undefined') {
            console.warn('solanaWeb3 not loaded');
            return;
        }

        const connection = new solanaWeb3.Connection(HELIUS_RPC);

        // Get SOL balance
        const solBalance = await connection.getBalance(new solanaWeb3.PublicKey(publicKey));
        tokenBalances['SOL'] = solBalance / 1e9;

        // Get all token accounts
        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
            new solanaWeb3.PublicKey(publicKey),
            { programId: new solanaWeb3.PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') }
        );

        for (const account of tokenAccounts.value) {
            const mint = account.account.data.parsed.info.mint;
            const amount = account.account.data.parsed.info.tokenAmount.uiAmount;

            for (const [symbol, token] of Object.entries(TOKENS)) {
                if (token.mint === mint && amount > 0) {
                    tokenBalances[symbol] = amount;
                }
            }
        }

        console.log('Balances fetched:', tokenBalances);

    } catch (err) {
        console.error('Failed to fetch balances:', err);
    }
}

// ============================================
// REAL POSTS (SUPABASE)
// ============================================

function setupFeed(elements) {
    elements.postInput.addEventListener('input', () => {
        const count = elements.postInput.value.length;
        elements.charCount.textContent = count;
        elements.charCount.style.color = count > 280 ? 'var(--red)' : count > 250 ? 'var(--accent)' : 'var(--text-muted)';
    });

    elements.postBtn.addEventListener('click', () => createPost(elements));
}

async function loadPosts(elements) {
    try {
        if (supabaseClient) {
            const { data, error } = await supabaseClient
                .from('posts')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);

            if (!error && data && data.length > 0) {
                posts = data;
                renderFeed(elements);
                return;
            }
        }

        const stored = localStorage.getItem('degen_posts');
        if (stored) {
            posts = JSON.parse(stored);
        }

        if (posts.length === 0) {
            posts = [
                {
                    id: 1,
                    author_name: 'whale.sol',
                    author_handle: '@whale_alert',
                    content: 'Just swapped 500 $SOL for $BONK. The charts are looking strong.',
                    likes: 142,
                    reposts: 23,
                    created_at: new Date(Date.now() - 300000).toISOString()
                },
                {
                    id: 2,
                    author_name: 'CryptoTrader',
                    author_handle: '@alpha_calls',
                    content: 'New $JUP airdrop coming next month. Make sure you have been using the platform.',
                    likes: 892,
                    reposts: 234,
                    created_at: new Date(Date.now() - 1080000).toISOString()
                },
                {
                    id: 3,
                    author_name: 'SolanaDaily',
                    author_handle: '@sol_daily',
                    content: '$SOL breaking $200 resistance. Next target $250. Volume looking healthy across DEXs.',
                    likes: 1024,
                    reposts: 312,
                    created_at: new Date(Date.now() - 3600000).toISOString()
                },
                {
                    id: 4,
                    author_name: 'DegenLabs',
                    author_handle: '@degen_labs',
                    content: '$WIF up 40% this week. What are you holding?',
                    likes: 112,
                    reposts: 12,
                    created_at: new Date(Date.now() - 7200000).toISOString()
                }
            ];
        }
        renderFeed(elements);

    } catch (err) {
        console.error('Error loading posts:', err);
        renderFeed(elements);
    }
}

async function createPost(elements) {
    const content = elements.postInput.value.trim();
    if (!content || content.length > 280) {
        showToast('Post must be between 1 and 280 characters', 'error');
        return;
    }

    const newPost = {
        id: Date.now(),
        wallet_address: publicKey || null,
        author_name: publicKey ? shortenAddress(publicKey) : 'Anon',
        author_handle: publicKey ? '@' + publicKey.slice(0, 8) : '@anon',
        content: content,
        likes: 0,
        reposts: 0,
        liked_by: [],
        reposted_by: [],
        created_at: new Date().toISOString()
    };

    try {
        if (supabaseClient) {
            // Save to Supabase
            const { data, error } = await supabaseClient
                .from('posts')
                .insert([newPost])
                .select();

            if (!error && data) {
                posts.unshift(data[0]);
            } else {
                posts.unshift(newPost);
            }
        } else {
            posts.unshift(newPost);
        }

        // Also save to local storage as backup
        localStorage.setItem('degen_posts', JSON.stringify(posts.slice(0, 100)));

        elements.postInput.value = '';
        elements.charCount.textContent = '0';
        renderFeed(elements);
        showToast('Post created', 'success');

    } catch (err) {
        console.error('Error creating post:', err);
        posts.unshift(newPost);
        localStorage.setItem('degen_posts', JSON.stringify(posts.slice(0, 100)));
        renderFeed(elements);
        showToast('Post saved locally', 'success');
    }
}

function renderFeed(elements) {
    if (posts.length === 0) {
        elements.feed.innerHTML = '<div class="empty-state">No posts yet. Be the first to post!</div>';
        return;
    }

    elements.feed.innerHTML = posts.map(post => {
        const isLiked = publicKey && post.liked_by?.includes(publicKey);
        const isReposted = publicKey && post.reposted_by?.includes(publicKey);

        return `
            <article class="post" data-id="${post.id}">
                <div class="post-avatar">${(post.author_name || 'AN').slice(0, 2).toUpperCase()}</div>
                <div class="post-content">
                    <div class="post-header">
                        <span class="post-name">${post.author_name || 'Anon'}</span>
                        <span class="post-handle">${post.author_handle || '@anon'}</span>
                        <span class="post-time">${timeAgo(post.created_at)}</span>
                    </div>
                    <div class="post-body">${parseContent(post.content)}</div>
                    <div class="post-actions">
                        <button class="action-btn reply" data-action="reply" data-id="${post.id}">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                            </svg>
                        </button>
                        <button class="action-btn repost ${isReposted ? 'active' : ''}" data-action="repost" data-id="${post.id}">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="17 1 21 5 17 9"/>
                                <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
                                <polyline points="7 23 3 19 7 15"/>
                                <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
                            </svg>
                            <span>${post.reposts > 0 ? formatNumber(post.reposts, 0) : ''}</span>
                        </button>
                        <button class="action-btn like ${isLiked ? 'active' : ''}" data-action="like" data-id="${post.id}">
                            <svg viewBox="0 0 24 24" fill="${isLiked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                            </svg>
                            <span>${post.likes > 0 ? formatNumber(post.likes, 0) : ''}</span>
                        </button>
                        <button class="action-btn share" data-action="share" data-id="${post.id}">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                                <polyline points="16 6 12 2 8 6"/>
                                <line x1="12" y1="2" x2="12" y2="15"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </article>
        `;
    }).join('');

    // Attach event listeners
    document.querySelectorAll('.action-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            handlePostAction(btn.dataset.action, parseInt(btn.dataset.id), elements);
        });
    });
}

async function handlePostAction(action, postId, elements) {
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    switch (action) {
        case 'like':
            if (!publicKey) {
                showToast('Connect wallet to like posts', 'error');
                return;
            }
            const likedIndex = post.liked_by?.indexOf(publicKey) ?? -1;
            if (likedIndex > -1) {
                post.liked_by.splice(likedIndex, 1);
                post.likes = Math.max(0, post.likes - 1);
            } else {
                post.liked_by = post.liked_by || [];
                post.liked_by.push(publicKey);
                post.likes = (post.likes || 0) + 1;
            }
            await updatePostInDB(post);
            break;

        case 'repost':
            if (!publicKey) {
                showToast('Connect wallet to repost', 'error');
                return;
            }
            const repostIndex = post.reposted_by?.indexOf(publicKey) ?? -1;
            if (repostIndex > -1) {
                post.reposted_by.splice(repostIndex, 1);
                post.reposts = Math.max(0, post.reposts - 1);
            } else {
                post.reposted_by = post.reposted_by || [];
                post.reposted_by.push(publicKey);
                post.reposts = (post.reposts || 0) + 1;
            }
            await updatePostInDB(post);
            break;

        case 'share':
            navigator.clipboard.writeText(`${window.location.origin}#post-${postId}`);
            showToast('Link copied', 'success');
            break;

        case 'reply':
            elements.postInput.focus();
            elements.postInput.value = `${post.author_handle} `;
            elements.charCount.textContent = elements.postInput.value.length;
            break;
    }

    localStorage.setItem('degen_posts', JSON.stringify(posts.slice(0, 100)));
    renderFeed(elements);
}

async function updatePostInDB(post) {
    if (!supabaseClient) return;

    try {
        await supabaseClient
            .from('posts')
            .update({
                likes: post.likes,
                reposts: post.reposts,
                liked_by: post.liked_by,
                reposted_by: post.reposted_by
            })
            .eq('id', post.id);
    } catch (err) {
        console.error('Error updating post:', err);
    }
}

// ============================================
// REAL PRICES (COINGECKO API)
// ============================================

async function fetchRealPrices(elements) {
    try {
        // Build the CoinGecko API URL with all token IDs
        const coinIds = Object.values(COINGECKO_IDS).join(',');
        const response = await fetch(
            `${COINGECKO_API}/simple/price?ids=${coinIds}&vs_currencies=usd&include_24hr_change=true`
        );

        if (!response.ok) throw new Error('CoinGecko API failed: ' + response.status);

        const data = await response.json();

        // Update prices from API response
        for (const [symbol, geckoId] of Object.entries(COINGECKO_IDS)) {
            const priceInfo = data[geckoId];
            if (priceInfo && priceInfo.usd !== undefined) {
                currentPrices[symbol] = priceInfo.usd;
            }
        }

        console.log('✓ Real prices fetched from CoinGecko:', currentPrices);
        renderPrices(elements);
        renderTrending(elements);

        if (publicKey) {
            updatePortfolio(elements);
        }

    } catch (err) {
        console.warn('Price fetch failed, using fallback data:', err.message);
        // Still render with fallback/cached prices
        renderPrices(elements);
        renderTrending(elements);
        renderTrendingTokens(elements);
    }
}

function renderPrices(elements) {
    const priceData = Object.entries(TOKENS).slice(0, 6).map(([symbol, token]) => ({
        symbol,
        token,
        price: currentPrices[symbol] || 0
    })).filter(p => p.price > 0);

    if (priceData.length === 0) {
        elements.priceList.innerHTML = '<div class="empty-state">Loading prices...</div>';
        return;
    }

    elements.priceList.innerHTML = priceData.map(p => `
        <div class="price-item" data-symbol="${p.symbol}">
            <div class="price-token">
                <div class="price-token-icon">${p.token.logo}</div>
                <span class="price-token-symbol">${p.symbol}</span>
            </div>
            <div class="price-data">
                <div class="price-usd">$${formatPrice(p.price)}</div>
            </div>
        </div>
    `).join('');

    // Click to quick swap
    document.querySelectorAll('.price-item').forEach(item => {
        item.addEventListener('click', () => {
            const symbol = item.dataset.symbol;
            swapState.toToken = TOKENS[symbol];
            elements.toTokenSymbol.textContent = symbol;

            elements.navItems.forEach(i => i.classList.remove('active'));
            document.querySelector('[data-page="swap"]').classList.add('active');
            elements.views.forEach(v => v.classList.remove('active'));
            document.getElementById('swapView').classList.add('active');
        });
    });
}

function renderTrending(elements) {
    // Sort by price for trending (you could also sort by volume if you had that data)
    const sorted = Object.entries(TOKENS)
        .filter(([symbol]) => currentPrices[symbol])
        .slice(0, 5);

    elements.trendingList.innerHTML = sorted.map(([symbol], i) => `
        <div class="trending-item" data-symbol="${symbol}">
            <span class="trending-rank">${i + 1}</span>
            <div class="trending-info">
                <div class="trending-name">${symbol}</div>
                <div class="trending-volume">$${formatPrice(currentPrices[symbol])}</div>
            </div>
        </div>
    `).join('');
}

function renderTrendingTokens(elements) {
    elements.trendingTokens.innerHTML = Object.entries(TOKENS).map(([symbol, token]) => `
        <div class="trending-token-card" data-symbol="${symbol}">
            <div class="trending-token-header">
                <div class="trending-token-icon">${token.logo}</div>
                <div>
                    <div class="trending-token-name">${token.name}</div>
                    <div class="trending-token-symbol">${symbol}</div>
                </div>
            </div>
            <div class="trending-token-stats">
                <div>
                    <div class="stat-label">Price</div>
                    <div class="stat-value">$${formatPrice(currentPrices[symbol] || 0)}</div>
                </div>
                <div>
                    <div class="stat-label">Mint</div>
                    <div class="stat-value">${token.mint.slice(0, 6)}...</div>
                </div>
            </div>
        </div>
    `).join('');

    document.querySelectorAll('.trending-token-card').forEach(card => {
        card.addEventListener('click', () => {
            const symbol = card.dataset.symbol;
            swapState.toToken = TOKENS[symbol];
            const elements = window.appElements;
            elements.toTokenSymbol.textContent = symbol;

            elements.navItems.forEach(i => i.classList.remove('active'));
            document.querySelector('[data-page="swap"]').classList.add('active');
            elements.views.forEach(v => v.classList.remove('active'));
            document.getElementById('swapView').classList.add('active');
        });
    });
}

// ============================================
// PORTFOLIO (REAL BALANCES)
// ============================================

function updatePortfolio(elements) {
    if (!publicKey) return;

    let totalValue = 0;
    let html = '';

    for (const [symbol, balance] of Object.entries(tokenBalances)) {
        if (balance <= 0) continue;

        const token = TOKENS[symbol];
        if (!token) continue;

        const price = currentPrices[symbol] || 0;
        const value = balance * price;
        totalValue += value;

        html += `
            <div class="token-item" data-symbol="${symbol}">
                <div class="token-icon">${token.logo}</div>
                <div class="token-info">
                    <div class="token-name">${token.name}</div>
                    <div class="token-symbol">${symbol}</div>
                </div>
                <div class="token-value">
                    <div class="token-amount-display">${formatNumber(balance, 4)}</div>
                    <div class="token-usd">$${formatNumber(value)}</div>
                </div>
            </div>
        `;
    }

    elements.portfolioTotal.textContent = '$' + formatNumber(totalValue);
    elements.tokenList.innerHTML = html || '<div class="empty-state">No tokens found</div>';
}

// ============================================
// REAL SWAP (JUPITER)
// ============================================

let selectingToken = null;

function setupSwap(elements) {
    elements.fromTokenSelect.addEventListener('click', () => openTokenModal(elements, 'from'));
    elements.toTokenSelect.addEventListener('click', () => openTokenModal(elements, 'to'));

    const debouncedQuote = debounce(() => getQuote(elements), 500);
    elements.fromAmount.addEventListener('input', debouncedQuote);

    elements.swapDirection.addEventListener('click', () => {
        const temp = swapState.fromToken;
        swapState.fromToken = swapState.toToken;
        swapState.toToken = temp;

        elements.fromTokenSymbol.textContent = swapState.fromToken.symbol;
        elements.toTokenSymbol.textContent = swapState.toToken.symbol;

        const tempAmount = elements.fromAmount.value;
        elements.fromAmount.value = elements.toAmount.value;
        elements.toAmount.value = tempAmount;

        updateSwapBalance(elements);
        if (elements.fromAmount.value) getQuote(elements);
    });

    elements.maxBtn.addEventListener('click', () => {
        const balance = tokenBalances[swapState.fromToken.symbol] || 0;
        const maxAmount = swapState.fromToken.symbol === 'SOL' ? Math.max(0, balance - 0.01) : balance;
        elements.fromAmount.value = maxAmount > 0 ? maxAmount.toFixed(6) : '';
        if (maxAmount > 0) getQuote(elements);
    });

    elements.swapBtn.addEventListener('click', () => executeSwap(elements));
}

function updateSwapBalance(elements) {
    const balance = tokenBalances[swapState.fromToken.symbol] || 0;
    elements.fromBalance.textContent = formatNumber(balance, 6);
}

async function getQuote(elements) {
    const amount = parseFloat(elements.fromAmount.value);

    if (!amount || amount <= 0 || isNaN(amount)) {
        elements.toAmount.value = '';
        elements.swapInfo.style.display = 'none';
        elements.swapBtn.disabled = true;
        elements.swapBtn.textContent = 'Enter an amount';
        currentQuote = null;
        return;
    }

    const fromToken = swapState.fromToken;
    const toToken = swapState.toToken;

    if (fromToken.mint === toToken.mint) {
        showToast('Cannot swap same token', 'error');
        return;
    }

    try {
        elements.swapBtn.disabled = true;
        elements.swapBtn.textContent = 'Fetching quote...';

        const inputAmount = Math.floor(amount * Math.pow(10, fromToken.decimals));

        const response = await fetch(
            `${JUPITER_API}/quote?inputMint=${fromToken.mint}&outputMint=${toToken.mint}&amount=${inputAmount}&slippageBps=50`
        );

        if (!response.ok) throw new Error('Quote request failed');

        const quote = await response.json();
        if (quote.error) throw new Error(quote.error);

        currentQuote = quote;

        const outAmount = quote.outAmount / Math.pow(10, toToken.decimals);
        elements.toAmount.value = formatPrice(outAmount);

        elements.swapInfo.style.display = 'block';
        elements.swapRate.textContent = `1 ${fromToken.symbol} = ${formatPrice(outAmount / amount)} ${toToken.symbol}`;
        elements.priceImpact.textContent = ((quote.priceImpactPct || 0) * 100).toFixed(3) + '%';

        const minOut = outAmount * 0.995;
        elements.minReceived.textContent = formatPrice(minOut) + ' ' + toToken.symbol;

        const balance = tokenBalances[fromToken.symbol] || 0;
        if (!publicKey) {
            elements.swapBtn.disabled = true;
            elements.swapBtn.textContent = 'Connect wallet';
        } else if (amount > balance) {
            elements.swapBtn.disabled = true;
            elements.swapBtn.textContent = 'Insufficient balance';
        } else {
            elements.swapBtn.disabled = false;
            elements.swapBtn.textContent = 'Swap';
        }

    } catch (err) {
        console.warn('Quote error, using estimate:', err.message);

        // Simulated quote fallback if API fails
        const fromPrice = currentPrices[fromToken.symbol] || 0;
        const toPrice = currentPrices[toToken.symbol] || 1;

        if (fromPrice && toPrice) {
            const outAmount = (amount * fromPrice) / toPrice;
            elements.toAmount.value = formatPrice(outAmount);

            elements.swapInfo.style.display = 'block';
            elements.swapRate.textContent = `1 ${fromToken.symbol} ~ ${formatPrice(fromPrice / toPrice)} ${toToken.symbol} (est.)`;
            elements.priceImpact.textContent = '~0.10%';
            elements.minReceived.textContent = formatPrice(outAmount * 0.995) + ' ' + toToken.symbol;

            const balance = tokenBalances[fromToken.symbol] || 0;
            if (!publicKey) {
                elements.swapBtn.disabled = true;
                elements.swapBtn.textContent = 'Connect wallet';
            } else if (amount > balance) {
                elements.swapBtn.disabled = true;
                elements.swapBtn.textContent = 'Insufficient balance';
            } else {
                elements.swapBtn.disabled = false;
                elements.swapBtn.textContent = 'Swap';
            }
        } else {
            elements.toAmount.value = '';
            elements.swapInfo.style.display = 'none';
            elements.swapBtn.disabled = true;
            elements.swapBtn.textContent = 'Unable to get quote';
        }

        currentQuote = null;
    }
}

async function executeSwap(elements) {
    if (!publicKey || !wallet) {
        showToast('Please connect wallet first', 'error');
        return;
    }

    if (!currentQuote) {
        showToast('Please get a quote first', 'error');
        return;
    }

    try {
        elements.swapBtn.disabled = true;
        elements.swapBtn.textContent = 'Preparing...';

        const response = await fetch(`${JUPITER_API}/swap`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                quoteResponse: currentQuote,
                userPublicKey: publicKey,
                wrapAndUnwrapSol: true
            })
        });

        if (!response.ok) throw new Error('Failed to get swap transaction');

        const { swapTransaction } = await response.json();

        elements.swapBtn.textContent = 'Confirm in wallet...';

        const swapTransactionBuf = Uint8Array.from(atob(swapTransaction), c => c.charCodeAt(0));
        const transaction = solanaWeb3.VersionedTransaction.deserialize(swapTransactionBuf);

        const signedTx = await wallet.signTransaction(transaction);

        elements.swapBtn.textContent = 'Sending...';

        const connection = new solanaWeb3.Connection(HELIUS_RPC);
        const txid = await connection.sendRawTransaction(signedTx.serialize(), {
            skipPreflight: true,
            maxRetries: 2
        });

        elements.swapBtn.textContent = 'Confirming...';

        await connection.confirmTransaction(txid, 'confirmed');

        showToast('Swap successful!', 'success');

        // Post swap activity to feed
        const fromSymbol = swapState.fromToken.symbol;
        const toSymbol = swapState.toToken.symbol;
        const fromAmt = elements.fromAmount.value;
        const toAmt = elements.toAmount.value;

        const swapPost = {
            id: Date.now(),
            wallet_address: publicKey,
            author_name: shortenAddress(publicKey),
            author_handle: '@' + publicKey.slice(0, 8),
            content: `Just swapped ${fromAmt} $${fromSymbol} for ${toAmt} $${toSymbol}`,
            likes: 0,
            reposts: 0,
            liked_by: [],
            reposted_by: [],
            created_at: new Date().toISOString()
        };

        posts.unshift(swapPost);
        if (supabaseClient) {
            await supabaseClient.from('posts').insert([swapPost]);
        }
        localStorage.setItem('degen_posts', JSON.stringify(posts.slice(0, 100)));
        renderFeed(elements);

        // Reset
        elements.fromAmount.value = '';
        elements.toAmount.value = '';
        elements.swapInfo.style.display = 'none';
        currentQuote = null;

        await fetchRealBalances();
        updatePortfolio(elements);
        updateSwapBalance(elements);

        elements.swapBtn.disabled = true;
        elements.swapBtn.textContent = 'Enter an amount';

    } catch (err) {
        console.error('Swap error:', err);
        showToast(err.message || 'Swap failed', 'error');
        elements.swapBtn.disabled = false;
        elements.swapBtn.textContent = 'Swap';
    }
}

// ============================================
// TOKEN MODAL
// ============================================

function setupTokenModal(elements) {
    elements.closeTokenModal.addEventListener('click', () => closeTokenModal(elements));
    elements.tokenModal.querySelector('.modal-overlay').addEventListener('click', () => closeTokenModal(elements));
    elements.tokenSearchInput.addEventListener('input', (e) => renderTokenList(elements, e.target.value));

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeTokenModal(elements);
    });
}

function openTokenModal(elements, type) {
    selectingToken = type;
    elements.tokenModal.classList.add('active');
    elements.tokenSearchInput.value = '';
    elements.tokenSearchInput.focus();
    renderTokenList(elements, '');
}

function closeTokenModal(elements) {
    elements.tokenModal.classList.remove('active');
    selectingToken = null;
}

function renderTokenList(elements, filter) {
    const filterLower = (filter || '').toLowerCase();

    elements.popularTokens.innerHTML = Object.values(TOKENS)
        .slice(0, 5)
        .map(token => `<div class="token-chip" data-mint="${token.mint}">${token.symbol}</div>`)
        .join('');

    const filtered = Object.values(TOKENS).filter(token =>
        token.symbol.toLowerCase().includes(filterLower) ||
        token.name.toLowerCase().includes(filterLower) ||
        token.mint.toLowerCase().includes(filterLower)
    );

    elements.tokenResults.innerHTML = filtered.map(token => `
        <div class="token-result-item" data-mint="${token.mint}">
            <div class="token-result-icon">${token.logo}</div>
            <div class="token-result-info">
                <div class="token-result-name">${token.name}</div>
                <div class="token-result-symbol">${token.symbol}</div>
            </div>
            <div class="token-result-price">$${formatPrice(currentPrices[token.symbol] || 0)}</div>
        </div>
    `).join('');

    document.querySelectorAll('.token-chip, .token-result-item').forEach(el => {
        el.addEventListener('click', () => selectToken(elements, el.dataset.mint));
    });
}

function selectToken(elements, mint) {
    const token = Object.values(TOKENS).find(t => t.mint === mint);
    if (!token) return;

    if (selectingToken === 'from') {
        swapState.fromToken = token;
        elements.fromTokenSymbol.textContent = token.symbol;
        updateSwapBalance(elements);
    } else {
        swapState.toToken = token;
        elements.toTokenSymbol.textContent = token.symbol;
    }

    closeTokenModal(elements);
    if (elements.fromAmount.value) getQuote(elements);
}

// ============================================
// TOKEN SCANNER (DEXSCREENER API)
// ============================================

const DEXSCREENER_API = 'https://api.dexscreener.com/latest/dex';

let currentScanToken = null;

function setupScanner() {
    const scannerInput = document.getElementById('scannerInput');
    const scanBtn = document.getElementById('scanBtn');
    const copyContract = document.getElementById('copyContract');
    const quickBuyBtn = document.getElementById('quickBuyBtn');

    if (!scannerInput || !scanBtn) return;

    // Scan button click
    scanBtn.addEventListener('click', () => {
        const address = scannerInput.value.trim();
        if (address) scanToken(address);
    });

    // Enter key to scan
    scannerInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const address = scannerInput.value.trim();
            if (address) scanToken(address);
        }
    });

    // Example token buttons
    document.querySelectorAll('.example-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const mint = btn.dataset.mint;
            scannerInput.value = mint;
            scanToken(mint);
        });
    });

    // Copy contract button
    if (copyContract) {
        copyContract.addEventListener('click', () => {
            if (currentScanToken) {
                navigator.clipboard.writeText(currentScanToken.baseToken?.address || '');
                showToast('Contract copied!', 'success');
            }
        });
    }

    // Quick buy button - opens Axiom with the token
    if (quickBuyBtn) {
        quickBuyBtn.addEventListener('click', () => {
            if (currentScanToken) {
                const mint = currentScanToken.baseToken?.address;
                if (mint) {
                    window.open(`https://axiom.trade/t/${mint}`, '_blank');
                }
            }
        });
    }
}

async function scanToken(address) {
    const loading = document.getElementById('scannerLoading');
    const result = document.getElementById('scannerResult');
    const empty = document.getElementById('scannerEmpty');

    // Validate address format
    if (!address || address.length < 32) {
        showToast('Invalid token address', 'error');
        return;
    }

    // Show loading
    loading.style.display = 'flex';
    result.style.display = 'none';
    empty.style.display = 'none';

    try {
        // Fetch token data from DexScreener
        const response = await fetch(`${DEXSCREENER_API}/tokens/${address}`);

        if (!response.ok) throw new Error('Token not found');

        const data = await response.json();

        if (!data.pairs || data.pairs.length === 0) {
            throw new Error('No trading pairs found for this token');
        }

        // Get the pair with highest liquidity
        const pair = data.pairs.reduce((best, current) => {
            const currentLiq = current.liquidity?.usd || 0;
            const bestLiq = best.liquidity?.usd || 0;
            return currentLiq > bestLiq ? current : best;
        }, data.pairs[0]);

        currentScanToken = pair;

        // Update UI
        renderScannerResult(pair);

        loading.style.display = 'none';
        result.style.display = 'block';

        console.log('✓ Token scanned:', pair);

    } catch (err) {
        console.error('Scan error:', err);
        loading.style.display = 'none';
        empty.style.display = 'block';
        showToast(err.message || 'Failed to scan token', 'error');
    }
}

function renderScannerResult(pair) {
    const token = pair.baseToken;
    const quoteToken = pair.quoteToken;

    // Token Header
    const tokenLogo = document.getElementById('tokenLogo');
    const tokenName = document.getElementById('tokenName');
    const tokenSymbol = document.getElementById('tokenSymbol');
    const tokenBadges = document.getElementById('tokenBadges');

    if (token.logoURI) {
        tokenLogo.innerHTML = `<img src="${token.logoURI}" alt="${token.symbol}" onerror="this.parentElement.textContent='${(token.symbol || '?').slice(0, 2)}'">`;
    } else {
        tokenLogo.textContent = (token.symbol || '?').slice(0, 2).toUpperCase();
    }

    tokenName.textContent = token.name || 'Unknown Token';
    tokenSymbol.textContent = `$${token.symbol || '???'}`;

    // Badges
    let badgesHtml = '';

    // Check if it's a Pump.fun token (they often have specific patterns)
    if (pair.url && pair.url.includes('pump.fun')) {
        badgesHtml += '<span class="token-badge pump">🚀 Pump.fun</span>';
    }

    // Check pair age for "New" badge (< 24 hours)
    if (pair.pairCreatedAt) {
        const ageHours = (Date.now() - pair.pairCreatedAt) / (1000 * 60 * 60);
        if (ageHours < 24) {
            badgesHtml += '<span class="token-badge new">🆕 New</span>';
        }
    }

    tokenBadges.innerHTML = badgesHtml;

    // Price
    const price = parseFloat(pair.priceUsd) || 0;
    const priceChange = parseFloat(pair.priceChange?.h24) || 0;

    document.getElementById('scannerPrice').textContent = '$' + formatScannerPrice(price);

    const priceChangeBadge = document.getElementById('scannerPriceChange');
    priceChangeBadge.textContent = (priceChange >= 0 ? '+' : '') + priceChange.toFixed(2) + '%';
    priceChangeBadge.className = 'price-change-badge ' + (priceChange >= 0 ? 'positive' : 'negative');

    // Stats
    document.getElementById('scannerMcap').textContent = '$' + formatLargeNumber(pair.marketCap || pair.fdv || 0);
    document.getElementById('scannerVolume').textContent = '$' + formatLargeNumber(pair.volume?.h24 || 0);
    document.getElementById('scannerLiquidity').textContent = '$' + formatLargeNumber(pair.liquidity?.usd || 0);
    document.getElementById('scannerFdv').textContent = '$' + formatLargeNumber(pair.fdv || 0);

    // Token Info
    document.getElementById('scannerContract').textContent = shortenAddress(token.address);
    document.getElementById('scannerDex').textContent = pair.dexId?.toUpperCase() || 'Unknown DEX';

    // Pair Age
    if (pair.pairCreatedAt) {
        document.getElementById('scannerAge').textContent = formatPairAge(pair.pairCreatedAt);
    } else {
        document.getElementById('scannerAge').textContent = 'Unknown';
    }

    // Transactions
    const txns = (pair.txns?.h24?.buys || 0) + (pair.txns?.h24?.sells || 0);
    document.getElementById('scannerTxns').textContent = formatNumber(txns, 0);

    // Chart - Embed DexScreener chart
    const chartIframe = document.getElementById('dexscreenerChart');
    if (pair.chainId && pair.pairAddress) {
        chartIframe.src = `https://dexscreener.com/${pair.chainId}/${pair.pairAddress}?embed=1&theme=dark&trades=0&info=0`;
    }

    // External Links
    document.getElementById('dexScreenerLink').href = pair.url || `https://dexscreener.com/solana/${token.address}`;
    document.getElementById('birdeyeLink').href = `https://birdeye.so/token/${token.address}?chain=solana`;

    // Holder info - using estimates from DexScreener data if available
    // DexScreener doesn't provide holder data directly, so we'll show what we have
    document.getElementById('top10Hold').textContent = '-';
    document.getElementById('holderCount').textContent = '-';
}

function formatScannerPrice(price) {
    if (!price || isNaN(price)) return '0.00';
    if (price < 0.00000001) return price.toExponential(2);
    if (price < 0.0001) return price.toFixed(8);
    if (price < 0.01) return price.toFixed(6);
    if (price < 1) return price.toFixed(4);
    if (price < 100) return price.toFixed(2);
    return price.toFixed(2);
}

function formatLargeNumber(num) {
    if (!num || isNaN(num)) return '0';
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num.toFixed(2);
}

function formatPairAge(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    const months = Math.floor(days / 30);

    if (months > 0) return months + ' month' + (months > 1 ? 's' : '');
    if (days > 0) return days + ' day' + (days > 1 ? 's' : '');
    if (hours > 0) return hours + ' hour' + (hours > 1 ? 's' : '');
    return 'Just now';
}

// ============================================
// WALLETS VIEW (KOL TRACKING)
// ============================================

const sampleLeaderboard = [
    { wallet: '7xKX...9mP4', pnl: '+$847,231', positive: true },
    { wallet: '3nJR...kL2s', pnl: '+$523,412', positive: true },
    { wallet: 'Hq5T...vW8n', pnl: '+$412,891', positive: true },
    { wallet: '9pLm...xK3j', pnl: '+$298,445', positive: true },
    { wallet: '2wQr...bN7h', pnl: '+$187,329', positive: true },
    { wallet: 'Ks4X...mP9v', pnl: '+$156,782', positive: true },
    { wallet: '8jTy...cR2q', pnl: '+$134,567', positive: true },
    { wallet: 'Xn3L...hK8w', pnl: '+$98,234', positive: true },
    { wallet: '5mRt...pV4s', pnl: '+$76,543', positive: true },
    { wallet: 'Bw7J...nL6x', pnl: '+$54,321', positive: true }
];

const sampleWhaleTrades = [
    { type: 'buy', token: 'BONK', amount: '142,500 SOL', time: '2m ago' },
    { type: 'sell', token: 'WIF', amount: '89,200 SOL', time: '5m ago' },
    { type: 'buy', token: 'POPCAT', amount: '67,800 SOL', time: '8m ago' },
    { type: 'buy', token: 'MEW', amount: '45,000 SOL', time: '12m ago' },
    { type: 'sell', token: 'MYRO', amount: '32,100 SOL', time: '15m ago' }
];

let trackedWallets = [];

function setupWallets() {
    const leaderboardList = document.getElementById('leaderboardList');
    const whaleTradesList = document.getElementById('whaleTradesList');
    const addWalletBtn = document.getElementById('addWalletBtn');
    const walletAddressInput = document.getElementById('walletAddressInput');

    if (!leaderboardList) return;

    // Render leaderboard
    leaderboardList.innerHTML = sampleLeaderboard.map((item, index) => `
        <div class="leaderboard-item">
            <div class="leaderboard-rank">${index + 1}</div>
            <div class="leaderboard-wallet">${item.wallet}</div>
            <div class="leaderboard-pnl ${item.positive ? 'positive' : 'negative'}">${item.pnl}</div>
        </div>
    `).join('');

    // Render whale trades
    if (whaleTradesList) {
        whaleTradesList.innerHTML = sampleWhaleTrades.map(trade => `
            <div class="whale-trade-item">
                <span class="whale-trade-type ${trade.type}">${trade.type.toUpperCase()}</span>
                <span class="whale-trade-token">${trade.token}</span>
                <span class="whale-trade-amount">${trade.amount}</span>
                <span class="whale-trade-time">${trade.time}</span>
            </div>
        `).join('');
    }

    // Add wallet tracking
    if (addWalletBtn && walletAddressInput) {
        addWalletBtn.addEventListener('click', () => {
            const address = walletAddressInput.value.trim();
            if (address && address.length >= 32) {
                trackWallet(address);
                walletAddressInput.value = '';
            } else {
                showToast('Invalid wallet address', 'error');
            }
        });
    }

    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            // In real app, would fetch data for the selected period
        });
    });
}

function trackWallet(address) {
    const shortened = address.slice(0, 4) + '...' + address.slice(-4);

    // Check if already tracking
    if (trackedWallets.some(w => w.address === address)) {
        showToast('Already tracking this wallet', 'error');
        return;
    }

    trackedWallets.push({ address, shortened, loading: true, trades: [] });
    renderTrackedWallets();

    // Fetch wallet transactions
    fetchWalletTransactions(address);

    showToast('Wallet added to tracking', 'success');
}

async function fetchWalletTransactions(address) {
    try {
        // Use Helius API to get transaction history
        const response = await fetch(HELIUS_RPC, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jsonrpc: '2.0',
                id: 'wallet-txns',
                method: 'getSignaturesForAddress',
                params: [address, { limit: 20 }]
            })
        });

        const data = await response.json();

        if (data.result && data.result.length > 0) {
            // Parse transactions
            const trades = await Promise.all(
                data.result.slice(0, 10).map(async (tx) => {
                    return {
                        signature: tx.signature,
                        time: new Date(tx.blockTime * 1000).toLocaleString(),
                        status: tx.confirmationStatus
                    };
                })
            );

            // Update the tracked wallet with trades
            const walletIndex = trackedWallets.findIndex(w => w.address === address);
            if (walletIndex !== -1) {
                trackedWallets[walletIndex].loading = false;
                trackedWallets[walletIndex].trades = trades;
                trackedWallets[walletIndex].txCount = data.result.length;
            }

            renderTrackedWallets();
        }
    } catch (err) {
        console.error('Failed to fetch wallet transactions:', err);
        const walletIndex = trackedWallets.findIndex(w => w.address === address);
        if (walletIndex !== -1) {
            trackedWallets[walletIndex].loading = false;
            trackedWallets[walletIndex].error = true;
        }
        renderTrackedWallets();
    }
}

function renderTrackedWallets() {
    const trackedList = document.getElementById('trackedWalletsList');
    if (!trackedList) return;

    if (trackedWallets.length === 0) {
        trackedList.innerHTML = '<div class="empty-state">No wallets tracked yet</div>';
        return;
    }

    trackedList.innerHTML = trackedWallets.map(w => `
        <div class="tracked-wallet-item">
            <div class="tracked-wallet-header">
                <div class="tracked-wallet-address">${w.shortened}</div>
                <button class="remove-wallet-btn" onclick="removeTrackedWallet('${w.address}')">×</button>
            </div>
            <div class="tracked-wallet-stats">
                ${w.loading ? '<span class="loading-text">Loading...</span>' :
            w.error ? '<span class="error-text">Failed to load</span>' :
                `<span class="tx-count">${w.txCount || 0} txns</span>`
        }
            </div>
            ${w.trades && w.trades.length > 0 ? `
                <div class="recent-trades">
                    ${w.trades.slice(0, 3).map(t => `
                        <div class="trade-item">
                            <span class="trade-sig">${t.signature.slice(0, 8)}...</span>
                            <span class="trade-time">${t.time}</span>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
        </div>
    `).join('');
}

function removeTrackedWallet(address) {
    trackedWallets = trackedWallets.filter(w => w.address !== address);
    renderTrackedWallets();
    showToast('Wallet removed', 'success');
}

// ============================================
// TERMINAL VIEW (TRADING)
// ============================================

let terminalState = {
    tradeType: 'buy',
    amount: 1,
    slippage: 5,
    tokenMint: null
};

function setupTerminal() {
    const tradeTabs = document.querySelectorAll('.trade-tab');
    const presetBtns = document.querySelectorAll('.preset-btn');
    const slippageBtns = document.querySelectorAll('.slippage-btn');
    const executeBtn = document.getElementById('executeTradeBtn');
    const tokenInput = document.getElementById('terminalTokenInput');

    if (!tradeTabs.length) return;

    // Trade type tabs
    tradeTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tradeTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            terminalState.tradeType = tab.dataset.type;

            // Update execute button color
            if (executeBtn) {
                if (terminalState.tradeType === 'sell') {
                    executeBtn.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';
                } else {
                    executeBtn.style.background = 'linear-gradient(135deg, #10b981, #059669)';
                }
            }
        });
    });

    // Amount presets
    presetBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            presetBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            terminalState.amount = parseFloat(btn.dataset.amount);
        });
    });

    // Slippage options
    slippageBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            slippageBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            terminalState.slippage = parseInt(btn.dataset.slip);
            fetchTradeQuote(); // Refresh quote with new slippage
        });
    });

    // Token input - fetch info when pasted
    if (tokenInput) {
        tokenInput.addEventListener('change', async () => {
            const mint = tokenInput.value.trim();
            if (mint && mint.length >= 32) {
                terminalState.tokenMint = mint;
                await fetchTerminalTokenInfo(mint);

                // Show chart
                const chartContainer = document.getElementById('terminalChart');
                const chartFrame = document.getElementById('terminalChartFrame');
                if (chartContainer && chartFrame) {
                    chartContainer.style.display = 'block';
                    chartFrame.src = `https://dexscreener.com/solana/${mint}?embed=1&theme=dark&trades=0&info=0`;
                }

                // Get quote
                fetchTradeQuote();
            }
        });
    }

    // Execute trade button - NOW BUILT-IN
    if (executeBtn) {
        executeBtn.addEventListener('click', () => {
            if (!publicKey) {
                showToast('Connect wallet first', 'error');
                return;
            }

            if (!terminalState.tokenMint) {
                showToast('Enter a token address', 'error');
                return;
            }

            // Execute trade in-app using Jupiter
            executeTrade();
        });
    }

    // Update button text based on wallet connection
    updateTerminalButton();
}

async function fetchTerminalTokenInfo(mint) {
    const infoContainer = document.getElementById('terminalTokenInfo');
    if (!infoContainer) return;

    try {
        const response = await fetch(`${DEXSCREENER_API}/tokens/${mint}`);
        const data = await response.json();

        if (data.pairs && data.pairs.length > 0) {
            const pair = data.pairs[0];
            const token = pair.baseToken;

            infoContainer.innerHTML = `
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                    <div style="font-weight: 700; font-size: 1.1rem;">${token.name}</div>
                    <div style="color: var(--text-muted);">$${token.symbol}</div>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                    <div>
                        <div style="font-size: 0.75rem; color: var(--text-muted);">Price</div>
                        <div style="font-family: var(--font-mono);">$${formatScannerPrice(parseFloat(pair.priceUsd))}</div>
                    </div>
                    <div>
                        <div style="font-size: 0.75rem; color: var(--text-muted);">24h</div>
                        <div style="color: ${pair.priceChange?.h24 >= 0 ? 'var(--green)' : 'var(--red)'}; font-family: var(--font-mono);">${pair.priceChange?.h24 >= 0 ? '+' : ''}${pair.priceChange?.h24?.toFixed(2) || 0}%</div>
                    </div>
                    <div>
                        <div style="font-size: 0.75rem; color: var(--text-muted);">MCap</div>
                        <div style="font-family: var(--font-mono);">$${formatLargeNumber(pair.marketCap || 0)}</div>
                    </div>
                    <div>
                        <div style="font-size: 0.75rem; color: var(--text-muted);">Liquidity</div>
                        <div style="font-family: var(--font-mono);">$${formatLargeNumber(pair.liquidity?.usd || 0)}</div>
                    </div>
                </div>
            `;
        }
    } catch (err) {
        console.error('Failed to fetch token info:', err);
    }
}

function updateTerminalButton() {
    const executeBtn = document.getElementById('executeTradeBtn');
    if (executeBtn) {
        if (publicKey) {
            executeBtn.textContent = `${terminalState.tradeType.toUpperCase()} on Axiom`;
        } else {
            executeBtn.textContent = 'Connect Wallet to Trade';
        }
    }
}

// ============================================
// PULSE VIEW (TOKEN DISCOVERY)
// ============================================

let pulseTokens = [];
let currentPulseFilter = 'new';

async function setupPulse() {
    const pulseTabs = document.querySelectorAll('.pulse-tab');

    if (!pulseTabs.length) return;

    // Tab switching
    pulseTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            pulseTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentPulseFilter = tab.dataset.filter;
            loadPulseTokens(currentPulseFilter);
        });
    });

    // Initial load
    loadPulseTokens('new');
}

async function loadPulseTokens(filter) {
    const loading = document.getElementById('pulseLoading');
    const list = document.getElementById('pulseList');

    if (!list) return;

    if (loading) loading.style.display = 'flex';
    list.innerHTML = '';

    try {
        // Use DexScreener search API for Solana tokens
        let searchQuery = '';

        if (filter === 'new') {
            // Search for new pump.fun tokens
            searchQuery = 'pump';
        } else if (filter === 'trending') {
            // Search for popular memecoins
            searchQuery = 'bonk wif popcat';
        } else {
            // Graduated - high volume tokens
            searchQuery = 'jup ray jito';
        }

        const response = await fetch(`https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(searchQuery)}`);
        const data = await response.json();

        let tokens = [];

        if (data.pairs && data.pairs.length > 0) {
            // Get unique tokens from pairs (Solana only)
            const seen = new Set();
            tokens = data.pairs
                .filter(p => {
                    if (p.chainId !== 'solana' || !p.baseToken) return false;
                    if (seen.has(p.baseToken.address)) return false;
                    seen.add(p.baseToken.address);
                    return true;
                })
                .slice(0, 15)
                .map(p => ({
                    address: p.baseToken.address,
                    name: p.baseToken.name || 'Unknown',
                    symbol: p.baseToken.symbol || '???',
                    priceUsd: parseFloat(p.priceUsd) || 0,
                    priceChange: p.priceChange?.h24 || 0,
                    volume: p.volume?.h24 || 0,
                    liquidity: p.liquidity?.usd || 0,
                    marketCap: p.marketCap || 0,
                    pairAddress: p.pairAddress,
                    txns: (p.txns?.h24?.buys || 0) + (p.txns?.h24?.sells || 0),
                    imageUrl: p.info?.imageUrl || null
                }));
        }

        if (loading) loading.style.display = 'none';

        if (tokens.length === 0) {
            list.innerHTML = '<div class="empty-state">No tokens found</div>';
        } else {
            renderPulseTokens(tokens);
        }

    } catch (err) {
        console.error('Failed to load pulse tokens:', err);
        if (loading) loading.style.display = 'none';
        list.innerHTML = '<div class="empty-state">Failed to load tokens. Try again.</div>';
    }
}

function renderPulseTokens(tokens) {
    const list = document.getElementById('pulseList');
    if (!list) return;

    list.innerHTML = tokens.map(token => {
        const symbol = token.symbol || '???';
        const name = token.name || 'Unknown';
        const price = token.priceUsd ? `$${formatScannerPrice(token.priceUsd)}` : '-';
        const change = token.priceChange || 0;
        const changeClass = change >= 0 ? 'positive' : 'negative';
        const liq = token.liquidity ? `$${formatLargeNumber(token.liquidity)}` : '-';
        const vol = token.volume ? `$${formatLargeNumber(token.volume)}` : '-';
        const address = token.address || '';

        return `
            <div class="pulse-item" data-address="${address}">
                <div class="pulse-item-logo">${symbol.slice(0, 2).toUpperCase()}</div>
                <div class="pulse-item-info">
                    <div class="pulse-item-name">${name}</div>
                    <div class="pulse-item-symbol">$${symbol}</div>
                </div>
                <div class="pulse-item-stats">
                    <div class="pulse-stat">
                        <span class="pulse-stat-label">Price</span>
                        <span class="pulse-stat-value">${price}</span>
                    </div>
                    <div class="pulse-stat">
                        <span class="pulse-stat-label">24h</span>
                        <span class="pulse-stat-value ${changeClass}">${change >= 0 ? '+' : ''}${change.toFixed(1)}%</span>
                    </div>
                    <div class="pulse-stat">
                        <span class="pulse-stat-label">Vol</span>
                        <span class="pulse-stat-value">${vol}</span>
                    </div>
                </div>
                <div class="pulse-item-actions">
                    <button class="pulse-action-btn" onclick="quickBuyToken('${address}')">Buy</button>
                    <button class="pulse-action-btn scan" onclick="scanFromPulse('${address}')">Scan</button>
                </div>
            </div>
        `;
    }).join('');
}

function scanFromPulse(address) {
    // Navigate to scanner and scan the token
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.classList.remove('active');
        if (item.dataset.page === 'scanner') {
            item.classList.add('active');
        }
    });

    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('scannerView')?.classList.add('active');

    // Set the address and scan
    const scannerInput = document.getElementById('scannerInput');
    if (scannerInput) {
        scannerInput.value = address;
        scanToken(address);
    }
}

function quickBuyToken(address) {
    // Navigate to terminal and set the token
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.classList.remove('active');
        if (item.dataset.page === 'terminal') {
            item.classList.add('active');
        }
    });

    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('terminalView')?.classList.add('active');

    // Set the token address
    const tokenInput = document.getElementById('terminalTokenInput');
    if (tokenInput) {
        tokenInput.value = address;
        terminalState.tokenMint = address;
        fetchTerminalTokenInfo(address);
        fetchTradeQuote();
    }
}

// ============================================
// ENHANCED TERMINAL (BUILT-IN TRADING)
// ============================================

async function fetchTradeQuote() {
    if (!terminalState.tokenMint || !terminalState.amount) return;

    const quoteEl = document.getElementById('tradeQuote');
    const inputEl = document.getElementById('quoteInput');
    const outputEl = document.getElementById('quoteOutput');
    const impactEl = document.getElementById('quotePriceImpact');

    if (!quoteEl) return;

    try {
        const SOL_MINT = 'So11111111111111111111111111111111111111112';
        const amountInLamports = Math.floor(terminalState.amount * 1e9);

        let inputMint, outputMint;
        if (terminalState.tradeType === 'buy') {
            inputMint = SOL_MINT;
            outputMint = terminalState.tokenMint;
        } else {
            inputMint = terminalState.tokenMint;
            outputMint = SOL_MINT;
        }

        const params = new URLSearchParams({
            inputMint,
            outputMint,
            amount: amountInLamports.toString(),
            slippageBps: (terminalState.slippage * 100).toString()
        });

        const response = await fetch(`${JUPITER_API}/quote?${params}`);
        const quote = await response.json();

        if (quote && quote.outAmount) {
            currentQuote = quote;
            quoteEl.style.display = 'block';

            inputEl.textContent = `${terminalState.amount} SOL`;

            // Calculate output
            const outAmount = parseInt(quote.outAmount);
            // For display, we need to know decimals - assume 6 for most memecoins
            const outputFormatted = (outAmount / 1e6).toLocaleString(undefined, { maximumFractionDigits: 2 });
            outputEl.textContent = `${outputFormatted} TOKENS`;

            const priceImpact = quote.priceImpactPct ? (quote.priceImpactPct * 100).toFixed(2) : '0';
            impactEl.textContent = `${priceImpact}%`;
            impactEl.style.color = parseFloat(priceImpact) > 5 ? 'var(--red)' : 'var(--text-primary)';
        }
    } catch (err) {
        console.error('Failed to fetch quote:', err);
    }
}

async function executeTrade() {
    if (!publicKey) {
        showToast('Connect wallet first', 'error');
        return;
    }

    if (!currentQuote) {
        showToast('No quote available', 'error');
        return;
    }

    const statusEl = document.getElementById('tradeStatus');
    const messageEl = document.getElementById('statusMessage');
    const executeBtn = document.getElementById('executeTradeBtn');

    if (!statusEl || !messageEl) return;

    try {
        statusEl.style.display = 'block';
        statusEl.className = 'trade-status pending';
        messageEl.textContent = 'Getting swap transaction...';
        executeBtn.disabled = true;

        // Get swap transaction from Jupiter
        const swapResponse = await fetch(`${JUPITER_API}/swap`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                quoteResponse: currentQuote,
                userPublicKey: publicKey,
                wrapAndUnwrapSol: true,
                dynamicComputeUnitLimit: true,
                prioritizationFeeLamports: 'auto'
            })
        });

        const swapData = await swapResponse.json();

        if (swapData.error) {
            throw new Error(swapData.error);
        }

        messageEl.textContent = 'Please approve transaction in wallet...';

        // Deserialize and sign transaction
        const swapTxBuf = Buffer.from(swapData.swapTransaction, 'base64');
        const tx = solanaWeb3.VersionedTransaction.deserialize(swapTxBuf);

        // Sign with wallet
        const signedTx = await wallet.signTransaction(tx);

        messageEl.textContent = 'Sending transaction...';

        // Send transaction
        const connection = new solanaWeb3.Connection(HELIUS_RPC, 'confirmed');
        const signature = await connection.sendRawTransaction(signedTx.serialize(), {
            skipPreflight: true,
            maxRetries: 3
        });

        messageEl.textContent = 'Confirming transaction...';

        // Confirm
        await connection.confirmTransaction(signature, 'confirmed');

        statusEl.className = 'trade-status success';
        messageEl.textContent = `Trade successful! TX: ${signature.slice(0, 8)}...`;

        showToast('Trade executed successfully!', 'success');

        // Reset after 5 seconds
        setTimeout(() => {
            statusEl.style.display = 'none';
            executeBtn.disabled = false;
        }, 5000);

    } catch (err) {
        console.error('Trade failed:', err);
        statusEl.className = 'trade-status error';
        messageEl.textContent = `Trade failed: ${err.message}`;
        executeBtn.disabled = false;
        showToast('Trade failed', 'error');
    }
}

// ============================================
// QUICK BUY FROM POSTS
// ============================================

// Regex to detect Solana addresses (Base58, 32-44 chars)
const SOLANA_ADDRESS_REGEX = /[1-9A-HJ-NP-Za-km-z]{32,44}/g;

function detectAndAddQuickBuy(postElement, content) {
    const addresses = content.match(SOLANA_ADDRESS_REGEX);

    if (addresses && addresses.length > 0) {
        // Filter to likely token addresses (not common program addresses)
        const tokenAddresses = addresses.filter(addr => {
            // Skip common system addresses
            const systemAddrs = ['11111111111111111111111111111111', 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'];
            return !systemAddrs.some(s => addr.includes(s));
        });

        if (tokenAddresses.length > 0) {
            const addr = tokenAddresses[0];
            const quickBuyEl = document.createElement('div');
            quickBuyEl.className = 'post-ca-detected';
            quickBuyEl.innerHTML = `
                <span class="post-ca-address">${addr.slice(0, 6)}...${addr.slice(-4)}</span>
                <button class="post-quick-buy" onclick="quickBuyToken('${addr}')">Quick Buy</button>
            `;
            postElement.querySelector('.post-body')?.appendChild(quickBuyEl);
        }
    }
}

// ============================================
// AUTHENTICATION SETUP
// ============================================

function setupAuth() {
    const authModal = document.getElementById('authModal');
    const closeAuthBtn = document.getElementById('closeAuthModal');
    const connectWalletBtn = document.getElementById('connectWallet');
    const authTabs = document.querySelectorAll('.auth-tab');
    const signinForm = document.getElementById('signinForm');
    const signupForm = document.getElementById('signupForm');
    const signinBtn = document.getElementById('signinBtn');
    const signupBtn = document.getElementById('signupBtn');
    const googleSignInBtn = document.getElementById('googleSignIn');
    const userDropdown = document.getElementById('userDropdown');
    const logoutBtn = document.getElementById('logoutBtn');

    if (!authModal) return;

    // Open auth modal when connect wallet clicked (if not logged in)
    if (connectWalletBtn) {
        connectWalletBtn.addEventListener('click', () => {
            if (currentUser) {
                // Toggle user dropdown
                userDropdown.style.display = userDropdown.style.display === 'none' ? 'block' : 'none';
            } else {
                authModal.classList.add('active');
            }
        });
    }

    // Close modal
    if (closeAuthBtn) {
        closeAuthBtn.addEventListener('click', () => {
            authModal.classList.remove('active');
        });
    }

    // Close modal on overlay click
    authModal.addEventListener('click', (e) => {
        if (e.target === authModal) {
            authModal.classList.remove('active');
        }
    });

    // Tab switching
    authTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            authTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            if (tab.dataset.tab === 'signin') {
                signinForm.style.display = 'flex';
                signupForm.style.display = 'none';
            } else {
                signinForm.style.display = 'none';
                signupForm.style.display = 'flex';
            }
        });
    });

    // Sign In
    if (signinBtn) {
        signinBtn.addEventListener('click', async () => {
            const email = document.getElementById('signinEmail').value;
            const password = document.getElementById('signinPassword').value;

            if (!email || !password) {
                showToast('Please fill in all fields', 'error');
                return;
            }

            signinBtn.disabled = true;
            signinBtn.textContent = 'Signing in...';

            try {
                const { data, error } = await supabaseClient.auth.signInWithPassword({
                    email,
                    password
                });

                if (error) throw error;

                // UI update handled by auth state listener

            } catch (err) {
                console.error('Sign in error:', err);
                showToast(err.message || 'Sign in failed', 'error');
            } finally {
                signinBtn.disabled = false;
                signinBtn.textContent = 'Sign In';
            }
        });
    }

    // Sign Up
    if (signupBtn) {
        signupBtn.addEventListener('click', async () => {
            const username = document.getElementById('signupUsername').value;
            const email = document.getElementById('signupEmail').value;
            const password = document.getElementById('signupPassword').value;

            if (!username || !email || !password) {
                showToast('Please fill in all fields', 'error');
                return;
            }

            signupBtn.disabled = true;
            signupBtn.textContent = 'Creating account...';

            try {
                const { data, error } = await supabaseClient.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            username: username
                        }
                    }
                });

                if (error) throw error;

                showToast('Account created! Check your email to verify.', 'success');
                authModal.classList.remove('active');

            } catch (err) {
                console.error('Sign up error:', err);
                showToast(err.message || 'Sign up failed', 'error');
            } finally {
                signupBtn.disabled = false;
                signupBtn.textContent = 'Create Account';
            }
        });
    }

    // Google Sign In
    if (googleSignInBtn) {
        googleSignInBtn.addEventListener('click', async () => {
            try {
                const { data, error } = await supabaseClient.auth.signInWithOAuth({
                    provider: 'google',
                    options: {
                        redirectTo: window.location.origin
                    }
                });

                if (error) throw error;

            } catch (err) {
                console.error('Google sign in error:', err);
                showToast('Google sign in failed', 'error');
            }
        });
    }

    // Continue as Guest
    const guestBtn = document.getElementById('continueAsGuest');
    if (guestBtn) {
        guestBtn.addEventListener('click', () => {
            authModal.classList.remove('active');
            localStorage.setItem('degen_guest', 'true');
            showToast('Browsing as guest', 'success');
        });
    }

    // Logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                await supabaseClient.auth.signOut();
                userDropdown.style.display = 'none';
                localStorage.removeItem('degen_guest');
                showToast('Signed out', 'success');
            } catch (err) {
                console.error('Logout error:', err);
            }
        });
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (userDropdown && !userDropdown.contains(e.target) && !connectWalletBtn?.contains(e.target)) {
            userDropdown.style.display = 'none';
        }
    });

    // Don't auto-show auth modal - let users browse freely
    // They can click "Connect" to sign in if they want
}

// Handle App Initialization
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        startApp();
        setupScanner();
        setupWallets();
        setupTerminal();
        setupPulse();
        setupAuth();
    });
} else {
    startApp();
    setupScanner();
    setupWallets();
    setupTerminal();
    setupPulse();
    setupAuth();
}
