import React, { useState, useEffect, useCallback } from 'react';
import type { ArticleTopic, Article, ArticleProgressMap } from '../../types';
import { ArticleArchive } from './ArticleArchive';
import { ArticleViewer } from './ArticleViewer';
import { parseRoute, getArticleUrlForRoute } from '../../utils/route';
import { Loader2 } from 'lucide-react';

interface ArticlesProps {
  appLanguage?: string;
  onChangeLanguage?: (lang: string) => void;
}

export const Articles: React.FC<ArticlesProps> = ({
  appLanguage,
  onChangeLanguage,
}) => {
  const [topics, setTopics] = useState<ArticleTopic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<ArticleTopic | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);

  const [progressMap, setProgressMap] = useState<ArticleProgressMap>(() => {
    const saved = localStorage.getItem('article-progress') || localStorage.getItem('lesson-progress');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse article progress:', e);
      }
    }
    return {};
  });

  const syncRouteWithState = useCallback((allTopics: ArticleTopic[]) => {
    const route = parseRoute();
    if (route.mode !== 'articles' && route.mode !== 'lessons') return;

    if (route.lang && onChangeLanguage) {
      onChangeLanguage(route.lang);
    }

    if (!route.topicId) {
      setSelectedTopic(null);
      setSelectedArticle(null);
      return;
    }

    const foundTopic = allTopics.find((t) => t.id === route.topicId);
    if (foundTopic) {
      setSelectedTopic(foundTopic);
      if (route.lessonId) {
        const foundArticle = foundTopic.lessons.find((l) => l.id === route.lessonId);
        if (foundArticle) {
          setSelectedArticle(foundArticle);
        } else if (foundTopic.lessons.length > 0) {
          setSelectedArticle(foundTopic.lessons[0]);
        }
      } else if (foundTopic.lessons.length > 0) {
        setSelectedArticle(foundTopic.lessons[0]);
      }
    }
  }, [onChangeLanguage]);

  useEffect(() => {
    const loadCatalog = async () => {
      try {
        let res = await fetch(`${import.meta.env.BASE_URL}articles/catalog.json?t=${Date.now()}`);
        if (!res.ok) {
          res = await fetch(`${import.meta.env.BASE_URL}lessons/catalog.json?t=${Date.now()}`);
        }
        if (!res.ok) {
          res = await fetch(`${import.meta.env.BASE_URL}lessons/lessons-catalog.json?t=${Date.now()}`);
        }
        const data: ArticleTopic[] = await res.json();
        setTopics(data);
        syncRouteWithState(data);
        setLoading(false);
      } catch (err) {
        console.error('Failed to load articles catalog:', err);
        setLoading(false);
      }
    };
    loadCatalog();
  }, [syncRouteWithState]);

  useEffect(() => {
    const handlePopState = () => {
      syncRouteWithState(topics);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [topics, syncRouteWithState]);

  const handleSelectArticle = (topic: ArticleTopic, article: Article, lang?: string) => {
    setSelectedTopic(topic);
    setSelectedArticle(article);
    const activeLang = lang || appLanguage || localStorage.getItem('app-language') || 'tamil';
    window.history.pushState(null, '', getArticleUrlForRoute(topic.id, activeLang, article.id));
  };

  const handleBackToArchive = () => {
    setSelectedTopic(null);
    setSelectedArticle(null);
    const activeLang = appLanguage || localStorage.getItem('app-language') || 'tamil';
    window.history.pushState(null, '', getArticleUrlForRoute(null, activeLang));
  };

  const handleCompleteQuiz = (score: number, total: number) => {
    if (!selectedArticle) return;

    setProgressMap((prev) => {
      const updated = {
        ...prev,
        [selectedArticle.id]: {
          completed: true,
          score,
          total,
          lastAttemptTime: Date.now(),
        },
      };
      localStorage.setItem('article-progress', JSON.stringify(updated));
      localStorage.setItem('lesson-progress', JSON.stringify(updated));
      return updated;
    });
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', gap: '10px' }}>
        <Loader2 className="animate-spin" size={24} color="var(--accent)" />
        <span style={{ color: 'var(--text-secondary)' }}>Loading articles...</span>
      </div>
    );
  }

  if (selectedTopic && selectedArticle) {
    return (
      <ArticleViewer
        topic={selectedTopic}
        article={selectedArticle}
        topics={topics}
        currentLanguage={appLanguage}
        onChangeLanguage={onChangeLanguage}
        onNavigateArticle={(next, targetTopic) => handleSelectArticle(targetTopic || selectedTopic, next)}
        onBackToArchive={handleBackToArchive}
        onCompleteQuiz={handleCompleteQuiz}
      />
    );
  }

  return (
    <ArticleArchive
      topics={topics}
      progressMap={progressMap}
      currentLanguage={appLanguage}
      onChangeLanguage={onChangeLanguage}
      onSelectArticle={handleSelectArticle}
    />
  );
};
