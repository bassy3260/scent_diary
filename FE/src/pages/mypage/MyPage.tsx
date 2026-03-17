import { motion } from 'motion/react';
import { ChevronRight, BookOpen, Clock, Heart, Settings, Package, Edit2, X } from 'lucide-react';
import { useAppStore } from '../../store';
import { mockPerfumes } from '../../constants/perfumes';
import { AGE_RANGES, PROFILE_GENDERS } from '../../constants/ui.constants';
import { useState } from 'react';

export function MyPage() {
  const { savedPerfumes, diaryEntries, recommendationHistory, myCollection, navigateTo, profile, updateProfile } = useAppStore();
  const [showEditModal, setShowEditModal] = useState(false);
  const [editNickname, setEditNickname] = useState(profile.nickname || '');
  const [editAgeRange, setEditAgeRange] = useState(profile.ageRange || '');
  const [editGender, setEditGender] = useState(profile.gender || '');

  const savedList = mockPerfumes.filter(p => savedPerfumes.includes(p.id));
  const diary = diaryEntries;
  const history = recommendationHistory;

  // Taste stats from saved
  const allAccords = (savedList.length > 0 ? savedList : mockPerfumes.slice(0, 3)).flatMap(p => p.accords);
  const accordCounts: Record<string, { total: number; color: string; count: number }> = {};
  allAccords.forEach(a => {
    if (!accordCounts[a.name]) accordCounts[a.name] = { total: 0, color: a.color, count: 0 };
    accordCounts[a.name].total += a.percentage;
    accordCounts[a.name].count++;
  });
  const topAccords = Object.entries(accordCounts)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 4);

  return (
    <div className="w-full h-full flex flex-col" style={{ background: '#FAFAF8' }}>
      <div className="pt-6 px-6 pb-3 flex items-center justify-between">
        <div>
          <p className="text-[#B8B4AE]" style={{ fontSize: '0.6875rem', letterSpacing: '0.1em' }}>MY SCENT LOUNGE</p>
          <h2 className="mt-1 text-[#1A1A1A]" style={{ fontSize: '1.5rem', fontFamily: "'Playfair Display', serif" }}>
            나의 향 라운지
          </h2>
        </div>
        <motion.button
          className="w-10 h-10 rounded-full bg-[#F5F3EF] flex items-center justify-center"
          onClick={() => navigateTo('settings')}
          whileTap={{ scale: 0.9 }}
        >
          <Settings size={18} className="text-[#8A8680]" />
        </motion.button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-28">
        {/* Profile card */}
        <motion.div
          className="p-5 rounded-2xl relative"
          style={{ background: 'linear-gradient(135deg, #1A1A1A 0%, #2A2A28 100%)' }}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <motion.button
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
            onClick={() => {
              setEditNickname(profile.nickname || '');
              setEditAgeRange(profile.ageRange || '');
              setEditGender(profile.gender || '');
              setShowEditModal(true);
            }}
            whileTap={{ scale: 0.9 }}
          >
            <Edit2 size={14} className="text-white/70" />
          </motion.button>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #6B7B5E40 0%, #B8A88A30 100%)' }}>
              <span style={{ fontSize: '1.5rem' }}>🌿</span>
            </div>
            <div>
              <p className="text-white" style={{ fontSize: '1rem' }}>
                {profile.nickname || '향기로운 사용자'}
              </p>
              <p className="text-white/50 mt-0.5" style={{ fontSize: '0.75rem' }}>
                {profile.gender || '무관'} · {profile.ageRange || '20대'}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="text-center">
              <p className="text-white" style={{ fontSize: '1.25rem' }}>{savedPerfumes.length || 3}</p>
              <p className="text-white/40" style={{ fontSize: '0.6875rem' }}>찜한 향수</p>
            </div>
            <div className="text-center">
              <p className="text-white" style={{ fontSize: '1.25rem' }}>{diary.length}</p>
              <p className="text-white/40" style={{ fontSize: '0.6875rem' }}>향 기록</p>
            </div>
            <div className="text-center">
              <p className="text-white" style={{ fontSize: '1.25rem' }}>{history.length}</p>
              <p className="text-white/40" style={{ fontSize: '0.6875rem' }}>추천 횟수</p>
            </div>
          </div>
        </motion.div>

        {/* Taste profile summary */}
        <motion.div
          className="mt-5 p-4 rounded-2xl bg-[#F5F3EF]"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-[#B8B4AE]" style={{ fontSize: '0.6875rem', letterSpacing: '0.08em' }}>내 취향 요약</p>
            <button className="text-[#6B7B5E] flex items-center gap-0.5" style={{ fontSize: '0.6875rem' }}
              onClick={() => navigateTo('taste-profile')}>
              상세 <ChevronRight size={12} />
            </button>
          </div>
          <div className="flex gap-3">
            {topAccords.map(([name, data]) => (
              <div key={name} className="flex-1 flex flex-col items-center">
                <div className="w-10 h-10 rounded-full flex items-center justify-center mb-1"
                  style={{ backgroundColor: `${data.color}18` }}>
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: `${data.color}50` }} />
                </div>
                <span className="text-[#1A1A1A] text-center" style={{ fontSize: '0.6875rem' }}>{name}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Menu cards */}
        <div className="grid grid-cols-2 gap-3 mt-5">
          {[
            { icon: Heart, label: '찜한 향수', count: savedPerfumes.length || 3, screen: 'collection' as const, color: '#C8A5A5' },
            { icon: Clock, label: '추천 히스토리', count: history.length, screen: 'history' as const, color: '#8BA4B8' },
            { icon: Package, label: '마이 컬렉션', count: myCollection.length, screen: 'my-collection' as const, color: '#9BA88B' },
            { icon: BookOpen, label: '다이어리', count: diary.length, screen: 'diary' as const, color: '#B8A88A' },
          ].map((item, i) => (
            <motion.button
              key={item.label}
              className="p-4 rounded-2xl text-left"
              style={{ background: 'linear-gradient(145deg, #FFFFFF, #F8F7F4)', boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}
              onClick={() => navigateTo(item.screen)}
              whileTap={{ scale: 0.97 }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.06 }}
            >
              <div className="w-9 h-9 rounded-full flex items-center justify-center mb-2"
                style={{ backgroundColor: `${item.color}12` }}>
                <item.icon size={16} style={{ color: item.color }} />
              </div>
              <p className="text-[#1A1A1A]" style={{ fontSize: '0.875rem' }}>{item.label}</p>
              {item.count !== null && (
                <p className="text-[#B8B4AE] mt-0.5" style={{ fontSize: '0.6875rem' }}>{item.count}개</p>
              )}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <motion.div
          className="fixed top-0 left-0 w-full h-full bg-black/50 flex items-center justify-center z-50 p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowEditModal(false)}
        >
          <motion.div
            className="bg-white rounded-2xl p-6 w-full max-w-sm"
            style={{ boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[#1A1A1A]" style={{ fontSize: '1.25rem', fontFamily: "'Playfair Display', serif" }}>
                프로필 편집
              </h3>
              <motion.button
                className="w-8 h-8 rounded-full bg-[#F5F3EF] flex items-center justify-center"
                onClick={() => setShowEditModal(false)}
                whileTap={{ scale: 0.9 }}
              >
                <X size={16} className="text-[#8A8680]" />
              </motion.button>
            </div>

            {/* Nickname */}
            <div className="mb-5">
              <label className="block text-[#B8B4AE] mb-2" style={{ fontSize: '0.6875rem', letterSpacing: '0.08em' }}>
                닉네임
              </label>
              <input
                type="text"
                value={editNickname}
                onChange={(e) => setEditNickname(e.target.value)}
                placeholder="닉네임을 입력하세요"
                className="w-full px-4 py-3 rounded-xl bg-[#FAFAF8] border border-[#E8E6E1] text-[#1A1A1A] placeholder:text-[#D4D0C8] focus:outline-none focus:border-[#6B7B5E] transition-colors"
                style={{ fontSize: '0.9375rem' }}
                maxLength={12}
              />
              <p className="text-[#B8B4AE] mt-1.5 text-right" style={{ fontSize: '0.6875rem' }}>
                {editNickname.length}/12
              </p>
            </div>

            {/* Gender */}
            <div className="mb-5">
              <label className="block text-[#B8B4AE] mb-3" style={{ fontSize: '0.6875rem', letterSpacing: '0.08em' }}>
                성별
              </label>
              <div className="grid grid-cols-3 gap-2">
                {PROFILE_GENDERS.map((g) => (
                  <motion.button
                    key={g}
                    className="py-3 rounded-xl transition-colors"
                    style={{
                      background: editGender === g ? 'linear-gradient(135deg, #6B7B5E, #8FA380)' : '#FAFAF8',
                      color: editGender === g ? '#FFFFFF' : '#8A8680',
                      fontSize: '0.875rem',
                      border: editGender === g ? 'none' : '1px solid #E8E6E1',
                    }}
                    onClick={() => setEditGender(g)}
                    whileTap={{ scale: 0.97 }}
                  >
                    {g}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Age Range */}
            <div className="mb-6">
              <label className="block text-[#B8B4AE] mb-3" style={{ fontSize: '0.6875rem', letterSpacing: '0.08em' }}>
                연령대
              </label>
              <div className="grid grid-cols-3 gap-2">
                {AGE_RANGES.map((range) => (
                  <motion.button
                    key={range}
                    className="py-3 rounded-xl transition-colors"
                    style={{
                      background: editAgeRange === range ? 'linear-gradient(135deg, #6B7B5E, #8FA380)' : '#FAFAF8',
                      color: editAgeRange === range ? '#FFFFFF' : '#8A8680',
                      fontSize: '0.875rem',
                      border: editAgeRange === range ? 'none' : '1px solid #E8E6E1',
                    }}
                    onClick={() => setEditAgeRange(range)}
                    whileTap={{ scale: 0.97 }}
                  >
                    {range}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Save Button */}
            <motion.button
              className="w-full py-4 rounded-2xl tracking-wide transition-all"
              style={{
                background: editNickname.trim() && editGender && editAgeRange ? '#1A1A1A' : '#E8E6E1',
                color: editNickname.trim() && editGender && editAgeRange ? '#FFFFFF' : '#B8B4AE',
                fontSize: '0.9375rem',
              }}
              onClick={() => {
                if (editNickname.trim() && editGender && editAgeRange) {
                  updateProfile({ nickname: editNickname.trim(), ageRange: editAgeRange, gender: editGender });
                  setShowEditModal(false);
                }
              }}
              disabled={!editNickname.trim() || !editGender || !editAgeRange}
              whileTap={editNickname.trim() && editGender && editAgeRange ? { scale: 0.98 } : {}}
            >
              저장
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
