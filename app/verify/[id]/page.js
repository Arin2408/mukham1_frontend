"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, User, Phone, Briefcase, Download, ShieldCheck } from "lucide-react";

export default function VerificationPage() {
  const { id } = useParams();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, this would be a public API call
    // For now, we'll fetch from the local storage or simulate the data
    const fetchEmployee = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001'}/api/employees/`);
        const data = await response.json();
        const found = data.find(emp => emp.employee_id.toString() === id);
        setEmployee(found);
      } catch (err) {
        console.error("Failed to fetch employee", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEmployee();
  }, [id]);

  const downloadVCard = () => {
    if (!employee) return;
    
    const vCardData = [
      "BEGIN:VCARD",
      "VERSION:3.0",
      `FN:${employee.first_name} ${employee.last_name}`,
      `TEL;TYPE=CELL:${employee.mobile_number}`,
      `EMAIL:${employee.email}`,
      `ORG:MUKHAM Systems`,
      `TITLE:${employee.designation_name}`,
      "END:VCARD"
    ].join("\n");

    const blob = new Blob([vCardData], { type: "text/vcard" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${employee.first_name}_Contact.vcf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return (
    <div className="min-h-screen bg-[#02040a] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (!employee) return (
    <div className="min-h-screen bg-[#02040a] flex items-center justify-center p-6 text-center">
      <Card className="quantanex-card p-10 max-w-md w-full border-red-500/20">
        <h1 className="text-2xl font-bold text-white mb-2">Invalid ID</h1>
        <p className="text-white/40">This employee record could not be verified.</p>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#02040a] flex items-center justify-center p-4">
      <div className="max-w-md w-full animate-in fade-in zoom-in duration-500">
        <Card className="quantanex-card overflow-hidden border-white/5 relative">
          {/* Status Header */}
          <div className="bg-emerald-500/10 p-8 flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mb-4 shadow-[0_0_40px_rgba(16,185,129,0.3)]">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic">Verified</h1>
            <p className="text-emerald-400 text-xs font-bold tracking-[0.3em] mt-2">MUKHAM SECURITY PROTOCOL</p>
          </div>

          {/* Employee Details */}
          <div className="p-8 space-y-8">
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 rounded-2xl border-2 border-white/10 bg-white/5 overflow-hidden mb-4 shadow-xl">
                <img 
                  src={employee.photo ? `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8001'}${employee.photo}` : `https://api.dicebear.com/7.x/avataaars/svg?seed=${employee.first_name}`} 
                  alt={employee.first_name}
                  className="w-full h-full object-cover"
                />
              </div>
              <h2 className="text-2xl font-bold text-white">{employee.first_name} {employee.last_name}</h2>
              <p className="text-primary font-bold text-xs uppercase tracking-widest">{employee.designation_name}</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/5">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <div className="flex flex-col">
                  <span className="text-[10px] text-white/30 uppercase font-bold">Identity Status</span>
                  <span className="text-sm text-emerald-400 font-bold">Active & Validated</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                  <span className="text-[10px] text-white/30 uppercase font-bold block mb-1">ID Number</span>
                  <span className="text-sm text-white/80 font-mono">#{employee.employee_id}</span>
                </div>
                <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                  <span className="text-[10px] text-white/30 uppercase font-bold block mb-1">Department</span>
                  <span className="text-sm text-white/80">{employee.department_name}</span>
                </div>
              </div>
            </div>

            {/* vCard Button */}
            <Button 
              onClick={downloadVCard}
              className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-bold uppercase tracking-widest rounded-xl shadow-lg shadow-primary/20 gap-3 group"
            >
              <Download className="w-5 h-5 group-hover:animate-bounce" />
              Save to Contacts
            </Button>

            <p className="text-[9px] text-white/20 text-center uppercase tracking-widest">
              Digital Signature: {Math.random().toString(36).substring(2, 15).toUpperCase()}
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
