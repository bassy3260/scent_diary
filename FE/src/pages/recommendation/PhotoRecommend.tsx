import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Upload, Camera, X, Sparkles } from 'lucide-react';
import { useAppStore } from '../../store';
import { useRecommendationStore } from '../../store';
import { uploadImageToS3 } from '../../api/s3';
import { ImageWithFallback } from '../../components/common/ImageWithFallback';
import { PRICE_RANGES } from '../../constants/ui.constants';

const SURVEY_STEPS = ['price', 'notePreference'] as const;
type SurveyStep = typeof SURVEY_STEPS[number];

const questionText: Record<SurveyStep, string> = {
  price: '예산은\n어느 정도인가요?',
  notePreference: '어떤 향을\n중요하게 생각하시나요?',
};

const subText: Record<SurveyStep, string> = {
  price: '가격대에 맞는 향수를 추천해드릴게요.',
  notePreference: '향수의 변화 과정에서 중요한 부분을 선택해주세요.',
};

export function PhotoRecommend() {
  const { goBack, navigateTo, setSelectedPerfumeId, updateProfile } = useAppStore();
  const { recommendByImage, imageResult } = useRecommendationStore();
  const results = imageResult?.results ?? [];

  // 설문 단계
  const [surveyStep, setSurveyStep] = useState(0);
  const [surveyDone, setSurveyDone] = useState(false);
  const [priceRange, setPriceRange] = useState('');
  const [notePreference, setNotePreference] = useState('');

  // 이미지 업로드 단계
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const extractedTags = ['차분함', '습한 공기', '우디', '그린', '따뜻한 빛'];

  const currentSurveyKey = SURVEY_STEPS[surveyStep];

  const canProceedSurvey = () => {
    if (currentSurveyKey === 'price') return !!priceRange;
    if (currentSurveyKey === 'notePreference') return !!notePreference;
    return false;
  };

  const handleSurveyBack = () => {
    if (surveyStep > 0) setSurveyStep(surveyStep - 1);
    else goBack();
  };

  const handleSurveyNext = () => {
    if (surveyStep < SURVEY_STEPS.length - 1) {
      setSurveyStep(surveyStep + 1);
    } else {
      updateProfile({ priceRange, notePreference });
      setSurveyDone(true);
    }
  };

  const handleFileSelect = async (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => setUploadedImage(reader.result as string);
    reader.readAsDataURL(file);

    setAnalyzing(true);
    try {
      const fileName = await uploadImageToS3(file);
      await recommendByImage({ image_route: fileName });
    } finally {
      setAnalyzing(false);
      setAnalyzed(true);
    }
  };

  const handleUploadClick = () => fileInputRef.current?.click();

  // ── 설문 화면 ──────────────────────────────────────────
  if (!surveyDone) {
    return (
      <div className="w-full h-full flex flex-col relative" style={{ background: '#FAFAF8' }}>
        {/* Header with progress */}
        <div className="pt-6 px-6">
          <div className="flex items-center gap-3 mb-6">
            <motion.button
              onClick={handleSurveyBack}
              className="text-[#8A8680] w-8 h-8 flex items-center justify-center rounded-full bg-[#F5F3EF]"
              whileTap={{ scale: 0.85 }}
            >
              <ChevronLeft size={18} />
            </motion.button>

            <div className="flex-1 flex items-center gap-1.5">
              {SURVEY_STEPS.map((_, i) => (
                <div key={i} className="flex-1 h-[3px] rounded-full overflow-hidden" style={{ backgroundColor: '#ECEAE5' }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{
                      background:
                        i < surveyStep
                          ? '#6B7B5E'
                          : i === surveyStep
                            ? 'linear-gradient(90deg, #6B7B5E, #8FA380)'
                            : 'transparent',
                    }}
                    initial={{ width: '0%' }}
                    animate={{ width: i <= surveyStep ? '100%' : '0%' }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30, delay: i <= surveyStep ? i * 0.05 : 0 }}
                  />
                </div>
              ))}
            </div>

            <span className="text-[#B8B4AE] min-w-[2rem] text-right" style={{ fontSize: '0.6875rem' }}>
              {surveyStep + 1}/{SURVEY_STEPS.length}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={surveyStep}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            >
              <motion.div
                className="mt-2"
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25, delay: 0.1 }}
              >
                <h1
                  className="whitespace-pre-line text-[#1A1A1A]"
                  style={{ fontSize: '1.75rem', lineHeight: 1.2, fontFamily: "'Playfair Display', serif" }}
                >
                  {questionText[currentSurveyKey]}
                </h1>
                <motion.p
                  className="mt-3 text-[#8A8680]"
                  style={{ fontSize: '0.875rem', lineHeight: 1.6 }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  {subText[currentSurveyKey]}
                </motion.p>
              </motion.div>

              {/* Price 옵션 */}
              {currentSurveyKey === 'price' && (
                <div className="flex flex-col gap-3 mt-6">
                  {PRICE_RANGES.map((priceItem, i) => {
                    const selected = priceRange === priceItem.label;
                    return (
                      <motion.button
                        key={priceItem.label}
                        className="w-full py-4 px-5 rounded-2xl border-2 flex items-center gap-4 text-left relative overflow-hidden"
                        style={{
                          borderColor: selected ? '#6B7B5E' : 'rgba(0,0,0,0.06)',
                          backgroundColor: selected ? '#6B7B5E08' : '#FFFFFF',
                        }}
                        onClick={() => setPriceRange(priceItem.label)}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.08, type: 'spring', stiffness: 500, damping: 30 }}
                        whileTap={{ scale: 0.97 }}
                      >
                        <motion.div
                          className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 overflow-hidden text-2xl"
                          style={{
                            background: selected ? '#6B7B5E15' : '#F5F3EF',
                            boxShadow: selected ? '0 0 0 2.5px #6B7B5E44' : '0 0 0 1.5px rgba(0,0,0,0.06)',
                          }}
                          animate={selected ? { scale: 1.08 } : { scale: 1 }}
                          transition={{ type: 'spring', stiffness: 600, damping: 15 }}
                        >
                          {priceItem.emoji}
                        </motion.div>
                        <div className="flex-1">
                          <p className="text-[#1A1A1A]" style={{ fontSize: '0.9375rem' }}>{priceItem.label}</p>
                        </div>
                        {selected && (
                          <motion.div
                            className="w-6 h-6 rounded-full bg-[#6B7B5E] flex items-center justify-center"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 600, damping: 15 }}
                          >
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                              <path d="M2.5 6L5 8.5L9.5 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </motion.div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              )}

              {/* NotePreference 옵션 */}
              {currentSurveyKey === 'notePreference' && (
                <div className="flex flex-col gap-3 mt-6">
                  {[
                    { key: 'top', emoji: '✨', label: '첫향 (탑노트)', desc: '뿌린 직후 5~10분간 느껴지는 첫인상' },
                    { key: 'middle', emoji: '💫', label: '미들노트 (하트노트)', desc: '향수의 핵심, 30분~2시간 지속되는 향' },
                    { key: 'base', emoji: '🌙', label: '잔향 (베이스노트)', desc: '오래 지속되는 깊고 묵직한 마지막 향' },
                  ].map((item, i) => {
                    const selected = notePreference === item.key;
                    return (
                      <motion.button
                        key={item.key}
                        className="w-full py-4 px-5 rounded-2xl border-2 flex items-center gap-4 text-left relative overflow-hidden"
                        style={{
                          borderColor: selected ? '#6B7B5E' : 'rgba(0,0,0,0.06)',
                          backgroundColor: selected ? '#6B7B5E08' : '#FFFFFF',
                        }}
                        onClick={() => setNotePreference(item.key)}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.08, type: 'spring', stiffness: 500, damping: 30 }}
                        whileTap={{ scale: 0.97 }}
                      >
                        <motion.div
                          className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 overflow-hidden text-2xl"
                          style={{
                            background: selected ? '#6B7B5E15' : '#F5F3EF',
                            boxShadow: selected ? '0 0 0 2.5px #6B7B5E44' : '0 0 0 1.5px rgba(0,0,0,0.06)',
                          }}
                          animate={selected ? { scale: 1.08 } : { scale: 1 }}
                          transition={{ type: 'spring', stiffness: 600, damping: 15 }}
                        >
                          {item.emoji}
                        </motion.div>
                        <div className="flex-1">
                          <p className="text-[#1A1A1A]" style={{ fontSize: '0.9375rem' }}>{item.label}</p>
                          <p className="text-[#B8B4AE] mt-0.5" style={{ fontSize: '0.75rem' }}>{item.desc}</p>
                        </div>
                        {selected && (
                          <motion.div
                            className="w-6 h-6 rounded-full bg-[#6B7B5E] flex items-center justify-center"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 600, damping: 15 }}
                          >
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                              <path d="M2.5 6L5 8.5L9.5 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </motion.div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* CTA Button */}
        <div className="px-6 pb-10 pt-4">
          <motion.button
            className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 tracking-wide"
            style={{
              fontSize: '0.9375rem',
              backgroundColor: canProceedSurvey() ? '#6B7B5E' : '#E8E6E1',
              color: canProceedSurvey() ? '#FAFAF8' : '#B8B4AE',
            }}
            onClick={handleSurveyNext}
            disabled={!canProceedSurvey()}
            whileTap={canProceedSurvey() ? { scale: 0.96 } : {}}
            animate={canProceedSurvey() ? { boxShadow: '0 6px 24px rgba(107,123,94,0.25)' } : { boxShadow: '0 0px 0px rgba(0,0,0,0)' }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            {surveyStep === SURVEY_STEPS.length - 1 ? (
              <>
                <Camera size={16} />
                이미지 업로드로
              </>
            ) : (
              '계속'
            )}
          </motion.button>
        </div>
      </div>
    );
  }

  // ── 이미지 업로드 화면 ─────────────────────────────────
  return (
    <div className="w-full h-full flex flex-col" style={{ background: '#FAFAF8' }}>
      <div className="pt-6 px-6 pb-3 flex items-center gap-3">
        <motion.button
          onClick={() => setSurveyDone(false)}
          className="text-[#8A8680] w-8 h-8 flex items-center justify-center rounded-full bg-[#F5F3EF]"
          whileTap={{ scale: 0.85 }}
        >
          <ChevronLeft size={18} />
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
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleFileSelect(file);
                e.target.value = '';
              }}
            />

            <motion.button
              className="w-full aspect-[4/3] rounded-3xl border-2 border-dashed border-[#E8E6E1] flex flex-col items-center justify-center gap-4"
              style={{ backgroundColor: '#F8F7F4' }}
              onClick={handleUploadClick}
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
                onClick={handleUploadClick}
                whileTap={{ scale: 0.97 }}
              >
                <Camera size={16} /> 갤러리에서 선택
              </motion.button>
            </div>

            <div className="mt-6 p-4 rounded-xl bg-[#F5F3EF]">
              <p className="text-[#8A8680]" style={{ fontSize: '0.75rem', lineHeight: 1.6 }}>
                업로드한 이미지는 추천 분석 용도로만 사용되며, 분석 후 저장되지 않아요. 안심하고 이용해주세요.
              </p>
            </div>

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

                <div className="mt-5">
                  <p className="text-[#B8B4AE] mb-3" style={{ fontSize: '0.6875rem', letterSpacing: '0.08em' }}>
                    이 분위기와 어울리는 향
                  </p>
                  {results.map((p, i) => (
                    <motion.div
                      key={p.perfumeId}
                      className="mb-2.5 flex gap-3 p-3 rounded-2xl"
                      style={{ background: 'linear-gradient(145deg, #FFFFFF, #F8F7F4)', boxShadow: '0 2px 12px rgba(0,0,0,0.03)' }}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + i * 0.1 }}
                      onClick={() => { setSelectedPerfumeId(p.perfumeId); navigateTo('detail'); }}
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

                <div className="flex gap-3 mt-4">
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
