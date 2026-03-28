import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  ChevronRight,
  BookOpen,
  Clock,
  Heart,
  Package,
  Edit2,
  X,
  LogOut,
} from "lucide-react";
import { useAppStore } from "../../store";
import { PROFILE_GENDERS } from "../../constants/ui.constants";
import { buildAccordStats } from "../../utils/mypage";
import { toApiGender } from "../../utils/userProfile";

export function MyPage() {
  const navigateTo = useAppStore((state) => state.navigateTo);
  const logout = useAppStore((state) => state.logout);
  const profile = useAppStore((state) => state.profile);
  const updateMe = useAppStore((state) => state.updateMe);
const likedPerfumes = useAppStore((state) => state.likedPerfumes);
  const likesPageInfo = useAppStore((state) => state.likesPageInfo);
  const myPerfumes = useAppStore((state) => state.myPerfumes);
  const myPerfumesPageInfo = useAppStore((state) => state.myPerfumesPageInfo);
  const myReviews = useAppStore((state) => state.myReviews);
  const myReviewsPageInfo = useAppStore((state) => state.myReviewsPageInfo);
  const recommendationHistory = useAppStore(
    (state) => state.recommendationHistory,
  );
  const recommendationHistoryPageInfo = useAppStore(
    (state) => state.recommendationHistoryPageInfo,
  );
  const fetchLikes = useAppStore((state) => state.fetchLikes);
  const fetchMyPerfumes = useAppStore((state) => state.fetchMyPerfumes);
  const fetchMyReviews = useAppStore((state) => state.fetchMyReviews);
  const fetchRecommendationHistory = useAppStore(
    (state) => state.fetchRecommendationHistory,
  );
  const loading = useAppStore((state) => state.loading);
  const error = useAppStore((state) => state.error);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editNickname, setEditNickname] = useState(profile.nickname || "");
  const [editBirthYear, setEditBirthYear] = useState(profile.birthYear ? String(profile.birthYear) : "");
  const [editGender, setEditGender] = useState(profile.gender || "");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSaveError, setProfileSaveError] = useState("");

  useEffect(() => {
    void Promise.all([
      fetchLikes(),
      fetchMyPerfumes(),
      fetchMyReviews(),
      fetchRecommendationHistory(),
    ]);
  }, [fetchLikes, fetchMyPerfumes, fetchMyReviews, fetchRecommendationHistory]);

  const tasteSource = likedPerfumes.length > 0 ? likedPerfumes : myPerfumes;
  const topAccords = useMemo(
    () => buildAccordStats(tasteSource).slice(0, 4),
    [tasteSource],
  );

  const likesCount = likesPageInfo?.totalElements ?? likedPerfumes.length;
  const myPerfumesCount =
    myPerfumesPageInfo?.totalElements ?? myPerfumes.length;
  const reviewsCount = myReviewsPageInfo?.totalElements ?? myReviews.length;
  const historyCount =
    recommendationHistoryPageInfo?.totalElements ??
    recommendationHistory.length;

  const handleSaveProfile = async () => {
    const nickname = editNickname.trim();
    const birthYear = Number(editBirthYear);
    const currentYear = new Date().getFullYear();

    if (!nickname || !editGender || !editBirthYear) {
      return;
    }

    if (!/^\d{4}$/.test(editBirthYear) || birthYear < 1900 || birthYear > currentYear) {
      setProfileSaveError(`1900~${currentYear} 사이의 연도를 입력해 주세요.`);
      return;
    }

    setIsSavingProfile(true);
    setProfileSaveError("");

    try {
      await updateMe({
        nickname,
        birthYear,
        gender: toApiGender(editGender),
      });
      setShowEditModal(false);
    } catch (saveError) {
      setProfileSaveError(
        saveError instanceof Error
          ? saveError.message
          : "프로필 저장에 실패했어요. 다시 시도해 주세요.",
      );
    } finally {
      setIsSavingProfile(false);
    }
  };

  return (
    <div
      className="w-full h-full flex flex-col"
      style={{ background: "#FAFAF8" }}
    >
      <div className="pt-6 px-6 pb-3">
        <p
          className="text-[#B8B4AE]"
          style={{ fontSize: "0.6875rem", letterSpacing: "0.1em" }}
        >
          MY SCENT LOUNGE
        </p>
        <h2
          className="mt-1 text-[#1A1A1A]"
          style={{
            fontSize: "1.5rem",
            fontFamily: "'Playfair Display', serif",
          }}
        >
          나의 향 라운지
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-28">
        {(loading || error) && (
          <div className="mb-4 space-y-2">
            {loading && (
              <p className="text-[#8A8680]" style={{ fontSize: "0.75rem" }}>
                마이페이지 데이터를 불러오는 중이에요.
              </p>
            )}
            {error && (
              <div
                className="px-4 py-3 rounded-2xl text-[#C45050]"
                style={{
                  backgroundColor: "rgba(196, 80, 80, 0.08)",
                  fontSize: "0.8125rem",
                }}
              >
                {error}
              </div>
            )}
          </div>
        )}

        <motion.div
          className="p-5 rounded-2xl relative"
          style={{
            background: "linear-gradient(135deg, #1A1A1A 0%, #2A2A28 100%)",
          }}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <motion.button
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
            onClick={() => {
              setEditNickname(profile.nickname || "");
              setEditBirthYear(profile.birthYear ? String(profile.birthYear) : "");
              setEditGender(profile.gender || "");
              setProfileSaveError("");
              setShowEditModal(true);
            }}
            whileTap={{ scale: 0.9 }}
          >
            <Edit2 size={14} className="text-white/70" />
          </motion.button>
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{
                background:
                  "linear-gradient(135deg, #6B7B5E40 0%, #B8A88A30 100%)",
              }}
            >
              <span style={{ fontSize: "1.5rem" }}>향</span>
            </div>
            <div>
              <p className="text-white" style={{ fontSize: "1rem" }}>
                {profile.nickname || "향을 기록하는 사용자"}
              </p>
              <p
                className="text-white/50 mt-0.5"
                style={{ fontSize: "0.75rem" }}
              >
                {profile.gender || "미설정"} · {profile.birthYear ? `${profile.birthYear}년생` : "미설정"}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="text-center">
              <p className="text-white" style={{ fontSize: "1.25rem" }}>
                {likesCount}
              </p>
              <p className="text-white/40" style={{ fontSize: "0.6875rem" }}>
                좋아요 향수
              </p>
            </div>
            <div className="text-center">
              <p className="text-white" style={{ fontSize: "1.25rem" }}>
                {reviewsCount}
              </p>
              <p className="text-white/40" style={{ fontSize: "0.6875rem" }}>
                내 리뷰
              </p>
            </div>
            <div className="text-center">
              <p className="text-white" style={{ fontSize: "1.25rem" }}>
                {historyCount}
              </p>
              <p className="text-white/40" style={{ fontSize: "0.6875rem" }}>
                추천 기록
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="mt-5 p-4 rounded-2xl bg-[#F5F3EF]"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center justify-between mb-3">
            <p
              className="text-[#B8B4AE]"
              style={{ fontSize: "0.6875rem", letterSpacing: "0.08em" }}
            >
              취향 요약
            </p>
            <button
              className="text-[#6B7B5E] flex items-center gap-0.5"
              style={{ fontSize: "0.6875rem" }}
              onClick={() => navigateTo("taste-profile")}
            >
              상세 보기 <ChevronRight size={12} />
            </button>
          </div>
          {topAccords.length > 0 ? (
            <div className="flex gap-3">
              {topAccords.map((accord) => (
                <div
                  key={accord.name}
                  className="flex-1 flex flex-col items-center"
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center mb-1"
                    style={{ backgroundColor: `${accord.color}18` }}
                  >
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: `${accord.color}70` }}
                    />
                  </div>
                  <span
                    className="text-[#1A1A1A] text-center"
                    style={{ fontSize: "0.6875rem" }}
                  >
                    {accord.name}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p
              className="text-[#8A8680]"
              style={{ fontSize: "0.8125rem", lineHeight: 1.7 }}
            >
              마이 컬렉션 향수가 쌓이면 취향 요약이 여기에 표시돼요.
            </p>
          )}
        </motion.div>

        <div className="grid grid-cols-2 gap-3 mt-5">
          {[
            {
              icon: Heart,
              label: "좋아요 향수",
              count: likesCount,
              screen: "collection" as const,
              color: "#C8A5A5",
            },
            {
              icon: Clock,
              label: "추천 히스토리",
              count: historyCount,
              screen: "history" as const,
              color: "#8BA4B8",
            },
            {
              icon: Package,
              label: "마이 컬렉션",
              count: myPerfumesCount,
              screen: "my-collection" as const,
              color: "#9BA88B",
            },
            {
              icon: BookOpen,
              label: "내 리뷰",
              count: reviewsCount,
              screen: "my-reviews" as const,
              color: "#B8A88A",
            },
          ].map((item, index) => (
            <motion.button
              key={item.label}
              className="p-4 rounded-2xl text-left"
              style={{
                background: "linear-gradient(145deg, #FFFFFF, #F8F7F4)",
                boxShadow: "0 2px 12px rgba(0,0,0,0.03)",
              }}
              onClick={() => navigateTo(item.screen)}
              whileTap={{ scale: 0.97 }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + index * 0.06 }}
            >
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center mb-2"
                style={{ backgroundColor: `${item.color}12` }}
              >
                <item.icon size={16} style={{ color: item.color }} />
              </div>
              <p className="text-[#1A1A1A]" style={{ fontSize: "0.875rem" }}>
                {item.label}
              </p>
              <p
                className="text-[#B8B4AE] mt-0.5"
                style={{ fontSize: "0.6875rem" }}
              >
                {item.count}개
              </p>
            </motion.button>
          ))}
        </div>

        <motion.button
          className="w-full mt-6 py-3.5 rounded-2xl flex items-center justify-center gap-2 text-[#C45050]"
          style={{ backgroundColor: 'rgba(196,80,80,0.07)', fontSize: '0.875rem' }}
          onClick={() => void logout()}
          whileTap={{ scale: 0.97 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <LogOut size={15} />
          로그아웃
        </motion.button>
      </div>

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
            style={{ boxShadow: "0 20px 50px rgba(0,0,0,0.2)" }}
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h3
                className="text-[#1A1A1A]"
                style={{
                  fontSize: "1.25rem",
                  fontFamily: "'Playfair Display', serif",
                }}
              >
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

            <div className="mb-5">
              <label
                className="block text-[#B8B4AE] mb-2"
                style={{ fontSize: "0.6875rem", letterSpacing: "0.08em" }}
              >
                닉네임
              </label>
              <input
                type="text"
                value={editNickname}
                onChange={(event) => setEditNickname(event.target.value)}
                placeholder="닉네임을 입력해 주세요"
                className="w-full px-4 py-3 rounded-xl bg-[#FAFAF8] border border-[#E8E6E1] text-[#1A1A1A] placeholder:text-[#D4D0C8] focus:outline-none focus:border-[#6B7B5E] transition-colors"
                style={{ fontSize: "0.9375rem" }}
                maxLength={12}
              />
              <p
                className="text-[#B8B4AE] mt-1.5 text-right"
                style={{ fontSize: "0.6875rem" }}
              >
                {editNickname.length}/12
              </p>
            </div>

            <div className="mb-5">
              <label
                className="block text-[#B8B4AE] mb-3"
                style={{ fontSize: "0.6875rem", letterSpacing: "0.08em" }}
              >
                성별
              </label>
              <div className="grid grid-cols-3 gap-2">
                {PROFILE_GENDERS.map((gender) => (
                  <motion.button
                    key={gender}
                    className="py-3 rounded-xl transition-colors"
                    style={{
                      background:
                        editGender === gender
                          ? "linear-gradient(135deg, #6B7B5E, #8FA380)"
                          : "#FAFAF8",
                      color: editGender === gender ? "#FFFFFF" : "#8A8680",
                      fontSize: "0.875rem",
                      border:
                        editGender === gender ? "none" : "1px solid #E8E6E1",
                    }}
                    onClick={() => setEditGender(gender)}
                    whileTap={{ scale: 0.97 }}
                  >
                    {gender}
                  </motion.button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label
                className="block text-[#B8B4AE] mb-2"
                style={{ fontSize: "0.6875rem", letterSpacing: "0.08em" }}
              >
                출생연도
              </label>
              <input
                type="number"
                value={editBirthYear}
                onChange={(e) => setEditBirthYear(e.target.value)}
                placeholder={`예: 1998`}
                className="w-full px-4 py-3 rounded-xl bg-[#FAFAF8] border border-[#E8E6E1] text-[#1A1A1A] placeholder:text-[#D4D0C8] focus:outline-none focus:border-[#6B7B5E] transition-colors"
                style={{ fontSize: "0.9375rem" }}
                min={1900}
                max={new Date().getFullYear()}
              />
            </div>

            {profileSaveError && (
              <p
                className="text-[#C45050] mb-4"
                style={{ fontSize: "0.8125rem", lineHeight: 1.5 }}
              >
                {profileSaveError}
              </p>
            )}

            <motion.button
              className="w-full py-4 rounded-2xl tracking-wide transition-all"
              style={{
                background:
                  editNickname.trim() &&
                  editGender &&
                  editBirthYear &&
                  !isSavingProfile
                    ? "#1A1A1A"
                    : "#E8E6E1",
                color:
                  editNickname.trim() &&
                  editGender &&
                  editBirthYear &&
                  !isSavingProfile
                    ? "#FFFFFF"
                    : "#B8B4AE",
                fontSize: "0.9375rem",
              }}
              onClick={() => {
                void handleSaveProfile();
              }}
              disabled={
                !editNickname.trim() ||
                !editGender ||
                !editBirthYear ||
                isSavingProfile
              }
              whileTap={
                editNickname.trim() &&
                editGender &&
                editBirthYear &&
                !isSavingProfile
                  ? { scale: 0.98 }
                  : {}
              }
            >
              저장
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
