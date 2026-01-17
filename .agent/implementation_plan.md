# DEGEN - All-in-One Memecoin Platform

## Vision
A complete memecoin trading platform combining:
- Social feed (like Twitter/CT)
- Trading terminal (like Axiom)
- Wallet tracking (like KOLscan)
- Group chats (like Telegram)
- Token discovery (like Pump.fun/Axiom Pulse)

## Features to Build

### Phase 1: Core Trading (Priority)
- [x] Token Scanner with DexScreener
- [ ] **Built-in Swap** - Use Jupiter API directly, not external link
- [ ] **Quick Buy from Posts** - Detect CA in posts, show inline buy button
- [ ] **Token Discovery (Pulse)** - Live feed of new/trending tokens

### Phase 2: Wallet & Tracking
- [ ] **Real Wallet Tracking** - Use Helius/DexScreener to track wallet trades
- [ ] **PnL Calculation** - Calculate profit/loss for tracked wallets
- [ ] **Copy Trade Alerts** - Get notified when tracked wallet trades

### Phase 3: Auth & Accounts
- [ ] **Supabase Auth** - Email/Google login
- [ ] **User Profiles** - Username, avatar, bio
- [ ] **Multi-Wallet** - Connect multiple wallets per account
- [ ] **Embedded Wallets** - Create wallets within app (requires careful security)

### Phase 4: Social Features
- [ ] **Group Chats** - Real-time chat rooms
- [ ] **Direct Messages** - Private messaging
- [ ] **Token Channels** - Chat rooms per token

## Technical Stack
- **Frontend**: Vanilla JS (current)
- **Backend/DB**: Supabase (already integrated)
- **Auth**: Supabase Auth (email, Google, wallet)
- **On-chain**: Jupiter API (swaps), Helius (wallet tracking), DexScreener (prices)
- **Real-time**: Supabase Realtime (for chat)

## API Integrations
1. **Jupiter API** - Swap quotes and execution
2. **Helius API** - Wallet transaction history, webhooks
3. **DexScreener API** - Token prices, new pairs
4. **Birdeye API** - Token metadata, trending
5. **Supabase** - Auth, database, real-time

## Current Session Goals
1. Build in-app swap interface (not external)
2. Add quick buy button when CA detected in posts
3. Add Pulse (live new token feed)
4. Start real wallet tracking with Helius
