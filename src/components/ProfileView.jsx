import React, { useState, useEffect } from 'react';
import { Trophy, Star, Shield, Zap } from 'lucide-react';
import { Hunter } from '../models/GameModels';

export default function ProfileView() {
    const [hunter, setHunter] = useState(new Hunter({ displayName: "Guest Hunter", xp: 500, currentStreak: 3, totalSolves: 12 }));

    useEffect(() => {
        // Ideally fetch from Firestore here
        // But we use some mock data mirroring the Android app
        const stored = sessionStorage.getItem('hunter_stats');
        if (stored) {
            setHunter(new Hunter(JSON.parse(stored)));
        }
    }, []);

    const progress = hunter.progressToNextRank() * 100;
    const xpNeeded = hunter.xpToNextRank();

    return (
        <div className="animate-fade-in" style={{ height: '100%', overflowY: 'auto' }}>
            <div className="flex-center mt-4 mb-8" style={{ flexDirection: 'column' }}>
                <div style={{
                    width: '100px', height: '100px',
                    borderRadius: '50%', background: 'var(--panel-bg)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '3rem', border: '2px solid var(--accent-primary)',
                    boxShadow: '0 0 20px rgba(88,166,255,0.2)'
                }}>
                    {hunter.rank.emoji}
                </div>
                <h2 className="mt-4">{hunter.displayName}</h2>
                <p className="text-secondary">{hunter.rank.displayName}</p>
            </div>

            <div className="glass-panel mb-8">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span>Level Progress</span>
                    <span className="text-secondary">{Math.round(progress)}%</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${progress}%`, height: '100%', background: 'var(--accent-gradient)' }}></div>
                </div>
                <p className="text-center text-secondary mt-2" style={{ fontSize: '0.8rem' }}>
                    {xpNeeded > 0 ? `${xpNeeded} XP to next rank` : 'Max Rank Reached!'}
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="glass-panel flex-center" style={{ flexDirection: 'column' }}>
                    <Trophy color="#f0b429" size={24} className="mb-2" />
                    <h3>{hunter.xp}</h3>
                    <p className="text-secondary" style={{ fontSize: '0.8rem' }}>Total XP</p>
                </div>

                <div className="glass-panel flex-center" style={{ flexDirection: 'column' }}>
                    <Zap color="var(--accent-primary)" size={24} className="mb-2" />
                    <h3>{hunter.currentStreak}</h3>
                    <p className="text-secondary" style={{ fontSize: '0.8rem' }}>Day Streak</p>
                </div>

                <div className="glass-panel flex-center" style={{ flexDirection: 'column' }}>
                    <Star color="var(--success-color)" size={24} className="mb-2" />
                    <h3>{hunter.totalSolves}</h3>
                    <p className="text-secondary" style={{ fontSize: '0.8rem' }}>Riddles Solved</p>
                </div>

                <div className="glass-panel flex-center" style={{ flexDirection: 'column' }}>
                    <Shield color="#bd56ff" size={24} className="mb-2" />
                    <h3>{hunter.longestStreak}</h3>
                    <p className="text-secondary" style={{ fontSize: '0.8rem' }}>Best Streak</p>
                </div>
            </div>
        </div>
    );
}
