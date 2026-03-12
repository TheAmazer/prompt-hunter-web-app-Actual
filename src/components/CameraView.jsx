import React, { useRef, useState, useEffect } from 'react';
import { Camera as CameraIcon, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import VisionService from '../services/VisionService';
import AIManager from '../services/AIManager';
import { useRiddleBuffer } from '../hooks/useRiddleBuffer';

export default function CameraView() {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const overlayCanvasRef = useRef(null);

    const { activeRiddles, markRiddleUsed } = useRiddleBuffer();
    const currentRiddle = activeRiddles.length > 0 ? activeRiddles[0] : null;

    const [stream, setStream] = useState(null);
    const [detectedLabels, setDetectedLabels] = useState([]);
    const [status, setStatus] = useState('hunting'); // hunting, verifying, success, failed
    const [feedback, setFeedback] = useState('');

    // Start camera
    useEffect(() => {
        async function startCamera() {
            try {
                const mediaStream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'environment' }
                });
                setStream(mediaStream);
                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream;
                }
            } catch (err) {
                console.error("Error accessing camera:", err);
            }
        }
        startCamera();

        return () => {
            // Cleanup
            if (stream) stream.getTracks().forEach(track => track.stop());
        };
    }, []);

    // Object Detection Loop
    useEffect(() => {
        let animationFrameId;
        async function detectLoop() {
            if (videoRef.current && videoRef.current.readyState === 4 && status === 'hunting') {
                try {
                    // Draw bounding boxes on overlay
                    const predictions = await VisionService.detectObjects(videoRef.current);

                    if (overlayCanvasRef.current) {
                        const ctx = overlayCanvasRef.current.getContext('2d');
                        overlayCanvasRef.current.width = videoRef.current.videoWidth;
                        overlayCanvasRef.current.height = videoRef.current.videoHeight;
                        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

                        predictions.forEach(p => {
                            ctx.strokeStyle = '#3fb950';
                            ctx.lineWidth = 4;
                            ctx.strokeRect(p.bbox[0], p.bbox[1], p.bbox[2], p.bbox[3]);

                            ctx.fillStyle = '#3fb950';
                            ctx.font = '18px Inter';
                            ctx.fillText(`${p.class} (${Math.round(p.score * 100)}%)`, p.bbox[0], p.bbox[1] > 20 ? p.bbox[1] - 5 : 20);
                        });

                        const uniqueLabels = [...new Set(predictions.map(p => p.class))];
                        setDetectedLabels(uniqueLabels);
                    }
                } catch (e) {
                    // detection might temporarily fail
                }
            }
            animationFrameId = requestAnimationFrame(detectLoop);
        }

        detectLoop();
        return () => cancelAnimationFrame(animationFrameId);
    }, [status]);

    const captureAndVerify = async () => {
        if (!videoRef.current || !canvasRef.current || !currentRiddle) return;

        setStatus('verifying'); // triggers UI

        // Draw video to canvas to get base64
        const ctx = canvasRef.current.getContext('2d');
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        ctx.drawImage(videoRef.current, 0, 0);
        const base64Image = canvasRef.current.toDataURL('image/jpeg', 0.8);

        // Verify using AI
        const result = await AIManager.verifyAnswer(base64Image, currentRiddle);

        setFeedback(result.feedback);
        if (result.isCorrect) {
            setStatus('success');
            await markRiddleUsed(currentRiddle.id);
        } else {
            setStatus('failed');
        }
    };

    const reset = () => {
        setStatus('hunting');
        setFeedback('');
    };

    return (
        <div className="animate-fade-in" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className="glass-panel mb-4">
                <h3 className="text-center gradient-text" style={{ fontSize: '1rem' }}>
                    {currentRiddle?.text || "Searching for riddles..."}
                </h3>
            </div>

            <div style={{ flex: 1, position: 'relative', borderRadius: '16px', overflow: 'hidden', background: '#000' }}>
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <canvas
                    ref={overlayCanvasRef}
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                />
                <canvas ref={canvasRef} style={{ display: 'none' }} />

                {/* Top left ML Kit Labels equivalent */}
                {status === 'hunting' && detectedLabels.length > 0 && (
                    <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                        {detectedLabels.map(label => (
                            <span key={label} style={{ background: 'rgba(0,0,0,0.6)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>
                                {label}
                            </span>
                        ))}
                    </div>
                )}

                {/* Status Overlays */}
                {status !== 'hunting' && (
                    <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.8)',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        padding: '2rem', textAlign: 'center'
                    }}>
                        {status === 'verifying' && (
                            <div className="animate-pulse flex-center" style={{ flexDirection: 'column', gap: '1rem' }}>
                                <RefreshCw size={48} className="gradient-text" style={{ animation: 'spin 2s linear infinite' }} />
                                <h2>AI is verifying...</h2>
                            </div>
                        )}

                        {status === 'success' && (
                            <div className="animate-fade-in">
                                <CheckCircle size={64} className="mb-4" style={{ color: 'var(--success-color)' }} />
                                <h2 style={{ color: 'var(--success-color)' }}>Correct!</h2>
                                <p className="mt-2 text-secondary">{feedback}</p>
                                <button className="btn-primary mt-8" onClick={() => window.location.href = '/'}>Go Home</button>
                            </div>
                        )}

                        {status === 'failed' && (
                            <div className="animate-fade-in">
                                <XCircle size={64} className="mb-4" style={{ color: 'var(--error-color)' }} />
                                <h2 style={{ color: 'var(--error-color)' }}>Not quite...</h2>
                                <p className="mt-2 text-secondary">{feedback}</p>
                                <button className="btn-secondary mt-8" onClick={reset}>Try Again</button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="flex-center mt-4 mb-2">
                <button
                    onClick={captureAndVerify}
                    className="btn-primary flex-center"
                    disabled={status !== 'hunting'}
                    style={{
                        width: '80px', height: '80px', borderRadius: '50%',
                        padding: 0, border: '4px solid var(--border-color)'
                    }}
                >
                    <CameraIcon size={32} />
                </button>
            </div>

            <style>{`
         @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
        </div>
    );
}
