"use client";

import React, { useState } from 'react';
import { QrCode, Download, Printer, X, RotateCw } from 'lucide-react';

const VirtualIDCard = ({ employee, onClose }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  if (!employee) return null;

  const handleFlip = () => setIsFlipped(!isFlipped);

  const fullName = `${employee.first_name} ${employee.last_name || ""}`;
  // Generate QR Code Text (Instant Offline Verification)
  const qrData = `MUKHAM VERIFIED EMPLOYEE\nName: ${fullName}\nID: #${employee.employee_id}\nMobile: ${employee.mobile_number}\nDept: ${employee.department_name}\nDesig: ${employee.designation_name}\nStatus: ACTIVE & VALIDATED`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrData)}`;
  const photoUrl = employee.photo 
    ? (employee.photo.startsWith('http') ? employee.photo : `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001'}${employee.photo}`)
    : `https://api.dicebear.com/7.x/avataaars/svg?seed=${fullName}`;

  return (
    <div className="fixed inset-0 z-[5000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="relative w-full max-w-md">
        
        {/* Controls */}
        <div className="absolute -top-12 left-0 right-0 flex justify-between items-center px-2">
          <div className="flex gap-4">
            <button className="text-white/60 hover:text-white flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-colors">
              <Download className="w-4 h-4" /> Download
            </button>
            <button className="text-white/60 hover:text-white flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-colors">
              <Printer className="w-4 h-4" /> Print
            </button>
          </div>
          <button onClick={onClose} className="p-2 bg-white/10 hover:bg-red-500/20 rounded-full text-white transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3D Card Container */}
        <div 
          className="relative w-[340px] h-[520px] mx-auto cursor-pointer perspective-1000 group"
          onDoubleClick={handleFlip}
        >
          <div className={`relative w-full h-full transition-all duration-700 preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
            
            {/* FRONT SIDE */}
            <div className="absolute inset-0 w-full h-full backface-hidden">
              <div className="w-full h-full bg-[#11141b] rounded-[2rem] border-2 border-white/10 overflow-hidden shadow-2xl flex flex-col relative">
                {/* Header/Logo Section */}
                <div className="h-32 bg-primary/20 relative flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                  <h2 className="text-2xl font-black text-white tracking-tighter italic">MUKHAM</h2>
                  <div className="absolute bottom-0 w-full h-12 bg-gradient-to-t from-[#11141b] to-transparent"></div>
                </div>

                {/* Photo Section */}
                <div className="flex-1 flex flex-col items-center -mt-12 px-6 pb-8 relative z-10">
                  <div className="w-32 h-32 rounded-3xl border-4 border-[#11141b] bg-white/5 overflow-hidden shadow-xl mb-6 ring-4 ring-primary/20">
                    <img 
                      src={photoUrl} 
                      alt={fullName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <h1 className="text-2xl font-bold text-white text-center mb-1">{fullName}</h1>
                  <p className="text-primary font-bold text-xs uppercase tracking-[0.3em] mb-8">{employee.designation_name || 'Associate'}</p>

                  <div className="w-full space-y-4">
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-[10px] text-white/30 uppercase font-bold">ID Number</span>
                      <span className="text-xs text-white/80 font-mono">#{employee.employee_id}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/5 pb-2">
                      <span className="text-[10px] text-white/30 uppercase font-bold">Department</span>
                      <span className="text-xs text-white/80">{employee.department_name || 'Staff'}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Stripe */}
                <div className="h-4 bg-primary"></div>

                {/* Tip */}
                <div className="absolute bottom-10 left-0 right-0 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-[8px] text-white/20 uppercase tracking-[0.2em] flex items-center justify-center gap-2">
                    <RotateCw className="w-2 h-2" /> Double Click to Flip
                  </p>
                </div>
              </div>
            </div>

            {/* BACK SIDE */}
            <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180">
              <div className="w-full h-full bg-[#0a0c12] rounded-[2rem] border-2 border-primary/30 overflow-hidden shadow-2xl flex flex-col items-center justify-between p-8 text-center">
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-primary uppercase tracking-[0.4em]">Authorization</h3>
                  <div className="w-12 h-0.5 bg-primary/40 mx-auto"></div>
                </div>

                {/* QR Code Container */}
                <div className="p-4 bg-white rounded-2xl shadow-[0_0_30px_rgba(var(--primary-rgb),0.3)]">
                  <img src={qrCodeUrl} alt="QR Code" className="w-32 h-32" />
                </div>

                <div className="space-y-6">
                  <div className="space-y-1">
                    <p className="text-[10px] text-white/30 uppercase font-bold">Verification Hash</p>
                    <p className="text-[9px] text-white/60 font-mono break-all px-4">SHA256:7D9A...E2F1</p>
                  </div>
                  
                  <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                    <p className="text-[10px] text-white/80 italic">"This card is a digital property of MUKHAM Systems. If found, please return to the nearest administration office."</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-[8px] text-white/20 uppercase tracking-widest">Validated By</p>
                  <p className="text-[10px] font-black text-white italic tracking-tighter">MUKHAM ADMIN</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      <style jsx>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .preserve-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
      `}</style>
    </div>
  );
};

export default VirtualIDCard;
