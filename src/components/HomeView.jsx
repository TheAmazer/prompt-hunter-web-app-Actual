import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Target, Trophy, Flame, RefreshCw } from 'lucide-react';
import { useRiddleBuffer } from '../hooks/useRiddleBuffer';

export default function HomeView() {
    const navigate = useNavigate();
    const { activeRiddles, isLoading, isRefilling } = useRiddleBuffer();
    
    // DEBUG LOGGING
    console.log("HomeView Render ->", { 
        activeRiddlesCount: activeRiddles.length, 
        isLoading, 
        isRefilling,
        riddles: activeRiddles 
    });

    const currentRiddle = activeRiddles.length > 0 ? activeRiddles[0] : null;

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
                {isLoading || (activeRiddles.length === 0 && isRefilling) ? (
                    <div className="text-center animate-pulse flex-center" style={{ flexDirection: 'column', padding: '2rem 0', gap: '1rem' }}>
                        <RefreshCw size={32} className="gradient-text" style={{ animation: 'spin 2s linear infinite' }} />
                        Consulting the AI Oracles for new riddles...
                    </div>
                ) : currentRiddle ? (
                    <div>
                        <p style={{ fontSize: '1.25rem', fontStyle: 'italic', marginBottom: '1.5rem' }}>
                            "{currentRiddle.text}"
                        </p>
                        <div className="flex-center">
                            <button className="btn-primary" onClick={() => navigate('/hunt')} style={{ width: '100%' }}>
                                Start Hunting
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="text-center text-secondary" style={{ padding: '2rem 0' }}>
                        No riddles available right now. Please try again later.
                    </div>
                )}
            </div>
        </div>
    );
}
