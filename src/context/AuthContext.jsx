
import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check local storage for persisted session (simple mechanism)
        const storedUser = localStorage.getItem('hr_dashboard_user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = async (username, password) => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('username', username)
                .eq('password', password) // Note: In production, use hashing!
                .single();

            if (error) throw error;

            if (data) {
                setUser(data);
                localStorage.setItem('hr_dashboard_user', JSON.stringify(data));

                // Log the login
                await supabase.from('login_logs').insert([
                    { user_name: data.name }
                ]);

                return { success: true };
            } else {
                return { success: false, message: 'Invalid credentials' };
            }
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, message: error.message || 'Login failed' };
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('hr_dashboard_user');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
