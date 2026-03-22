import { useState } from "react";
import { motion } from "motion/react";
import { ChevronLeft, Eye, EyeOff } from "lucide-react";
import { authApi } from "../../api";
import { useAppStore } from "../../store";

interface LoginScreenProps {
  onBack: () => void;
  onComplete: () => void;
  onGoSignup: () => void;
}

export function LoginScreen({
  onBack,
  onComplete,
  onGoSignup,
}: LoginScreenProps) {
  const { setAuthenticated, clearAuthState, updateProfile } = useAppStore();
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const isIdValid = loginId.trim().length > 0;
  const canSubmit = isIdValid && password.length > 0;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setLoading(true);
    setErrorMessage("");

    try {
      const { accessToken } = await authApi.login({
        id: loginId.trim(),
        password,
      });

      setAuthenticated(accessToken);

      const me = await authApi.getMe();
      updateProfile({ nickname: me.nickname ?? "" });

      onComplete();
    } catch (error) {
      clearAuthState();
      setErrorMessage(
        error instanceof Error ? error.message : "로그인에 실패했습니다.",
      );
    } finally {
      setLoading(false);
    }
  };

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
            LOG IN
          </p>
          <h2
            className="text-[#1A1A1A]"
            style={{
              fontSize: "1.375rem",
              fontFamily: "'Playfair Display', serif",
            }}
          >
            로그인
          </h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <div className="mb-5">
          <label
            className="block text-[#B8B4AE] mb-2"
            style={{ fontSize: "0.6875rem", letterSpacing: "0.08em" }}
          >
            아이디
          </label>
          <input
            type="text"
            value={loginId}
            onChange={(e) => {
              setLoginId(e.target.value);
              setErrorMessage("");
            }}
            placeholder="아이디를 입력해 주세요"
            className="w-full px-4 py-3.5 rounded-2xl bg-white border text-[#1A1A1A] placeholder:text-[#D4D0C8] outline-none transition-colors"
            style={{
              fontSize: "0.9375rem",
              borderColor: loginId.trim().length > 0 ? "#6B7B5E" : "#E8E6E1",
            }}
            autoComplete="username"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                void handleSubmit();
              }
            }}
          />
        </div>

        <div className="mb-8">
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
              autoComplete="current-password"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  void handleSubmit();
                }
              }}
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

        <motion.button
          className="w-full py-4 rounded-2xl tracking-wide"
          style={{
            fontSize: "0.9375rem",
            backgroundColor: canSubmit ? "#1A1A1A" : "#E8E6E1",
            color: canSubmit ? "#FAFAF8" : "#B8B4AE",
          }}
          onClick={() => {
            void handleSubmit();
          }}
          disabled={!canSubmit || loading}
          whileTap={canSubmit ? { scale: 0.97 } : {}}
        >
          {loading ? "로그인 중..." : "로그인"}
        </motion.button>

        {errorMessage && (
          <p
            className="mt-3 text-center text-[#C45050]"
            style={{ fontSize: "0.8125rem" }}
          >
            {errorMessage}
          </p>
        )}

        <div className="flex items-center justify-center gap-1.5 mt-6">
          <span className="text-[#B8B4AE]" style={{ fontSize: "0.875rem" }}>
            아직 계정이 없으신가요?
          </span>
          <motion.button
            className="text-[#6B7B5E] underline underline-offset-2"
            style={{ fontSize: "0.875rem" }}
            onClick={onGoSignup}
            whileTap={{ scale: 0.96 }}
          >
            회원가입
          </motion.button>
        </div>
      </div>
    </div>
  );
}
