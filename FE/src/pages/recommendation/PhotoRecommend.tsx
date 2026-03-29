import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, Upload, Camera, X, Sparkles } from 'lucide-react';
import { useAppStore } from '../../store';
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
  const { navigateTo, updateProfile, resetProfile } = useAppStore();

  // 설문 단계
  const [surveyStep, setSurveyStep] = useState(0);
  const [surveyDone, setSurveyDone] = useState(false);
  const [priceRange, setPriceRange] = useState('');
  const [notePreference, setNotePreference] = useState('');

  // 이미지 업로드 단계
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentSurveyKey = SURVEY_STEPS[surveyStep];

  const canProceedSurvey = () => {
    if (currentSurveyKey === 'price') return !!priceRange;
    if (currentSurveyKey === 'notePreference') return !!notePreference;
    return false;
  };

  const handleSurveyBack = () => {
    if (surveyStep > 0) {
      setSurveyStep(surveyStep - 1);
    } else {
      resetProfile();
      navigateTo('home');
    }
  };

  const handleSurveyNext = () => {
    if (surveyStep < SURVEY_STEPS.length - 1) {
      setSurveyStep(surveyStep + 1);
    } else {
      updateProfile({ priceRange, notePreference });
      setSurveyDone(true);
    }
  };

  const handleFileSelect = (file: File) => {
    setUploadedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setUploadedImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    updateProfile({ imageRoute: '', priceRange: '', notePreference: '' });
    useAppStore.setState({ imageResult: null, textResult: null, resultsMode: null });
    useAppStore.getState().setSelectedHistoryId(null);
    useAppStore.getState().clearSelectedRecommendationDetail();
  }, []);

  const handleUploadClick = () => fileInputRef.current?.click();

  const [isUploading, setIsUploading] = useState(false);

  const handleRecommend = async () => {
    if (!uploadedFile || isUploading) return;
    setIsUploading(true);
    const { uploadImageToS3 } = await import('../../api/s3');
    const fileName = await uploadImageToS3(uploadedFile);
    updateProfile({ imageRoute: fileName });
    navigateTo('analyzing');
  };

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
                    { key: 'TOP', emoji: '✨', label: '첫향 (탑노트)', desc: '뿌린 직후 5~10분간 느껴지는 첫인상' },
                    { key: 'MIDDLE', emoji: '💫', label: '미들노트 (하트노트)', desc: '향수의 핵심, 30분~2시간 지속되는 향' },
                    { key: 'BASE', emoji: '🌙', label: '잔향 (베이스노트)', desc: '오래 지속되는 깊고 묵직한 마지막 향' },
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
      <div className="pt-6 px-6 pb-3">
        <motion.button
          onClick={() => setSurveyDone(false)}
          className="mb-4 text-[#8A8680] w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F5F3EF]"
          whileTap={{ scale: 0.85 }}
        >
          <ChevronLeft size={22} />
        </motion.button>

        {/* 설문 선택 결과 칩 */}
        <div className="flex flex-wrap gap-2 mb-4">
          {priceRange && (
            <motion.span
              className="px-3 py-1.5 rounded-full text-[#8A8680] border border-[#E8E6E1]"
              style={{ fontSize: '0.75rem' }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 20 }}
            >
              {priceRange}
            </motion.span>
          )}
          {notePreference && (
            <motion.span
              className="px-3 py-1.5 rounded-full text-[#8A8680] border border-[#E8E6E1]"
              style={{ fontSize: '0.75rem' }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 20, delay: 0.05 }}
            >
              {notePreference === 'TOP' ? '첫향' : notePreference === 'MIDDLE' ? '미들노트' : '잔향'}
            </motion.span>
          )}
        </div>

        <h1 className="text-[#1A1A1A]" style={{ fontSize: '1.875rem', lineHeight: 1.2, fontFamily: "'Playfair Display', serif" }}>
          패션 사진으로<br/>어울리는 향을 찾아드려요
        </h1>
        <p className="mt-3 text-[#8A8680]" style={{ fontSize: '0.875rem', lineHeight: 1.6 }}>
          전신이 나온 패션 사진을 올려주세요.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-6">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileSelect(file);
            e.target.value = '';
          }}
        />

        <motion.div
          className="mt-4"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {!uploadedImage ? (
            /* 업로드 전: 세로 직사각형 업로드 영역 */
            <>
              <motion.button
                className="w-full rounded-3xl border-2 border-dashed border-[#E8E6E1] flex flex-col items-center justify-center gap-4"
                style={{ backgroundColor: '#F8F7F4', aspectRatio: '3 / 4' }}
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

            </>
          ) : (
            /* 업로드 후: 세로 직사각형 미리보기 + 추천받기 버튼 */
            <>
              <div
                className="relative w-full rounded-2xl overflow-hidden"
                style={{ aspectRatio: '3 / 4', backgroundColor: '#1A1A1A' }}
              >
                <ImageWithFallback
                  src={uploadedImage}
                  alt="uploaded"
                  className="w-full h-full object-contain"
                />
                <motion.button
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/70 flex items-center justify-center"
                  onClick={() => { setUploadedImage(null); }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X size={14} />
                </motion.button>
              </div>

              <div className="mt-5">
                <motion.button
                  className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 tracking-wide"
                  style={{
                    fontSize: '0.9375rem',
                    backgroundColor: '#6B7B5E',
                    color: '#FAFAF8',
                  }}
                  onClick={handleRecommend}
                  disabled={isUploading}
                  whileTap={!isUploading ? { scale: 0.96 } : {}}
                  animate={{ boxShadow: isUploading ? 'none' : '0 6px 24px rgba(107,123,94,0.25)', opacity: isUploading ? 0.6 : 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                >
                  {isUploading ? (
                    <>
                      <motion.div
                        className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                      />
                      분석 준비 중...
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      추천받기
                    </>
                  )}
                </motion.button>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}