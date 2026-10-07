"use client";

import React, { useState } from 'react';
import { QrCode, Download, Printer, X, RotateCw, ScanFace, BadgeCheck, Building2, Briefcase, Hash } from 'lucide-react';

const VirtualIDCard = ({ employee, onClose }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  if (!employee) return null;

  const handleFlip = () => setIsFlipped(!isFlipped);

  const fullName = `${employee.first_name} ${employee.last_name || ""}`;
  // Generate QR Code Text (Instant Offline Verification)
  const qrData = `MUKHAM VERIFIED EMPLOYEE\nName: ${fullName}\nID: #${employee.employee_id}\nMobile: ${employee.mobile_number}\nDept: ${employee.department_name}\nDesig: ${employee.designation_name}\nStatus: ACTIVE & VALIDATED`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrData)}`;
  const placeholderUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(fullName)}`;
  const photoUrl = employee.photo
    ? (employee.photo.startsWith('http') ? employee.photo : `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001'}${employee.photo}`)
    : placeholderUrl;

  const details = [
    { label: "Employee ID", value: `#${employee.employee_id}`, icon: Hash, mono: true },
    { label: "Department", value: employee.department_name || 'Staff', icon: Building2 },
    { label: "Designation", value: employee.designation_name || 'Associate', icon: Briefcase },
  ];

  return (
    <div
      className="fixed inset-0 z-[5000] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div className="relative w-full max-w-md animate-in zoom-in-95 slide-in-from-bottom-4 duration-500" onClick={(e) => e.stopPropagation()}>

        {/* Controls */}
        <div className="flex justify-between items-center mb-4 px-1">
          <div className="flex gap-2">
            <button className="flex items-center gap-2 h-9 px-4 rounded-full bg-card/90 border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors">
              <Download className="w-4 h-4" /> Download
            </button>
            <button className="flex items-center gap-2 h-9 px-4 rounded-full bg-card/90 border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors">
              <Printer className="w-4 h-4" /> Print
            </button>
            <button
              onClick={handleFlip}
              className="flex items-center gap-2 h-9 px-4 rounded-full bg-primary text-white text-sm font-medium shadow-md shadow-primary/25 hover:bg-primary/90 transition-colors"
            >
              <RotateCw className="w-4 h-4" /> Flip
            </button>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="h-9 w-9 flex items-center justify-center rounded-full bg-card/90 border border-border text-muted-foreground hover:text-red-500 hover:border-red-500/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3D Card Container */}
        <div
          className="relative w-[340px] h-[520px] mx-auto cursor-pointer perspective-1000 group"
          onDoubleClick={handleFlip}
        >
          <div className={`relative w-full h-full transition-transform duration-700 preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}>

            {/* FRONT SIDE */}
            <div className="absolute inset-0 w-full h-full backface-hidden">
              <div className="w-full h-full rounded-3xl bg-card border border-border overflow-hidden shadow-2xl shadow-blue-500/10 flex flex-col relative">
                {/* Header band */}
                <div className="h-36 relative overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600">
                  <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
                  <div className="absolute -bottom-16 -left-10 w-48 h-48 rounded-full bg-cyan-400/20 blur-2xl" />
                  <div className="relative flex items-center justify-between px-5 pt-5 text-white">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-white/15 border border-white/25 flex items-center justify-center">
                        <ScanFace className="w-4 h-4" />
                      </div>
                      <span className="text-lg font-bold tracking-tight">Mukham</span>
                    </div>
                    <span className="text-xs font-medium text-white/80">Employee ID</span>
                  </div>
                </div>

                {/* Photo + identity */}
                <div className="flex-1 flex flex-col items-center -mt-16 px-6 relative z-10">
                  <div className="relative mb-4">
                    <div className="w-32 h-32 rounded-2xl p-1 bg-gradient-to-br from-blue-400 to-purple-500 shadow-xl">
                      <div className="w-full h-full rounded-[0.85rem] overflow-hidden bg-muted border-4 border-card">
                        <img
                          src={photoUrl}
                          alt={fullName}
                          onError={(e) => {
                            // Photo file missing on server: fall back to placeholder
                            if (e.currentTarget.src !== placeholderUrl) e.currentTarget.src = placeholderUrl;
                          }}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                    <span className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-green-500 border-4 border-card flex items-center justify-center">
                      <BadgeCheck className="w-4 h-4 text-white" />
                    </span>
                  </div>

                  <h1 className="text-2xl font-bold text-foreground text-center leading-tight">{fullName}</h1>
                  <p className="page-title text-sm font-semibold mt-1">{employee.designation_name || 'Associate'}</p>
                  <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-green-500/30 bg-green-500/10 px-3 py-0.5 text-xs font-medium text-green-600 dark:text-green-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Active
                  </span>

                  <div className="w-full mt-6 rounded-xl border border-border divide-y divide-border bg-muted/40">
                    {details.map((d) => (
                      <div key={d.label} className="flex items-center justify-between px-4 py-2.5">
                        <span className="flex items-center gap-2 text-xs text-muted-foreground">
                          <d.icon className="w-3.5 h-3.5" /> {d.label}
                        </span>
                        <span className={`text-sm text-foreground truncate max-w-[55%] ${d.mono ? 'font-mono' : 'font-medium'}`}>{d.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-center gap-1.5 py-3 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                  <RotateCw className="w-3 h-3" /> Double-click or press Flip to see the back
                </div>
                <div className="h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
              </div>
            </div>

            {/* BACK SIDE */}
            <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180">
              <div className="w-full h-full rounded-3xl bg-card border border-border overflow-hidden shadow-2xl shadow-purple-500/10 flex flex-col">
                <div className="h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
                <div className="flex-1 flex flex-col items-center justify-between p-8 text-center">
                  <div className="space-y-1">
                    <div className="mx-auto w-10 h-10 rounded-xl brand-tile flex items-center justify-center shadow-lg shadow-blue-500/20">
                      <QrCode className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-base font-semibold text-foreground pt-2">Scan to verify</h3>
                    <p className="text-xs text-muted-foreground">Offline employee verification</p>
                  </div>

                  {/* QR Code Container */}
                  <div className="p-4 bg-white rounded-2xl border border-border shadow-lg shadow-blue-500/10">
                    <img src={qrCodeUrl} alt="QR Code" className="w-36 h-36" />
                  </div>

                  <div className="w-full space-y-4">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Verification hash</p>
                      <p className="text-xs text-foreground/80 font-mono break-all px-4">SHA256:7D9A...E2F1</p>
                    </div>

                    <div className="p-3 rounded-xl bg-muted/50 border border-border">
                      <p className="text-xs text-muted-foreground leading-relaxed">This card is the property of Mukham Systems. If found, please return it to the nearest administration office.</p>
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <p className="text-xs text-muted-foreground">Validated by</p>
                    <p className="text-sm font-semibold text-foreground">Mukham Admin</p>
                  </div>
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
          -webkit-backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
      `}</style>
    </div>
  );
};

export default VirtualIDCard;
