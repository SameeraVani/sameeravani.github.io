import re
import os

file_path = r"d:\SriRamaniProjects\SV\svbooks\src\components\Reader.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Replace the flatMap logic
flatten_def = """
const flattenChapters = (chapters: Chapter[]): Chapter[] => {
  return chapters.reduce((acc: Chapter[], chapter) => {
    acc.push(chapter);
    if (chapter.topics && chapter.topics.length > 0) {
      acc = acc.concat(flattenChapters(chapter.topics));
    }
    return acc;
  }, []);
};

export const Reader: React.FC<ReaderProps>"""
content = content.replace("export const Reader: React.FC<ReaderProps>", flatten_def)

# Replace all occurrences
content = re.sub(
    r"chapters\.flatMap\(c => c\.topics \? \[c, \.\.\.c\.topics\] : \[c\]\)",
    "flattenChapters(chapters)",
    content
)
content = re.sub(
    r"langChapters\.flatMap\(c => c\.topics \? \[c, \.\.\.c\.topics\] : \[c\]\)",
    "flattenChapters(langChapters)",
    content
)

# 2. Add expandedNodes state
state_def = """  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const toggleNode = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const scrollContainerRef"""
content = content.replace("  const scrollContainerRef", state_def)

# 3. Replace Sidebar TOC rendering
# We need to define a recursive SidebarTOCItem function inside Reader or use a component.
sidebar_item_def = """
  const renderSidebarTOC = (chaptersList: Chapter[], level: number = 0) => {
    return chaptersList.map(chapter => {
      const isActive = chapter.id === activeChapterId;
      const chapterReadPercent = getChapterProgressPercent(chapter.id);
      const hasChildren = chapter.topics && chapter.topics.length > 0;
      const isExpanded = expandedNodes.has(chapter.id);

      return (
        <React.Fragment key={chapter.id}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button
              className={`toc-item ${isActive ? 'active' : ''}`}
              onClick={() => handleNavigateToChapter(chapter.id)}
              style={{ paddingLeft: `${16 + level * 16}px`, flex: 1 }}
            >
              <span className="toc-status-indicator"></span>
              <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: level > 0 ? '0.9rem' : '1rem' }}>{chapter.title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {chapterReadPercent === 100 ? 'Completed' : chapterReadPercent > 0 ? `${chapterReadPercent}% read` : 'Unread'}
                  </div>
                </div>
              </div>
            </button>
            {hasChildren && (
              <button 
                onClick={(e) => toggleNode(chapter.id, e)}
                style={{ background: 'none', border: 'none', padding: '10px', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                {isExpanded ? <Minus size={14} /> : <Plus size={14} />}
              </button>
            )}
          </div>
          {hasChildren && isExpanded && renderSidebarTOC(chapter.topics!, level + 1)}
        </React.Fragment>
      );
    });
  };

"""

# Let's insert the render functions right before `return (` inside Reader component
# We'll locate a good spot. Maybe right before `return (` of the main render
render_functions = sidebar_item_def + """
  const renderIntroTOC = (chaptersList: Chapter[], prefix: string = '', level: number = 0) => {
    return chaptersList.map((chapter, index) => {
      const progressPercent = getChapterProgressPercent(chapter.id);
      const hasChildren = chapter.topics && chapter.topics.length > 0;
      const isExpanded = expandedNodes.has(chapter.id);
      const numStr = prefix ? `${prefix}.${index + 1}` : `${index + 1}`;

      return (
        <React.Fragment key={chapter.id}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: level > 0 ? '8px' : '0' }}>
            <button
              className={`intro-chapter-card ${level > 0 ? 'topic-card' : ''}`}
              onClick={() => handleNavigateToChapter(chapter.id)}
              style={{ 
                flex: 1, 
                marginLeft: `${level * 24}px`, 
                padding: level > 0 ? '8px 12px' : '', 
                background: level > 0 ? 'var(--bg-tertiary)' : '', 
                border: level > 0 ? '1px solid var(--border)' : '', 
                minHeight: level > 0 ? 'auto' : '' 
              }}
            >
              <span className="intro-chapter-num" style={level > 0 ? { fontSize: '0.85rem', width: '24px', height: '24px' } : {}}>{numStr}</span>
              <div className="intro-chapter-details">
                <span className="intro-chapter-title" style={level > 0 ? { fontSize: '0.95rem' } : {}}>{chapter.title}</span>
                <span className="intro-chapter-progress" style={level > 0 ? { fontSize: '0.75rem' } : {}}>
                  {progressPercent === 100 ? 'Completed' : progressPercent > 0 ? `${progressPercent}% read` : 'Unread'}
                </span>
              </div>
              <span className="intro-chapter-arrow">→</span>
            </button>
            {hasChildren && (
              <button 
                onClick={(e) => toggleNode(chapter.id, e)}
                style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0 12px', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                {isExpanded ? <Minus size={16} /> : <Plus size={16} />}
              </button>
            )}
          </div>
          {hasChildren && isExpanded && (
            <div className="intro-topics-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: level === 0 ? '16px' : '0', marginTop: level === 0 ? '8px' : '0' }}>
              {renderIntroTOC(chapter.topics!, numStr, level + 1)}
            </div>
          )}
        </React.Fragment>
      );
    });
  };

"""

content = content.replace("  return (\n    <div className={`reader-container", render_functions + "  return (\n    <div className={`reader-container")

# Now, we need to replace the static TOC renders with calls to these functions.
sidebar_old = '''{langChapters.map((chapter) => {
                const isActive = chapter.id === activeChapterId;
                const chapterReadPercent = getChapterProgressPercent(chapter.id);
                return (
                  <React.Fragment key={chapter.id}>
                    <button
                      className={`toc-item ${isActive ? 'active' : ''}`}
                      onClick={() => handleNavigateToChapter(chapter.id)}
                    >
                      <span className="toc-status-indicator"></span>
                      <div style={{ flex: 1 }}>
                        <div>{chapter.title}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {chapterReadPercent === 100 ? 'Completed' : chapterReadPercent > 0 ? `${chapterReadPercent}% read` : 'Unread'}
                        </div>
                      </div>
                    </button>
                    {chapter.topics && chapter.topics.length > 0 && chapter.topics.map(topic => {
                      const isTopicActive = topic.id === activeChapterId;
                      const topicReadPercent = getChapterProgressPercent(topic.id);
                      return (
                        <button
                          key={topic.id}
                          className={`toc-item ${isTopicActive ? 'active' : ''}`}
                          onClick={() => handleNavigateToChapter(topic.id)}
                          style={{ paddingLeft: '32px' }}
                        >
                          <span className="toc-status-indicator"></span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.9rem' }}>{topic.title}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                              {topicReadPercent === 100 ? 'Completed' : topicReadPercent > 0 ? `${topicReadPercent}% read` : 'Unread'}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </React.Fragment>
                );
              })}'''

content = content.replace(sidebar_old, "{renderSidebarTOC(langChapters)}")


# And for the intro TOC
intro_old = '''{langChapters.map((chapter, index) => {
                      const progressPercent = getChapterProgressPercent(chapter.id);
                      return (
                        <React.Fragment key={chapter.id}>
                          <button
                            className="intro-chapter-card"
                            onClick={() => handleNavigateToChapter(chapter.id)}
                          >
                            <span className="intro-chapter-num">{index + 1}</span>
                            <div className="intro-chapter-details">
                              <span className="intro-chapter-title">{chapter.title}</span>
                              <span className="intro-chapter-progress">
                                {progressPercent === 100 ? 'Completed' : progressPercent > 0 ? `${progressPercent}% read` : 'Unread'}
                              </span>
                            </div>
                            <span className="intro-chapter-arrow">→</span>
                          </button>
                          {chapter.topics && chapter.topics.length > 0 && (
                            <div className="intro-topics-list" style={{ paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                              {chapter.topics.map((topic, tIndex) => {
                                const topicProgressPercent = getChapterProgressPercent(topic.id);
                                return (
                                  <button
                                    key={topic.id}
                                    className="intro-chapter-card topic-card"
                                    onClick={() => handleNavigateToChapter(topic.id)}
                                    style={{ padding: '8px 12px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', minHeight: 'auto' }}
                                  >
                                    <span className="intro-chapter-num" style={{ fontSize: '0.85rem', width: '24px', height: '24px' }}>{index + 1}.{tIndex + 1}</span>
                                    <div className="intro-chapter-details">
                                      <span className="intro-chapter-title" style={{ fontSize: '0.95rem' }}>{topic.title}</span>
                                      <span className="intro-chapter-progress" style={{ fontSize: '0.75rem' }}>
                                        {topicProgressPercent === 100 ? 'Completed' : topicProgressPercent > 0 ? `${topicProgressPercent}% read` : 'Unread'}
                                      </span>
                                    </div>
                                    <span className="intro-chapter-arrow">→</span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </React.Fragment>
                      );
                    })}'''

content = content.replace(intro_old, "{renderIntroTOC(langChapters)}")


with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Done")
