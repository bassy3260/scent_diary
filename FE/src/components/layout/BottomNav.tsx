import { motion } from 'motion/react';
import { Search, Home, BookOpen, User } from 'lucide-react';

export type TabId = 'home' | 'search' | 'diary' | 'mypage';

interface BottomNavProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const tabs: { id: TabId; icon: typeof Home; label: string }[] = [
  { id: 'home', icon: Home, label: '홈' },
  { id: 'search', icon: Search, label: '탐색' },
  { id: 'diary', icon: BookOpen, label: '다이어리' },
  { id: 'mypage', icon: User, label: '마이페이지' },
];

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <div
      className="absolute bottom-0 left-0 right-0 z-40"
      style={{
        background:
          'linear-gradient(180deg, rgba(250,250,248,0) 0%, rgba(250,250,248,0.92) 25%, #FAFAF8 100%)',
        paddingBottom: 'env(safe-area-inset-bottom, 20px)',
        borderTop: '1px solid rgba(0,0,0,0.06)',
      }}
    >
      <div className="flex items-end justify-around px-3 py-1.5">
        {tabs.map(({ id, icon: Icon, label }) => {
          const isActive = activeTab === id;

          return (
            <motion.button
              key={id}
              className="flex flex-col items-center gap-0.5 relative px-3 py-1.5"
              onClick={() => onTabChange(id)}
              whileTap={{ scale: 0.88 }}
            >
              <div className="relative">
                <motion.div
                  animate={isActive ? { y: -2 } : { y: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                >
                  <Icon
                    size={20}
                    strokeWidth={isActive ? 2 : 1.5}
                    className="transition-colors duration-200"
                    style={{ color: isActive ? '#1A1A1A' : '#B8B4AE' }}
                  />
                </motion.div>
              </div>
              <span
                className="transition-colors duration-200"
                style={{ fontSize: '0.5rem', color: isActive ? '#1A1A1A' : '#B8B4AE' }}
              >
                {label}
              </span>
              {isActive && (
                <motion.div
                  className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-5 h-[2.5px] rounded-full bg-[#1A1A1A]"
                  layoutId="activeTab"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
