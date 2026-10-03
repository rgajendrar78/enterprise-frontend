import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Permission } from "@/constants/app";
import type { AuthSession, AuthUser } from "@/types/user";
import { clearAuthCookie, setAuthCookie } from "@/utils/auth-cookie";

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  /** False until the persisted state has been read — guards against redirect loops. */
  hydrated: boolean;
  setSession: (session: AuthSession) => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      user: null,
      hydrated: false,

      setSession: (session) => {
        setAuthCookie(session.accessToken);
        set({
          token: session.accessToken,
          refreshToken: session.refreshToken,
          user: session.user,
        });
      },

      signOut: () => {
        clearAuthCookie();
        set({ token: null, refreshToken: null, user: null });
      },
    }),
    {
      name: "auth",
      storage: createJSONStorage(() => localStorage),
      // localStorage does not exist during the server render.
      skipHydration: true,
      partialize: ({ token, refreshToken, user }) => ({ token, refreshToken, user }),
      onRehydrateStorage: () => () => useAuthStore.setState({ hydrated: true }),
    },
  ),
);

export function hasPermission(user: AuthUser | null, permission: Permission): boolean {
  return user?.permissions.includes(permission) ?? false;
}
