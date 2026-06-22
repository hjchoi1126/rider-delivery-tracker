const USER_ID_STORAGE_KEY = 'rider-user-id';

/** 환경변수 또는 localStorage 기반 라이더 user_id 반환 */
export const GetUserIdLogic = (): string => {
  const fromEnv = import.meta.env.VITE_USER_ID;
  if (fromEnv) return fromEnv;

  const stored = localStorage.getItem(USER_ID_STORAGE_KEY);
  if (stored) return stored;

  const generated = crypto.randomUUID();
  localStorage.setItem(USER_ID_STORAGE_KEY, generated);
  return generated;
};
