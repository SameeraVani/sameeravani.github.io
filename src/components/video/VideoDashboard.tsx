import React, { useState, useEffect } from 'react';
import type { VideoPlaylist } from '../../types';
import { Loader2, AlertCircle, ArrowLeft, Share2, Check } from 'lucide-react';
import { getVideoUrlForRoute } from '../../utils/route';

interface VideoDashboardProps {
  bookId: string;
  activePlaylist: VideoPlaylist;
  initialVideoId?: string | null;
  onBack: () => void;
}

interface YouTubeVideo {
  id: string;
  title: string;
  thumbnailUrl: string;
}

export const VideoDashboard: React.FC<VideoDashboardProps> = ({ bookId, activePlaylist, initialVideoId, onBack }) => {
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [activeVideo, setActiveVideo] = useState<YouTubeVideo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  const [groups, setGroups] = useState<{ [groupName: string]: YouTubeVideo[] }>({});
  const [activeGroup, setActiveGroup] = useState<string | null>(null);

  useEffect(() => {
    if (!activePlaylist) return;
    
    const fetchVideos = async () => {
      setLoading(true);
      setError(null);
      
      try {
        if (activePlaylist.id) {
          const playlistIds = activePlaylist.id.split(',').map(id => id.trim());
          let allFormattedVideos: YouTubeVideo[] = [];
          
          for (const pid of playlistIds) {
            let nextPageToken = '';
            let isFirstPage = true;
            
            while (isFirstPage || nextPageToken) {
              isFirstPage = false;
              const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&maxResults=50&playlistId=${pid}&key=${import.meta.env.VITE_YOUTUBE_API_KEY}${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`;
              
              const res = await fetch(url);
              
              if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error?.message || 'Failed to fetch playlist');
              }
              
              const data = await res.json();
              
              const formatted = data.items.map((item: any) => ({
                id: item.contentDetails?.videoId || item.snippet?.resourceId?.videoId,
                title: item.snippet.title,
                thumbnailUrl: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url,
              })).filter((v: YouTubeVideo) => v.id && v.title !== 'Private video' && v.title !== 'Deleted video');
              
              allFormattedVideos = [...allFormattedVideos, ...formatted];
              nextPageToken = data.nextPageToken || '';
            }
          }
          
          allFormattedVideos.sort((a, b) => {
            const getNum = (title: string) => {
              const match = title.match(/day\s*(\d+)/i);
              return match ? parseInt(match[1], 10) : 0;
            };
            const numA = getNum(a.title);
            const numB = getNum(b.title);
            if (numA && numB && numA !== numB) return numA - numB;
            return a.title.localeCompare(b.title);
          });
          
          setVideos(allFormattedVideos);
          
          let targetVideo: YouTubeVideo | null = null;
          if (initialVideoId) {
            targetVideo = allFormattedVideos.find(v => v.id === initialVideoId) || null;
          }
          
          // Handle Grouping
          if (activePlaylist.groupRegex && allFormattedVideos.length > 0) {
            try {
              const regex = new RegExp(activePlaylist.groupRegex, 'i');
              const newGroups: { [groupName: string]: YouTubeVideo[] } = {};
              
              allFormattedVideos.forEach(v => {
                const match = v.title.match(regex);
                let groupName = 'Other';
                if (match && match[1]) {
                  let prefix = 'Group';
                  if (activePlaylist.groupPrefix) {
                    prefix = activePlaylist.groupPrefix;
                  } else if (activePlaylist.title.toLowerCase().includes('stotra')) {
                    prefix = 'Stotra';
                  } else if (activePlaylist.groupRegex?.toLowerCase().includes('sarga')) {
                    prefix = 'Sarga';
                  }
                  groupName = `${prefix} ${match[1]}`;
                }
                if (!newGroups[groupName]) newGroups[groupName] = [];
                newGroups[groupName].push(v);
              });
              
              Object.keys(newGroups).forEach(key => {
                newGroups[key].sort((a, b) => {
                  const getNum = (title: string) => {
                    const match = title.match(/day\s*(\d+)/i);
                    return match ? parseInt(match[1], 10) : 0;
                  };
                  const numA = getNum(a.title);
                  const numB = getNum(b.title);
                  if (numA && numB && numA !== numB) return numA - numB;
                  return a.title.localeCompare(b.title);
                });
              });
              
              setGroups(newGroups);
              const keys = Object.keys(newGroups).sort((a, b) => {
                const numA = parseInt(a.replace(/[^0-9]/g, '')) || 0;
                const numB = parseInt(b.replace(/[^0-9]/g, '')) || 0;
                if (numA && numB) return numA - numB;
                return a.localeCompare(b);
              });
              
              if (keys.length > 0) {
                let selectedGrp = keys.find(k => k !== 'Other') || keys[0];
                if (targetVideo) {
                  const matchedGrp = keys.find(k => newGroups[k].some(v => v.id === targetVideo!.id));
                  if (matchedGrp) selectedGrp = matchedGrp;
                }
                setActiveGroup(selectedGrp);
                setActiveVideo(targetVideo || (newGroups[selectedGrp].length > 0 ? newGroups[selectedGrp][0] : null));
              }
            } catch (e) {
              console.error("Invalid groupRegex", e);
              setGroups({});
              setActiveGroup(null);
              setActiveVideo(targetVideo || (allFormattedVideos.length > 0 ? allFormattedVideos[0] : null));
            }
          } else if (activePlaylist.chunkSize && allFormattedVideos.length > 0) {
            const chunkSize = activePlaylist.chunkSize;
            const prefix = activePlaylist.chunkPrefix || 'Part';
            const newGroups: { [groupName: string]: YouTubeVideo[] } = {};
            
            allFormattedVideos.forEach((v, index) => {
              const chunkIndex = Math.floor(index / chunkSize);
              const start = chunkIndex * chunkSize + 1;
              const end = Math.min((chunkIndex + 1) * chunkSize, allFormattedVideos.length);
              const groupName = `${prefix} ${start} to ${end}`;
              if (!newGroups[groupName]) newGroups[groupName] = [];
              newGroups[groupName].push(v);
            });
            
            Object.keys(newGroups).forEach(key => {
              newGroups[key].sort((a, b) => {
                const getNum = (title: string) => {
                  const match = title.match(/day\s*(\d+)/i);
                  return match ? parseInt(match[1], 10) : 0;
                };
                const numA = getNum(a.title);
                const numB = getNum(b.title);
                if (numA && numB && numA !== numB) return numA - numB;
                return a.title.localeCompare(b.title);
              });
            });
            
            setGroups(newGroups);
            const keys = Object.keys(newGroups);
            if (keys.length > 0) {
              let selectedGrp = keys[0];
              if (targetVideo) {
                const matchedGrp = keys.find(k => newGroups[k].some(v => v.id === targetVideo!.id));
                if (matchedGrp) selectedGrp = matchedGrp;
              }
              setActiveGroup(selectedGrp);
              setActiveVideo(targetVideo || (newGroups[selectedGrp].length > 0 ? newGroups[selectedGrp][0] : null));
            }
          } else {
            setGroups({});
            setActiveGroup(null);
            setActiveVideo(targetVideo || (allFormattedVideos.length > 0 ? allFormattedVideos[0] : null));
          }
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, [activePlaylist, initialVideoId]);

  const handleSelectVideo = (video: YouTubeVideo) => {
    setActiveVideo(video);
    const newUrl = getVideoUrlForRoute(bookId, activePlaylist.id, video.id);
    window.history.pushState(null, '', newUrl);
  };

  const handleShareVideo = () => {
    if (!activeVideo) return;
    const fullUrl = window.location.origin + getVideoUrlForRoute(bookId, activePlaylist.id, activeVideo.id);
    
    const copyToClipboard = async () => {
      try {
        await navigator.clipboard.writeText(fullUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } catch {
        const textarea = document.createElement('textarea');
        textarea.value = fullUrl;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    };
    
    copyToClipboard();
  };

  return (
    <div className="video-dashboard" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '20px', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '15px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 12px', background: 'var(--bg-tertiary)', border: 'none', borderRadius: '8px', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 'bold' }}>
            <ArrowLeft size={18} /> Back to Playlists
          </button>
          <h2 style={{ margin: 0, fontSize: '1.2rem' }}>{activePlaylist.title}</h2>
        </div>
      </div>

      {error ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'red', background: 'var(--bg-tertiary)', padding: '20px', borderRadius: '12px' }}>
          <AlertCircle />
          <span>{error}</span>
        </div>
      ) : loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
          <Loader2 className="animate-spin" size={48} />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          
          {/* Top Full-Width Group Tabs */}
          {Object.keys(groups).length > 0 && (
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', paddingBottom: '15px', marginBottom: '15px', borderBottom: '1px solid var(--border)' }}>
              {Object.keys(groups).sort((a, b) => {
                const numA = parseInt(a.replace(/[^0-9]/g, '')) || 0;
                const numB = parseInt(b.replace(/[^0-9]/g, '')) || 0;
                if (numA && numB) return numA - numB;
                return a.localeCompare(b);
              }).map(group => (
                <button
                  key={group}
                  onClick={() => setActiveGroup(group)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '20px',
                    border: 'none',
                    background: activeGroup === group ? 'var(--accent)' : 'var(--bg-tertiary)',
                    color: activeGroup === group ? 'white' : 'var(--text-primary)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    fontWeight: 'bold',
                    fontSize: '0.95rem',
                    transition: 'background 0.2s, transform 0.1s'
                  }}
                  onMouseOver={(e) => { if(activeGroup !== group) e.currentTarget.style.transform = 'scale(1.05)' }}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  {group}
                </button>
              ))}
            </div>
          )}

          {/* Video Selection Dropdown */}
          <div style={{ marginBottom: '20px' }}>
            <select
              value={activeVideo?.id || ''}
              onChange={(e) => {
                const vidId = e.target.value;
                const vid = videos.find(v => v.id === vidId);
                if (vid) handleSelectVideo(vid);
              }}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '8px',
                background: 'var(--bg-tertiary)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
                fontSize: '1rem',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              {(Object.keys(groups).length > 0 ? (activeGroup && groups[activeGroup] ? groups[activeGroup] : []) : videos).map((video) => (
                <option key={video.id} value={video.id}>
                  {video.title}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Main Player Area */}
          <div style={{ flex: '1', display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            {activeVideo ? (
              <>
                <div style={{ width: '100%', aspectRatio: '16/9', background: 'black', borderRadius: '12px', overflow: 'hidden' }}>
                  <iframe
                    width="100%"
                    height="100%"
                    src={`https://www.youtube.com/embed/${activeVideo.id}?autoplay=1`}
                    title={activeVideo.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
                <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '15px' }}>
                  <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 'bold' }}>{activeVideo.title}</h2>
                  <button
                    onClick={handleShareVideo}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 16px',
                      borderRadius: '20px',
                      border: '1px solid var(--border)',
                      background: copied ? '#2e7d32' : 'var(--bg-tertiary)',
                      color: copied ? 'white' : 'var(--text-primary)',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '0.9rem',
                      transition: 'all 0.2s',
                    }}
                  >
                    {copied ? <Check size={16} /> : <Share2 size={16} />}
                    {copied ? 'Link Copied!' : 'Share Video'}
                  </button>
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1, background: 'var(--bg-tertiary)', borderRadius: '12px' }}>
                <p>No videos found in this playlist.</p>
              </div>
            )}
          </div>
        </div>
        </div>
      )}
    </div>
  );
};

