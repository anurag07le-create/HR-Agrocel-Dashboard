import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Loader2, UserPlus, Trash2, RefreshCw, Shield, Clock, Users } from 'lucide-react';

const AdminPanel = () => {
    const [activeTab, setActiveTab] = useState('users'); // 'users' or 'logs'
    const [users, setUsers] = useState([]);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    // New User Form State
    const [newUser, setNewUser] = useState({
        name: '',
        mobile: '',
        email: '',
        username: '',
        password: '',
        role: 'user' // Default role
    });
    const [creatingUser, setCreatingUser] = useState(false);

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'users') {
                const { data, error } = await supabase
                    .from('users')
                    .select('*')
                    .order('created_at', { ascending: false });
                if (error) throw error;
                setUsers(data || []);
            } else {
                const { data, error } = await supabase
                    .from('login_logs')
                    .select('*')
                    .order('login_time', { ascending: false });
                if (error) throw error;
                setLogs(data || []);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            alert('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewUser(prev => ({ ...prev, [name]: value }));
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        setCreatingUser(true);
        try {
            // 1. Insert into Supabase
            const { data, error } = await supabase
                .from('users')
                .insert([newUser])
                .select();

            if (error) throw error;

            // 2. Trigger Webhook
            try {
                await fetch('https://studio.pucho.ai/api/v1/webhooks/AvcAEy9P1uMyIQGflQXZ0', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newUser)
                });
            } catch (webhookError) {
                console.error('Webhook trigger failed:', webhookError);
                // Don't block success if webhook fails, but maybe warn
            }

            alert('User created successfully!');
            setNewUser({ name: '', mobile: '', email: '', username: '', password: '', role: 'user' });
            fetchData(); // Refresh list

        } catch (error) {
            console.error('Error creating user:', error);
            alert('Failed to create user: ' + error.message);
        } finally {
            setCreatingUser(false);
        }
    };

    const handleDeleteUser = async (id) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;

        try {
            const { error } = await supabase
                .from('users')
                .delete()
                .eq('id', id);

            if (error) throw error;
            fetchData();
        } catch (error) {
            console.error('Error deleting user:', error);
            alert('Failed to delete user');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-[var(--text-primary)]">Admin Panel</h1>
                    <p className="text-[var(--text-secondary)] mt-1">Manage users and view system logs</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 bg-[var(--bg-secondary)] p-1 rounded-xl w-fit border border-[var(--border-color)]">
                <button
                    onClick={() => setActiveTab('users')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'users'
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                        }`}
                >
                    <div className="flex items-center">
                        <Users className="w-4 h-4 mr-2" />
                        User Management
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab('logs')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'logs'
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                        }`}
                >
                    <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-2" />
                        Login Logs
                    </div>
                </button>
            </div>

            {activeTab === 'users' ? (
                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Create User Form */}
                    <div className="lg:col-span-1">
                        <div className="glass-card rounded-2xl p-6 border border-[var(--border-color)]">
                            <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4 flex items-center">
                                <UserPlus className="w-5 h-5 mr-2 text-purple-400" />
                                Add New User
                            </h3>
                            <form onSubmit={handleCreateUser} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Full Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={newUser.name}
                                        onChange={handleInputChange}
                                        className="input-field w-full bg-[var(--input-bg)] border-[var(--border-color)] text-[var(--text-primary)]"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Mobile No</label>
                                    <input
                                        type="text"
                                        name="mobile"
                                        value={newUser.mobile}
                                        onChange={handleInputChange}
                                        className="input-field w-full bg-[var(--input-bg)] border-[var(--border-color)] text-[var(--text-primary)]"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Email</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={newUser.email}
                                        onChange={handleInputChange}
                                        className="input-field w-full bg-[var(--input-bg)] border-[var(--border-color)] text-[var(--text-primary)]"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Username</label>
                                    <input
                                        type="text"
                                        name="username"
                                        value={newUser.username}
                                        onChange={handleInputChange}
                                        className="input-field w-full bg-[var(--input-bg)] border-[var(--border-color)] text-[var(--text-primary)]"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Password</label>
                                    <input
                                        type="password"
                                        name="password"
                                        value={newUser.password}
                                        onChange={handleInputChange}
                                        className="input-field w-full bg-[var(--input-bg)] border-[var(--border-color)] text-[var(--text-primary)]"
                                        required
                                    />
                                </div>
                                {/* Role selection removed - default to 'user' */}
                                <button
                                    type="submit"
                                    disabled={creatingUser}
                                    className="btn-primary w-full flex justify-center items-center"
                                >
                                    {creatingUser ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create User'}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Users List */}
                    <div className="lg:col-span-2">
                        <div className="glass-card rounded-2xl overflow-hidden border border-[var(--border-color)]">
                            <div className="px-6 py-4 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-secondary)]">
                                <h3 className="font-bold text-[var(--text-primary)]">Existing Users</h3>
                                <button onClick={fetchData} className="p-2 hover:bg-[var(--bg-hover)] rounded-full transition-colors">
                                    <RefreshCw className={`w-4 h-4 text-[var(--text-secondary)] ${loading ? 'animate-spin' : ''}`} />
                                </button>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-[var(--border-color)]">
                                    <thead className="bg-[var(--bg-secondary)]">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">User</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Contact</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Role</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--border-color)]">
                                        {users.map((user) => (
                                            <tr key={user.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-[var(--text-primary)]">{user.name}</div>
                                                    <div className="text-xs text-[var(--text-secondary)]">@{user.username}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-[var(--text-secondary)]">{user.email}</div>
                                                    <div className="text-xs text-[var(--text-secondary)] opacity-70">{user.mobile}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === 'admin'
                                                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                                        : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                                        }`}>
                                                        {user.role || 'user'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    {user.role !== 'admin' && (
                                                        <button
                                                            onClick={() => handleDeleteUser(user.id)}
                                                            className="text-red-400 hover:text-red-300 p-2 hover:bg-red-500/10 rounded-full transition-colors"
                                                            title="Delete User"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                // Logs Tab
                <div className="glass-card rounded-2xl overflow-hidden border border-[var(--border-color)]">
                    <div className="px-6 py-4 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-secondary)]">
                        <h3 className="font-bold text-[var(--text-primary)]">System Login Logs</h3>
                        <button onClick={fetchData} className="p-2 hover:bg-[var(--bg-hover)] rounded-full transition-colors">
                            <RefreshCw className={`w-4 h-4 text-[var(--text-secondary)] ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-[var(--border-color)]">
                            <thead className="bg-[var(--bg-secondary)]">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">User Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Login Time (IST)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border-color)]">
                                {logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-[var(--bg-hover)] transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-8 w-8 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300 font-bold text-xs mr-3">
                                                    {log.user_name.charAt(0)}
                                                </div>
                                                <div className="text-sm font-medium text-[var(--text-primary)]">{log.user_name}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-secondary)]">
                                            {new Date(log.login_time).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPanel;
