-- DEGEN Posts Table Schema
-- Run this in your Supabase SQL Editor to create the posts table

-- Create posts table
CREATE TABLE IF NOT EXISTS posts (
    id BIGINT PRIMARY KEY,
    wallet_address TEXT,
    author_name TEXT NOT NULL DEFAULT 'Anon',
    author_handle TEXT NOT NULL DEFAULT '@anon',
    content TEXT NOT NULL,
    likes INTEGER DEFAULT 0,
    reposts INTEGER DEFAULT 0,
    liked_by TEXT[] DEFAULT '{}',
    reposted_by TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_wallet ON posts(wallet_address);

-- Enable Row Level Security
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read posts
CREATE POLICY "Anyone can read posts" ON posts
    FOR SELECT USING (true);

-- Allow anyone to insert posts
CREATE POLICY "Anyone can insert posts" ON posts
    FOR INSERT WITH CHECK (true);

-- Allow users to update their own posts (by wallet address)
CREATE POLICY "Users can update own posts" ON posts
    FOR UPDATE USING (wallet_address = current_setting('request.jwt.claims', true)::json->>'sub');

-- Or simpler: allow anyone to update likes/reposts
CREATE POLICY "Anyone can update posts" ON posts
    FOR UPDATE WITH CHECK (true);

-- Grant access to authenticated and anonymous users
GRANT SELECT, INSERT, UPDATE ON posts TO anon;
GRANT SELECT, INSERT, UPDATE ON posts TO authenticated;
