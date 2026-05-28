import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { type AIPost, formatTimeAgo, generateAIPost, seedAIPosts } from '@/lib/aiSocialEngine';

const POST_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes
const TICK_INTERVAL_MS = 60 * 1000;       // refresh timeAgo labels every minute
const MAX_POSTS = 60;                      // cap to avoid unbounded growth

interface AISocialContextValue {
  posts: AIPost[];
  latestPost: AIPost | null;
  nextPostIn: number; // seconds until next AI post
}

const AISocialContext = createContext<AISocialContextValue>({
  posts: [],
  latestPost: null,
  nextPostIn: POST_INTERVAL_MS / 1000,
});

export function AISocialProvider({ children }: { children: React.ReactNode }) {
  const [posts, setPosts] = useState<AIPost[]>(() => seedAIPosts(8));
  const [nextPostIn, setNextPostIn] = useState(POST_INTERVAL_MS / 1000);
  const lastPostTime = useRef(Date.now());

  // Add a new AI post every 10 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = now - lastPostTime.current;

      if (elapsed >= POST_INTERVAL_MS) {
        const newPost = generateAIPost();
        setPosts(prev => {
          const updated = [newPost, ...prev];
          return updated.length > MAX_POSTS ? updated.slice(0, MAX_POSTS) : updated;
        });
        lastPostTime.current = now;
        setNextPostIn(POST_INTERVAL_MS / 1000);
      } else {
        setNextPostIn(Math.ceil((POST_INTERVAL_MS - elapsed) / 1000));
      }
    }, TICK_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);

  // Refresh timeAgo labels every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setPosts(prev => prev.map(p => ({ ...p, timeAgo: formatTimeAgo(p.timestamp) })));
    }, TICK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  const latestPost = posts.length > 0 ? posts[0] : null;

  return (
    <AISocialContext.Provider value={{ posts, latestPost, nextPostIn }}>
      {children}
    </AISocialContext.Provider>
  );
}

export function useAISocial(): AISocialContextValue {
  return useContext(AISocialContext);
}
