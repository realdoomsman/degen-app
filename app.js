// DEGEN - Crypto Social with Real Data Integration
// =================================================

// Configuration - Supabase Project: soltag (mvglowfvayvpqsfbortv)
const SUPABASE_URL = 'https://mvglowfvayvpqsfbortv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12Z2xvd2Z2YXl2cHFzZmJvcnR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ5ODEyNTgsImV4cCI6MjA4MDU1NzI1OH0.AMt0qkySg8amOyrBbypFZnrRaEPbIrpmMYGGMxksPks';

const JUPITER_API = 'https://quote-api.jup.ag/v6';
const JUPITER_PRICE_API = 'https://price.jup.ag/v6';
const HELIUS_RPC = 'https://mainnet.helius-rpc.com/?api-key=15319bf4-5b40-4958-ac8d-6313aa55eb92';

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
    SOL: 198.50,
    USDC: 1.00,
    USDT: 1.00,
    BONK: 0.00003,
    WIF: 2.45,
    JUP: 1.12
};
let posts = [];
let supabase = null;

let swapState = {
    fromToken: TOKENS.SOL,
    toToken: TOKENS.USDC
};

// Initialize Supabase client
function initSupabase() {
    if (typeof window.supabase !== 'undefined') {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('Supabase initialized');
        return true;
    }
    console.warn('Supabase SDK not loaded');
    return false;
}

// Robust initialization
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startApp);
} else {
    startApp();
}

function startApp() {
    initSupabase();
    initializeApp();
}

function initializeApp() {
    const elements = getElements();
    window.appElements = elements;

    setupNavigation(elements);
    setupWalletConnection(elements);
    setupFeed(elements);
    setupSwap(elements);
    setupTokenModal(elements);

    // Load real data
    loadPosts(elements);
    fetchRealPrices(elements);
    renderTokenList(elements, '');
    renderTrendingTokens(elements);

    // Refresh data periodically
    setInterval(() => fetchRealPrices(elements), 15000);
    setInterval(() => loadPosts(elements), 30000);

    console.log('DEGEN app initialized with real data');
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
        navItems: document.querySelectorAll('.nav-item'),
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
            const page = item.dataset.page;

            elements.navItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            elements.views.forEach(view => view.classList.remove('active'));
            const targetView = document.getElementById(`${page}View`);
            if (targetView) targetView.classList.add('active');
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
        if (supabase) {
            const { data, error } = await supabase
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
        if (supabase) {
            // Save to Supabase
            const { data, error } = await supabase
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
    if (!supabase) return;

    try {
        await supabase
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
// REAL PRICES (JUPITER API)
// ============================================

async function fetchRealPrices(elements) {
    try {
        const mints = Object.values(TOKENS).map(t => t.mint).join(',');
        const response = await fetch(`${JUPITER_PRICE_API}/price?ids=${mints}`);

        if (!response.ok) throw new Error('Price API failed');

        const data = await response.json();

        // Update prices from API
        for (const [symbol, token] of Object.entries(TOKENS)) {
            const priceInfo = data.data?.[token.mint];
            if (priceInfo && priceInfo.price) {
                currentPrices[symbol] = priceInfo.price;
            }
        }

        console.log('Real prices fetched:', currentPrices);
        renderPrices(elements);
        renderTrending(elements);

        if (publicKey) {
            updatePortfolio(elements);
        }

    } catch (err) {
        console.warn('Price fetch failed, using fallback data:', err.message);
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
        if (supabase) {
            await supabase.from('posts').insert([swapPost]);
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
