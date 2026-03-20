import { useState } from "react";
import { motion } from "motion/react";
import { ChevronLeft, Eye, EyeOff, Check } from "lucide-react";
import { authApi } from "../../api";
import type { Gender } from "../../types";

interface SignUpScreenProps {
  onBack: () => void;
  onComplete: () => void;
}

const GENDER_OPTIONS: Array<{ label: string; value: Gender }> = [
  { label: "여성", value: "FEMALE" },
  { label: "남성", value: "MALE" },
  { label: "선택 안 함", value: "NONE" },
];

export function SignUpScreen({ onBack, onComplete }: SignUpScreenProps) {
  const currentYear = new Date().getFullYear();
  const [id, setId] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [gender, setGender] = useState<Gender | "">("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const parsedBirthYear = Number(birthYear);
  const isIdValid = id.trim().length > 0;
  const isPasswordValid = password.length > 0;
  const isConfirmValid =
    password === confirmPassword && confirmPassword.length > 0;
  const isNicknameValid = nickname.trim().length > 0;
  const isBirthYearValid =
    /^\d{4}$/.test(birthYear) &&
    parsedBirthYear >= 1900 &&
    parsedBirthYear <= currentYear;
  const isGenderValid = gender !== "";

  const canSubmit =
    isIdValid &&
    isPasswordValid &&
    isConfirmValid &&
    isNicknameValid &&
    isBirthYearValid &&
    isGenderValid &&
    agreed;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setLoading(true);
    setErrorMessage("");

    try {
      await authApi.signup({
        id: id.trim(),
        password,
        nickname: nickname.trim(),
        birthYear: parsedBirthYear,
        gender: gender as Gender,
      });

      setSubmitted(true);
      window.setTimeout(() => {
        onComplete();
      }, 1200);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "회원가입에 실패했습니다.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div
        className="w-full h-full flex flex-col items-center justify-center"
        style={{ background: "#FAFAF8" }}
      >
        <motion.div
          className="flex flex-col items-center gap-4"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          <motion.div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #6B7B5E, #8FA380)" }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 20,
              delay: 0.1,
            }}
          >
            <Check size={28} className="text-white" />
          </motion.div>
          <p
            className="text-[#1A1A1A]"
            style={{
              fontSize: "1.125rem",
              fontFamily: "'Playfair Display', serif",
            }}
          >
            회원가입이 완료되었어요
          </p>
          <p className="text-[#B8B4AE]" style={{ fontSize: "0.875rem" }}>
            로그인 화면으로 이동합니다
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      className="w-full h-full flex flex-col"
      style={{ background: "#FAFAF8" }}
    >
      <div className="pt-6 px-6 pb-4 flex items-center gap-3 shrink-0">
        <motion.button
          className="w-9 h-9 rounded-full bg-[#F5F3EF] flex items-center justify-center"
          onClick={onBack}
          whileTap={{ scale: 0.9 }}
        >
          <ChevronLeft size={18} className="text-[#8A8680]" />
        </motion.button>
        <div>
          <p
            className="text-[#B8B4AE]"
            style={{ fontSize: "0.6875rem", letterSpacing: "0.1em" }}
          >
            SIGN UP
          </p>
          <h2
            className="text-[#1A1A1A]"
            style={{
              fontSize: "1.375rem",
              fontFamily: "'Playfair Display', serif",
            }}
          >
            회원가입
          </h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <div className="mb-5">
          <label
            className="block text-[#B8B4AE] mb-2"
            style={{ fontSize: "0.6875rem", letterSpacing: "0.08em" }}
          >
            닉네임
          </label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => {
              setNickname(e.target.value);
              setErrorMessage("");
            }}
            placeholder="닉네임을 입력해 주세요"
            className="w-full px-4 py-3.5 rounded-2xl bg-white border text-[#1A1A1A] placeholder:text-[#D4D0C8] outline-none transition-colors"
            style={{
              fontSize: "0.9375rem",
              borderColor:
                nickname.length > 0
                  ? isNicknameValid
                    ? "#6B7B5E"
                    : "#E8E6E1"
                  : "#E8E6E1",
            }}
            maxLength={12}
          />
          <p
            className="text-[#B8B4AE] mt-1.5 text-right"
            style={{ fontSize: "0.6875rem" }}
          >
            {nickname.length}/12
          </p>
        </div>

        <div className="mb-5">
          <label
            className="block text-[#B8B4AE] mb-2"
            style={{ fontSize: "0.6875rem", letterSpacing: "0.08em" }}
          >
            아이디
          </label>
          <input
            type="text"
            value={id}
            onChange={(e) => {
              setId(e.target.value);
              setErrorMessage("");
            }}
            placeholder="아이디를 입력해 주세요"
            className="w-full px-4 py-3.5 rounded-2xl bg-white border text-[#1A1A1A] placeholder:text-[#D4D0C8] outline-none transition-colors"
            style={{
              fontSize: "0.9375rem",
              borderColor: id.length > 0 ? "#6B7B5E" : "#E8E6E1",
            }}
            autoComplete="username"
          />
        </div>

        <div className="mb-5">
          <label
            className="block text-[#B8B4AE] mb-2"
            style={{ fontSize: "0.6875rem", letterSpacing: "0.08em" }}
          >
            비밀번호
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setErrorMessage("");
              }}
              placeholder="비밀번호를 입력해 주세요"
              className="w-full px-4 py-3.5 pr-12 rounded-2xl bg-white border text-[#1A1A1A] placeholder:text-[#D4D0C8] outline-none transition-colors"
              style={{
                fontSize: "0.9375rem",
                borderColor: password.length > 0 ? "#6B7B5E" : "#E8E6E1",
              }}
              autoComplete="new-password"
            />
            <button
              type="button"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#B8B4AE]"
              onClick={() => setShowPassword((value) => !value)}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div className="mb-6">
          <label
            className="block text-[#B8B4AE] mb-2"
            style={{ fontSize: "0.6875rem", letterSpacing: "0.08em" }}
          >
            비밀번호 확인
          </label>
          <div className="relative">
            <input
              type={showConfirm ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setErrorMessage("");
              }}
              placeholder="비밀번호를 한 번 더 입력해 주세요"
              className="w-full px-4 py-3.5 pr-12 rounded-2xl bg-white border text-[#1A1A1A] placeholder:text-[#D4D0C8] outline-none transition-colors"
              style={{
                fontSize: "0.9375rem",
                borderColor:
                  confirmPassword.length > 0
                    ? isConfirmValid
                      ? "#6B7B5E"
                      : "#E8E6E1"
                    : "#E8E6E1",
              }}
              autoComplete="new-password"
            />
            <button
              type="button"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#B8B4AE]"
              onClick={() => setShowConfirm((value) => !value)}
            >
              {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {confirmPassword.length > 0 && !isConfirmValid && (
            <p
              className="text-[#C4956A] mt-1"
              style={{ fontSize: "0.6875rem" }}
            >
              비밀번호가 일치하지 않습니다.
            </p>
          )}
        </div>

        <div className="mb-5">
          <label
            className="block text-[#B8B4AE] mb-2"
            style={{ fontSize: "0.6875rem", letterSpacing: "0.08em" }}
          >
            출생연도
          </label>
          <input
            type="number"
            value={birthYear}
            onChange={(e) => {
              setBirthYear(e.target.value);
              setErrorMessage("");
            }}
            placeholder="예: 1998"
            className="w-full px-4 py-3.5 rounded-2xl bg-white border text-[#1A1A1A] placeholder:text-[#D4D0C8] outline-none transition-colors"
            style={{
              fontSize: "0.9375rem",
              borderColor:
                birthYear.length > 0
                  ? isBirthYearValid
                    ? "#6B7B5E"
                    : "#E8E6E1"
                  : "#E8E6E1",
            }}
            inputMode="numeric"
          />
          {birthYear.length > 0 && !isBirthYearValid && (
            <p
              className="text-[#C4956A] mt-1"
              style={{ fontSize: "0.6875rem" }}
            >
              1900년부터 {currentYear}년 사이의 4자리 연도를 입력해 주세요.
            </p>
          )}
        </div>

        <div className="mb-6">
          <label
            className="block text-[#B8B4AE] mb-3"
            style={{ fontSize: "0.6875rem", letterSpacing: "0.08em" }}
          >
            성별
          </label>
          <div className="grid grid-cols-3 gap-2">
            {GENDER_OPTIONS.map((option) => (
              <motion.button
                key={option.value}
                type="button"
                className="py-3 rounded-xl transition-colors"
                style={{
                  background:
                    gender === option.value
                      ? "linear-gradient(135deg, #6B7B5E, #8FA380)"
                      : "#FFFFFF",
                  color: gender === option.value ? "#FFFFFF" : "#8A8680",
                  fontSize: "0.875rem",
                  border:
                    gender === option.value ? "none" : "1px solid #E8E6E1",
                }}
                onClick={() => {
                  setGender(option.value);
                  setErrorMessage("");
                }}
                whileTap={{ scale: 0.97 }}
              >
                {option.label}
              </motion.button>
            ))}
          </div>
        </div>

        <motion.button
          className="w-full flex items-center gap-3 p-4 rounded-2xl mb-6"
          style={{
            backgroundColor: agreed ? "#6B7B5E08" : "#F5F3EF",
            border: `1.5px solid ${agreed ? "#6B7B5E30" : "transparent"}`,
          }}
          onClick={() => setAgreed((value) => !value)}
          whileTap={{ scale: 0.98 }}
        >
          <motion.div
            className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: agreed ? "#6B7B5E" : "#E8E6E1" }}
            animate={{ backgroundColor: agreed ? "#6B7B5E" : "#E8E6E1" }}
            transition={{ duration: 0.18 }}
          >
            {agreed && <Check size={11} className="text-white" />}
          </motion.div>
          <p
            className="text-left text-[#8A8680]"
            style={{ fontSize: "0.8125rem", lineHeight: 1.5 }}
          >
            <span className="text-[#1A1A1A]">이용약관</span> 및{" "}
            <span className="text-[#1A1A1A]">개인정보 처리방침</span>에
            동의합니다.
          </p>
        </motion.button>

        <motion.button
          className="w-full py-4 rounded-2xl tracking-wide"
          style={{
            fontSize: "0.9375rem",
            background: canSubmit
              ? "linear-gradient(135deg, #6B7B5E 0%, #8FA380 100%)"
              : "#E8E6E1",
            color: canSubmit ? "#FAFAF8" : "#B8B4AE",
            boxShadow: canSubmit ? "0 6px 24px rgba(107,123,94,0.25)" : "none",
          }}
          onClick={() => {
            void handleSubmit();
          }}
          disabled={!canSubmit || loading}
          whileTap={canSubmit ? { scale: 0.97 } : {}}
          transition={{ duration: 0.15 }}
        >
          {loading ? "가입 중..." : "가입하기"}
        </motion.button>

        {errorMessage && (
          <p
            className="mt-3 text-center text-[#C45050]"
            style={{ fontSize: "0.8125rem" }}
          >
            {errorMessage}
          </p>
        )}
      </div>
    </div>
  );
}
