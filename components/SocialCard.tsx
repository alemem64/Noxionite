/* eslint-disable @next/next/no-img-element */
import React from 'react'

// All styles are inline and use Flexbox for layout.
// This is required for compatibility with @vercel/og.

const styles = {
  container: {
    height: '100%',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    position: 'relative',
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    zIndex: -1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: -1,
  },
  // Post-specific styles
  postLayout: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    width: '100%',
    height: '100%',
    padding: '60px',
  },
  postHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
  },
  postFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    width: '100%',
  },
  breadcrumb: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '28px',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  author: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  authorAvatar: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
  },
  authorName: {
    fontSize: '32px',
    fontWeight: 600,
  },
  title: {
    fontSize: '72px',
    fontWeight: 'bold',
    textAlign: 'center',
    padding: '0 60px',
    textShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
  },
  tags: {
    display: 'flex',
    gap: '12px',
  },
  tagPill: {
    fontSize: '28px',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: '12px 20px',
    borderRadius: '999px',
  },
  datePill: {
    fontSize: '32px',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: '16px 24px',
    borderRadius: '999px',
    fontWeight: 600,
  },
  // Centered layout for root, category, tag pages
  centeredLayout: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '24px',
  },
  centeredIcon: {
    width: '128px',
    height: '128px',
  },
  centeredTitle: {
    fontSize: '80px',
    fontWeight: 'bold',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    padding: '20px 40px',
    borderRadius: '24px',
    border: '2px solid rgba(255, 255, 255, 0.2)',
    textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
  },
} as const;

export interface SocialCardProps {
  type: 'root' | 'post' | 'category' | 'tag' | 'all-tags' | '404';
  title?: string;
  author?: {
    name: string;
    avatarUrl: string;
  };
  category?: string;
  tags?: string[];
  date?: string;
  breadcrumb?: string[];
  backgroundImage: string; // Now mandatory
  iconUrl?: string;
}

export const SocialCard: React.FC<SocialCardProps> = ({
  type,
  title,
  author,
  tags,
  date,
  breadcrumb,
  backgroundImage,
  iconUrl,
}) => {
  const renderContent = () => {
    if (type === 'post') {
      return (
        <div style={styles.postLayout}>
          {/* Header */}
          <div style={styles.postHeader}>
            <div style={styles.breadcrumb}>
              {breadcrumb?.map((item, index) => (
                <div key={item} style={{ display: 'flex', alignItems: 'center' }}>
                  <span>{item}</span>
                  {index < breadcrumb.length - 1 && <span style={{ margin: '0 8px' }}>/</span>}
                </div>
              ))}
            </div>
            {author && (
              <div style={styles.author}>
                <span style={styles.authorName}>{author.name}</span>
                <img src={author.avatarUrl} alt={author.name} style={styles.authorAvatar} />
              </div>
            )}
          </div>

          {/* Title */}
          <h1 style={styles.title}>{title}</h1>

          {/* Footer */}
          <div style={styles.postFooter}>
            <div style={styles.tags}>
              {tags?.slice(0, 3).map((tag) => (
                <div key={tag} style={styles.tagPill}>{tag}</div>
              ))}
            </div>
            {date && <div style={styles.datePill}>{date}</div>}
          </div>
        </div>
      );
    }

    // Default to centered layout for root, category, tag, etc.
    return (
      <div style={styles.centeredLayout}>
        {iconUrl && <img src={iconUrl} alt="icon" style={styles.centeredIcon} />}
        <div style={styles.centeredTitle}>{title}</div>
      </div>
    );
  };

  return (
    <div style={styles.container}>
      <img src={backgroundImage} alt="background" style={styles.background} />
      <div style={styles.overlay} />
      {renderContent()}
    </div>
  );
};
