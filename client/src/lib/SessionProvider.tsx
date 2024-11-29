import React, { createContext, useContext, useState } from 'react';
import axios from 'axios';
import { useUser } from '@/lib/UserProvider';
import { CreateSessionState } from '@/utils/types';

interface SessionState {
    accessToken: string | null;
    isLoggedIn: boolean | null;
}

interface SessionContextType {
    session: SessionState | null;
    isLoading: boolean;
    getSession: () => Promise<void>;
    createSession: (args: CreateSessionState) => Promise<void>;
    refreshSession: () => Promise<void>;
    deleteSession: () => Promise<void>;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider: React.FC<{
    children: React.ReactNode;
}> = ({ children }) => {
    const { user, setUser } = useUser();
    const [session, setSession] = useState<SessionState | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const getSession = async () => {
        try {
            setIsLoading(true);
            await axios.get('/api/sessions', { withCredentials: true });
            await refreshSession();
        } catch (error) {
            setSession({ accessToken: null, isLoggedIn: false });
        } finally {
            setIsLoading(false);
        }
    };

    const createSession = async (args: CreateSessionState) => {
        try {
            setIsLoading(true);
            const response = await axios.post('/api/sessions', { ...args });
            const { accessToken, user: userResponse } = response.data.payload;
            axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

            setSession({ accessToken, isLoggedIn: true });
            if (!user) setUser(userResponse);
        } finally {
            setIsLoading(false);
        }
    };

    const refreshSession = async () => {
        try {
            setIsLoading(true);
            const response = await axios.put('/api/sessions', {}, { withCredentials: true });
            const { accessToken, user: userResponse } = response.data.payload;
            axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

            setSession({ accessToken, isLoggedIn: true });
            if (!user) setUser(userResponse);
        } finally {
            setIsLoading(false);
        }
    };

    const deleteSession = async () => {
        try {
            setIsLoading(true);
            await axios.delete('/api/sessions');

            setSession({ accessToken: null, isLoggedIn: null });
            setUser(null);
            delete axios.defaults.headers.common['Authorization'];
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SessionContext.Provider
            value={{ session, isLoading, getSession, createSession, refreshSession, deleteSession }}
        >
            {children}
        </SessionContext.Provider>
    );
};

export const useSession = (): SessionContextType => {
    const context = useContext(SessionContext);
    if (!context) {
        throw new Error('useSession must be used within a SessionProvider');
    }
    return context;
};