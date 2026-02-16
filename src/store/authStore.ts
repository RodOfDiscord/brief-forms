import { create } from 'zustand';

interface AuthState {
    isLoggedIn: boolean;
    email: string | null;
    setLoggedIn: (email: string) => void;
    setLoggedOut: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    isLoggedIn: false,
    email: null,
    setLoggedIn: (email: string) => set({ isLoggedIn: true, email }),
    setLoggedOut: () => set({ isLoggedIn: false, email: null }),
}));
