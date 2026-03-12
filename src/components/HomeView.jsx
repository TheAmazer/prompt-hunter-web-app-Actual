import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Target, Trophy, Flame } from 'lucide-react';
import AIManager from '../services/AIManager';

export default function HomeView() {
    const navigate = useNavigate();
    const [riddle, setRiddle] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchRiddle() {
            // Typically fetch from Firestore, but for now generate on the fly or load from session storage
            const stored = sessionStorage.getItem('daily_riddle');
            if (stored) {
                setRiddle(JSON.parse(stored));
                setLoading(false);
            } else {
                const newRiddle = await AIManager.generateDailyRiddle("office or household");
                setRiddle(newRiddle);
                sessionStorage.setItem('daily_riddle', JSON.stringify(newRiddle));
                setLoading(false);
            }
        }
        fetchRiddle();
    }, []);

    return (
        <div className="animate-fade-in">
            <div className="flex-center mt-4">
                <h1 className="gradient-text text-center">Prompt Hunter 🎯</h1>
            </div>
            <p className="text-center text-secondary mb-8">Turn the real world into your game level!</p>

            {/* Stats row */}
            <div className="glass-panel mb-8" style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                <div className="text-center">
                    <Flame color="var(--accent-primary)" size={32} className="mb-2" />
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>3</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Day Streak</div>
                </div>
                <div className="text-center">
                    <Trophy color="#f0b429" size={32} className="mb-2" />
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>500</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Total XP</div>
                </div>
            </div>

            <div className="glass-panel">
                <h2 className="mb-4 flex-center" style={{ gap: '0.5rem' }}>
                    <Target /> Today's Riddle
                </h2>
                {loading ? (
                    <div className="text-center animate-pulse" style={{ padding: '2rem 0' }}>
                        Consulting the AI Oracles...
                    </div>
                ) : (
                    <div>
                        <p style={{ fontSize: '1.25rem', fontStyle: 'italic', marginBottom: '1.5rem' }}>
                            "{riddle?.text}"
                        </p>
                        <div className="flex-center">
                            <button className="btn-primary" onClick={() => navigate('/hunt')} style={{ width: '100%' }}>
                                Start Hunting
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
