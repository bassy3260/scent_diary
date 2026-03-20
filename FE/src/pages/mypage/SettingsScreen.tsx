/**
 * SettingsScreen
 */
import { useState } from "react";
import { motion } from "motion/react";
import { useAppStore } from "../../store";

export function SettingsScreen() {
  const { navigateTo, setScreen, logout } = useAppStore();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);

    try {
      await logout();
    } catch {
      // Keep the local state consistent even if the backend call fails.
    } finally {
      setScreen("auth-entry");
      setIsLoggingOut(false);
    }
  };

  const menuItems = [
    "향 취향 설정",
    "알림 설정",
    "개인정보 및 데이터",
    "향기로그에 대하여",
  ];

  return (
    <div
      className="w-full h-full flex flex-col"
      style={{ background: "#FAFAF8" }}
    >
      <div className="pt-6 px-6 pb-3 flex items-center gap-3">
        <motion.button
          onClick={() => navigateTo("mypage")}
          whileTap={{ scale: 0.95 }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#8A8680"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
        </motion.button>
        <h3
          className="text-[#1A1A1A]"
          style={{
            fontSize: "1.25rem",
            fontFamily: "'Playfair Display', serif",
          }}
        >
          설정
        </h3>
      </div>

      <div className="flex-1 px-6">
        <div className="mt-4 space-y-2">
          {menuItems.map((item) => (
            <div
              key={item}
              className="flex items-center justify-between py-4 px-4 rounded-xl bg-white/60"
            >
              <span
                className="text-[#1A1A1A]"
                style={{ fontSize: "0.9375rem" }}
              >
                {item}
              </span>
              <span className="text-[#B8B4AE]" style={{ fontSize: "0.875rem" }}>
                &rsaquo;
              </span>
            </div>
          ))}

          <motion.div
            className="flex items-center justify-between py-4 px-4 rounded-xl bg-white/60 cursor-pointer"
            onClick={() => navigateTo("signup")}
            whileTap={{ scale: 0.98 }}
          >
            <span className="text-[#1A1A1A]" style={{ fontSize: "0.9375rem" }}>
              회원가입
            </span>
            <span className="text-[#B8B4AE]" style={{ fontSize: "0.875rem" }}>
              &rsaquo;
            </span>
          </motion.div>

          <motion.div
            className="flex items-center justify-between py-4 px-4 rounded-xl cursor-pointer"
            style={{ backgroundColor: "rgba(196,80,80,0.05)" }}
            onClick={() => {
              void handleLogout();
            }}
            whileTap={{ scale: 0.98 }}
          >
            <span style={{ fontSize: "0.9375rem", color: "#C45050" }}>
              {isLoggingOut ? "로그아웃 중..." : "로그아웃"}
            </span>
          </motion.div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-[#B8B4AE]" style={{ fontSize: "0.75rem" }}>
            향기로그 v1.0
          </p>
          <p className="text-[#D4D0CA] mt-1" style={{ fontSize: "0.6875rem" }}>
            감정과 향기로
          </p>
        </div>
      </div>
    </div>
  );
}
