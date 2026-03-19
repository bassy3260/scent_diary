import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Upload, Camera, X, Sparkles } from 'lucide-react';
import { useAppStore } from '../../store';
import { PERFUME_IMAGES, mockPerfumes } from '../../constants/perfumes';
import { ImageWithFallback } from '../../components/common/ImageWithFallback';

export function PhotoRecommend() {
  const { goBack, navigateTo, setSelectedPerfumeId } = useAppStore();
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);

  const extractedTags = ['차분함', '습한 공기', '우디', '그린', '따뜻한 빛'];
  const recommendedPerfumes = mockPerfumes.slice(0, 3);

  const handleUpload = () => {
    setUploadedImage(PERFUME_IMAGES.forest);
    setAnalyzing(true);
    setTimeout(() => {
      setAnalyzing(false);
      setAnalyzed(true);
    }, 2500);
  };

  return (
    <div className="w-full h-full flex flex-col" style={{ background: '#FAFAF8' }}>
      <div className="pt-6 px-6 pb-3 flex items-center gap-3">
        <motion.button onClick={goBack} whileTap={{ scale: 0.9 }}>
          <ChevronLeft size={24} className="text-[#8A8680]" />
        </motion.button>
        <div>
          <p className="text-[#B8B4AE]" style={{ fontSize: '0.6875rem', letterSpacing: '0.1em' }}>IMAGE RECOMMEND</p>
          <h3 className="text-[#1A1A1A]" style={{ fontSize: '1.125rem', fontFamily: "'Playfair Display', serif" }}>
            이미지로 향 찾기
          </h3>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-28">
        {!uploadedImage ? (
          <motion.div
            className="mt-4"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Upload area */}
            <motion.button
              className="w-full aspect-[4/3] rounded-3xl border-2 border-dashed border-[#E8E6E1] flex flex-col items-center justify-center gap-4"
              style={{ backgroundColor: '#F8F7F4' }}
              onClick={handleUpload}
              whileTap={{ scale: 0.98 }}
            >
              <div className="w-16 h-16 rounded-full bg-[#B8A5C8]/10 flex items-center justify-center">
                <Upload size={24} className="text-[#B8A5C8]" />
              </div>
              <div className="text-center">
                <p className="text-[#1A1A1A]" style={{ fontSize: '0.9375rem' }}>사진을 업로드해주세요</p>
                <p className="text-[#B8B4AE] mt-1" style={{ fontSize: '0.75rem' }}>
                  사진의 분위기로 어울리는 향을 찾아드려요
                </p>
              </div>
            </motion.button>

            <div className="flex gap-3 mt-4">
              <motion.button
                className="flex-1 py-3.5 rounded-2xl bg-[#1A1A1A] text-white flex items-center justify-center gap-2"
                style={{ fontSize: '0.875rem' }}
                onClick={handleUpload}
                whileTap={{ scale: 0.97 }}
              >
                <Camera size={16} /> 갤러리에서 선택
              </motion.button>
            </div>

            {/* Privacy note */}
            <div className="mt-6 p-4 rounded-xl bg-[#F5F3EF]">
              <p className="text-[#8A8680]" style={{ fontSize: '0.75rem', lineHeight: 1.6 }}>
                업로드한 이미지는 추천 분석 용도로만 사용되며, 분석 후 저장되지 않아요. 안심하고 이용해주세요.
              </p>
            </div>

            {/* Example descriptions */}
            <div className="mt-6">
              <p className="text-[#B8B4AE] mb-3" style={{ fontSize: '0.6875rem', letterSpacing: '0.08em' }}>
                이런 사진도 좋아요
              </p>
              <div className="flex flex-wrap gap-2">
                {['차가운 도시 야경', '햇빛 드는 카페', '여름 바다', '빈티지한 서재', '새벽 공기', '숲속 오솔길'].map(t => (
                  <span key={t} className="px-3 py-1.5 rounded-full bg-[#F5F3EF] text-[#8A8680]"
                    style={{ fontSize: '0.75rem' }}>{t}</span>
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            className="mt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {/* Preview */}
            <div className="relative rounded-2xl overflow-hidden">
              <ImageWithFallback src={uploadedImage} alt="uploaded" className="w-full aspect-[4/3] object-cover" />
              {!analyzed && (
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center"
                  style={{ backdropFilter: 'blur(2px)' }}>
                  <motion.div
                    className="w-12 h-12 rounded-full bg-white/80 flex items-center justify-center"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <Sparkles size={20} className="text-[#6B7B5E]" />
                  </motion.div>
                </div>
              )}
              {analyzed && (
                <motion.button
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/70 flex items-center justify-center"
                  onClick={() => { setUploadedImage(null); setAnalyzed(false); }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X size={14} />
                </motion.button>
              )}
            </div>

            <AnimatePresence>
              {analyzing && (
                <motion.div
                  className="mt-5 text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <p className="text-[#1A1A1A]" style={{ fontSize: '0.9375rem' }}>이미지의 분위기를 해석하고 있어요...</p>
                  <div className="w-32 h-[2px] mx-auto mt-3 bg-[#E8E6E1] rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-[#6B7B5E]"
                      animate={{ width: ['0%', '100%'] }}
                      transition={{ duration: 2.5 }}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {analyzed && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {/* Extracted mood */}
                <div className="mt-5">
                  <p className="text-[#B8B4AE] mb-2" style={{ fontSize: '0.6875rem', letterSpacing: '0.08em' }}>
                    감지된 분위기
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {extractedTags.map((tag, i) => (
                      <motion.span
                        key={tag}
                        className="px-3 py-1.5 rounded-full bg-[#6B7B5E]/8 text-[#6B7B5E] border border-[#6B7B5E]/12"
                        style={{ fontSize: '0.8125rem' }}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 + i * 0.08 }}
                      >
                        {tag}
                      </motion.span>
                    ))}
                  </div>
                </div>

                {/* Text refine */}
                <div className="mt-4 p-4 rounded-2xl bg-[#F5F3EF]">
                  <p className="text-[#8A8680] mb-2" style={{ fontSize: '0.75rem' }}>
                    텍스트를 추가해서 더 정교하게 다듬을 수 있어요
                  </p>
                  <input
                    className="w-full py-2.5 px-3 rounded-xl bg-white border border-[rgba(0,0,0,0.05)] text-[#1A1A1A] placeholder:text-[#D4D0CA] outline-none"
                    style={{ fontSize: '0.875rem' }}
                    placeholder="예: 이 분위기에 좀 더 따뜻한 느낌..."
                  />
                </div>

                {/* Results */}
                <div className="mt-5">
                  <p className="text-[#B8B4AE] mb-3" style={{ fontSize: '0.6875rem', letterSpacing: '0.08em' }}>
                    이 분위기와 어울리는 향
                  </p>
                  {recommendedPerfumes.map((p, i) => (
                    <motion.div
                      key={p.id}
                      className="mb-2.5 flex gap-3 p-3 rounded-2xl"
                      style={{ background: 'linear-gradient(145deg, #FFFFFF, #F8F7F4)', boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + i * 0.1 }}
                      onClick={() => { setSelectedPerfumeId(p.id); navigateTo('detail'); }}
                    >
                      <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0">
                        <ImageWithFallback src={p.image} alt={p.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[#8A8680]" style={{ fontSize: '0.6875rem' }}>{p.brand}</p>
                        <p className="text-[#1A1A1A]" style={{ fontSize: '0.9375rem' }}>{p.name}</p>
                        <p className="text-[#8A8680] mt-1 truncate" style={{ fontSize: '0.75rem' }}>{p.reason}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Save/Compare actions */}
                <div className="flex gap-3 mt-4">
                  <button className="flex-1 py-3 rounded-2xl border border-[#E8E6E1] text-[#8A8680]"
                    style={{ fontSize: '0.875rem' }}>
                    이 추천 저장하기
                  </button>
                  <button className="flex-1 py-3 rounded-2xl bg-[#1A1A1A] text-white"
                    style={{ fontSize: '0.875rem' }}
                    onClick={() => navigateTo('emotion')}>
                    텍스트로도 추천받기
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
