"use client";

import { useState } from "react";
import { KeyRound } from "lucide-react";

import { FastAPI, apiErrorMessage } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const EMPTY = { current: "", next: "", confirm: "" };

// The signed-in admin's or employee's own password. The server signs every
// other device out; this browser stays signed in (it sends its refresh token).
export default function ChangePasswordCard({ className = "" }) {
  const { toast } = useToast();
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const set = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setError("");
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.current || !form.next) {
      setError("Fill in your current and new password.");
      return;
    }
    if (form.next.length < 8) {
      setError("The new password must be at least 8 characters.");
      return;
    }
    if (form.next !== form.confirm) {
      setError("The new passwords don't match.");
      return;
    }

    setSaving(true);
    try {
      await FastAPI.post("auth/change-password", {
        current_password: form.current,
        new_password: form.next,
        refresh: localStorage.getItem("refresh_token") || undefined,
      });
      setForm(EMPTY);
      toast({
        title: "Password changed",
        description: "Other devices have been signed out.",
      });
    } catch (err) {
      setError(apiErrorMessage(err, "Could not change the password."));
    } finally {
      setSaving(false);
    }
  };

  const field = (id, label, value, onChange, autoComplete) => (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-xs font-bold text-muted-foreground ml-1">
        {label}
      </Label>
      <Input
        id={id}
        type="password"
        autoComplete={autoComplete}
        maxLength={128}
        className="bg-foreground/5 border-foreground/10 text-foreground h-11 focus:border-primary/50 transition-all"
        value={value}
        onChange={onChange}
      />
    </div>
  );

  return (
    <Card className={`quantanex-card p-8 ${className}`}>
      <div className="flex items-center gap-3 mb-6 border-b border-foreground/5 pb-4">
        <div className="p-2 rounded-lg bg-primary/20">
          <KeyRound className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-foreground tracking-tight">Change Password</h3>
          <p className="text-xs text-muted-foreground">
            Other devices will be signed out.
          </p>
        </div>
      </div>
      <form className="space-y-4" onSubmit={submit}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {field("current-password", "Current Password", form.current, set("current"), "current-password")}
          {field("new-password", "New Password", form.next, set("next"), "new-password")}
          {field("confirm-password", "Confirm New Password", form.confirm, set("confirm"), "new-password")}
        </div>
        {error ? <p className="text-xs font-bold text-red-500">{error}</p> : null}
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={saving}
            className="px-10 h-11 font-bold text-xs bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20"
          >
            {saving ? "Changing..." : "Change Password"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
