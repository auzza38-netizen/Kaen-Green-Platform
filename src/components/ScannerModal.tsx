import React, { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';
import { Camera, X, RefreshCw, Upload, Search, CheckCircle2, AlertCircle, Volume2 } from 'lucide-react';

interface ScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (code: string) => void;
}

export const ScannerModal: React.FC<ScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess
}) => {
  const [cameraActive, setCameraActive] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameId = useRef<number | null>(null);

  // Sound play on success
  const playBeep = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 1200;
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch (e) {
      console.log('Audio beep fallback', e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setErrorMessage('');
      setScannedCode(null);
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async () => {
    setErrorMessage('');
    setCameraActive(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        videoRef.current.play();
        setCameraActive(true);
        requestScanLoop();
      }
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setErrorMessage('ไม่สามารถเข้าถึงกล้องสมาร์ทโฟนได้ โปรดอนุญาตสิทธิ์การใช้งานกล้อง หรือใช้การพิมพ์บาร์โค้ด');
    }
  };

  const stopCamera = () => {
    if (animFrameId.current) {
      cancelAnimationFrame(animFrameId.current);
      animFrameId.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const requestScanLoop = () => {
    const scanFrame = () => {
      if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (ctx) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const qrCode = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: 'dontInvert'
            });

            if (qrCode && qrCode.data) {
              handleCodeFound(qrCode.data);
              return;
            }
          }
        }
      }
      animFrameId.current = requestAnimationFrame(scanFrame);
    };
    animFrameId.current = requestAnimationFrame(scanFrame);
  };

  const handleCodeFound = (code: string) => {
    playBeep();
    setScannedCode(code);
    stopCamera();
    setTimeout(() => {
      onScanSuccess(code);
      onClose();
    }, 400);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      handleCodeFound(manualCode.trim());
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const qrCode = jsQR(imageData.data, imageData.width, imageData.height);
          if (qrCode && qrCode.data) {
            handleCodeFound(qrCode.data);
          } else {
            setErrorMessage('ไม่พบ Barcode / QR Code ในภาพตัวอย่าง โปรดลองภาพที่มีความคมชัดสูงขึ้น');
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 text-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-700 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 bg-slate-800 border-b border-slate-700 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100">สแกนบาร์โค้ด / QR Code สินค้า</h3>
              <p className="text-[11px] text-slate-400">ส่องกล้องไปที่บาร์โค้ดบนสมาร์ทโฟน</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-700/60 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Camera Viewport Area */}
        <div className="relative bg-black aspect-square flex items-center justify-center overflow-hidden">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
          />
          <canvas ref={canvasRef} className="hidden" />

          {/* Scanner frame graphic overlay */}
          {cameraActive && !scannedCode && (
            <div className="absolute inset-0 flex items-center justify-center p-8 pointer-events-none">
              <div className="w-64 h-64 border-2 border-emerald-400 rounded-2xl relative shadow-[0_0_30px_rgba(52,211,153,0.3)] animate-pulse">
                <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg"></div>
                <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg"></div>
                <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg"></div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-lg"></div>
                
                {/* Scanning laser line */}
                <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent absolute top-1/2 -translate-y-1/2 animate-bounce shadow-[0_0_8px_#34d399]"></div>
              </div>
            </div>
          )}

          {/* Scan result indicator overlay */}
          {scannedCode && (
            <div className="absolute inset-0 bg-emerald-950/90 flex flex-col items-center justify-center p-6 text-center animate-in zoom-in-95">
              <CheckCircle2 className="w-16 h-16 text-emerald-400 mb-3 animate-bounce" />
              <p className="text-xs text-emerald-200">สแกนสำเร็จ!</p>
              <p className="font-mono text-lg font-bold text-white bg-emerald-900/80 px-4 py-2 rounded-lg mt-2 border border-emerald-500">
                {scannedCode}
              </p>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="absolute inset-x-4 bottom-4 bg-rose-900/90 border border-rose-600 text-rose-200 text-xs p-3 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Controls and Manual Entry */}
        <div className="p-4 bg-slate-800 border-t border-slate-700 space-y-3">
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="พิมพ์รหัสบาร์โค้ด / SKU ด้วยตัวเอง..."
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 font-mono"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-colors shrink-0 shadow-sm"
            >
              ตกลง
            </button>
          </form>

          <div className="flex items-center justify-between gap-2 pt-1">
            <button
              onClick={startCamera}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-slate-300 bg-slate-700/60 hover:bg-slate-700 rounded-xl transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
              <span>รีเซ็ตกล้อง</span>
            </button>

            <label className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-slate-300 bg-slate-700/60 hover:bg-slate-700 rounded-xl cursor-pointer transition-colors">
              <Upload className="w-3.5 h-3.5 text-blue-400" />
              <span>อัปโหลดรูปภาพ</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
