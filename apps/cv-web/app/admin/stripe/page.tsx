"use client";

import { useState, useEffect, useCallback } from "react";
import { adminApi } from "@/lib/api";
import {
  CreditCard,
  Save,
  Loader2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Eye,
  EyeOff,
  Zap,
  Shield,
  Key,
  Tag,
  Webhook,
} from "lucide-react";
import toast from "react-hot-toast";

interface StripeConfig {
  enabled: boolean;
  hasSecretKey: boolean;
  hasWebhookSecret: boolean;
  premiumMonthlyPriceId: string;
  premiumYearlyPriceId: string;
  enterpriseMonthlyPriceId: string;
  enterpriseYearlyPriceId: string;
}

export default function AdminStripePage() {
  const [config, setConfig] = useState<StripeConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [reloading, setReloading] = useState(false);
  const [connectionOk, setConnectionOk] = useState<boolean | null>(null);

  // Form fields
  const [enabled, setEnabled] = useState(false);
  const [secretKey, setSecretKey] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [premiumMonthly, setPremiumMonthly] = useState("");
  const [premiumYearly, setPremiumYearly] = useState("");
  const [enterpriseMonthly, setEnterpriseMonthly] = useState("");
  const [enterpriseYearly, setEnterpriseYearly] = useState("");

  const [showSecretKey, setShowSecretKey] = useState(false);
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);

  const loadConfig = useCallback(async () => {
    try {
      const res = await adminApi.getStripeConfig();
      const data = res.data;
      setConfig(data);
      setEnabled(data.enabled);
      setPremiumMonthly(data.premiumMonthlyPriceId || "");
      setPremiumYearly(data.premiumYearlyPriceId || "");
      setEnterpriseMonthly(data.enterpriseMonthlyPriceId || "");
      setEnterpriseYearly(data.enterpriseYearlyPriceId || "");
      // Secret keys are not returned from the API — only hasSecretKey flags
      setSecretKey("");
      setWebhookSecret("");
      if (data.enabled && data.hasSecretKey) {
        setConnectionOk(true);
      }
    } catch {
      toast.error("Failed to load Stripe configuration");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const handleTestConnection = async () => {
    if (!secretKey) {
      toast.error("Enter a secret key to test");
      return;
    }
    setTesting(true);
    try {
      const res = await adminApi.testStripeConnection(secretKey);
      if (res.data.ok) {
        setConnectionOk(true);
        toast.success("Stripe connection successful!");
      } else {
        setConnectionOk(false);
        toast.error(`Connection failed: ${res.data.error}`);
      }
    } catch {
      setConnectionOk(false);
      toast.error("Failed to test connection");
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: any = {
        enabled,
        premiumMonthlyPriceId: premiumMonthly,
        premiumYearlyPriceId: premiumYearly,
        enterpriseMonthlyPriceId: enterpriseMonthly,
        enterpriseYearlyPriceId: enterpriseYearly,
      };

      // Only send secret key/webhook secret if the user typed something new
      if (secretKey) payload.secretKey = secretKey;
      if (webhookSecret) payload.webhookSecret = webhookSecret;

      const res = await adminApi.updateStripeConfig(payload);
      if (res.data?.connection?.ok) {
        setConnectionOk(true);
        toast.success("Stripe configuration saved & connected!");
      } else if (res.data?.connection?.ok === false) {
        setConnectionOk(false);
        toast.error(
          `Saved but connection failed: ${res.data.connection.error}`,
        );
      } else {
        toast.success("Stripe configuration saved!");
      }

      // Reload to get updated flags
      await loadConfig();
    } catch {
      toast.error("Failed to save Stripe configuration");
    } finally {
      setSaving(false);
    }
  };

  const handleReload = async () => {
    setReloading(true);
    try {
      const res = await adminApi.reloadStripe();
      if (res.data.ok) {
        setConnectionOk(true);
        toast.success("Stripe reloaded successfully!");
      } else {
        setConnectionOk(false);
        toast.error(`Reload failed: ${res.data.error}`);
      }
    } catch {
      toast.error("Failed to reload Stripe");
    } finally {
      setReloading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-400" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-content">
            Stripe Configuration
          </h1>
          <p className="mt-1 text-sm text-content-3">
            Manage your Stripe payment gateway settings. Enable Stripe and
            configure your API keys and price IDs.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleReload}
            disabled={reloading}
            className="flex items-center gap-2 rounded-xl border border-edge bg-card px-4 py-2.5 text-sm font-medium text-content-2 transition hover:bg-card-hover disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${reloading ? "animate-spin" : ""}`}
            />
            Reload
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-600 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Configuration
          </button>
        </div>
      </div>

      {/* Connection Status Banner */}
      <div
        className={`flex items-center gap-3 rounded-2xl border p-4 ${
          connectionOk === true
            ? "border-emerald-500/30 bg-emerald-500/5"
            : connectionOk === false
              ? "border-red-500/30 bg-red-500/5"
              : "border-edge bg-card"
        }`}
      >
        {connectionOk === true ? (
          <>
            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            <div>
              <p className="text-sm font-medium text-emerald-400">
                Stripe Connected
              </p>
              <p className="text-xs text-emerald-400/70">
                Payment gateway is active and accepting payments.
              </p>
            </div>
          </>
        ) : connectionOk === false ? (
          <>
            <XCircle className="h-5 w-5 text-red-400" />
            <div>
              <p className="text-sm font-medium text-red-400">
                Connection Failed
              </p>
              <p className="text-xs text-red-400/70">
                Check your API key and try again.
              </p>
            </div>
          </>
        ) : (
          <>
            <CreditCard className="h-5 w-5 text-content-3" />
            <div>
              <p className="text-sm font-medium text-content-2">
                Not Configured
              </p>
              <p className="text-xs text-content-3">
                Add your Stripe API keys to enable payments.
              </p>
            </div>
          </>
        )}
      </div>

      {/* Enable / Disable Toggle */}
      <div className="rounded-2xl border border-edge bg-card p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 ring-1 ring-orange-500/20">
              <Zap className="h-5 w-5 text-orange-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-content">
                Enable Stripe Payments
              </p>
              <p className="text-xs text-content-3">
                Toggle to activate or deactivate the Stripe payment gateway
              </p>
            </div>
          </div>
          <button
            onClick={() => setEnabled(!enabled)}
            className={`relative h-7 w-12 rounded-full transition-colors ${
              enabled ? "bg-orange-500" : "bg-content-4/30"
            }`}
          >
            <span
              className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-md transition-transform ${
                enabled ? "translate-x-5.5" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>
      </div>

      {/* API Keys */}
      <div className="rounded-2xl border border-edge bg-card p-6 space-y-5">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 ring-1 ring-violet-500/20">
            <Key className="h-5 w-5 text-violet-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-content">API Keys</p>
            <p className="text-xs text-content-3">
              Your Stripe secret key and webhook signing secret
            </p>
          </div>
        </div>

        {/* Secret Key */}
        <div>
          <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-content-2">
            <Shield className="h-3.5 w-3.5" />
            Secret Key
            {config?.hasSecretKey && !secretKey && (
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 ring-1 ring-emerald-500/20">
                Configured
              </span>
            )}
          </label>
          <div className="relative">
            <input
              type={showSecretKey ? "text" : "password"}
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              placeholder={
                config?.hasSecretKey
                  ? "••••••••  (leave blank to keep current)"
                  : "sk_live_... or sk_test_..."
              }
              className="w-full rounded-xl border border-edge bg-surface px-4 py-2.5 pr-20 text-sm text-content placeholder:text-content-4 focus:border-orange-500/50 focus:outline-none focus:ring-1 focus:ring-orange-500/30"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setShowSecretKey(!showSecretKey)}
                className="rounded-lg p-1.5 text-content-3 hover:bg-surface hover:text-content-2"
              >
                {showSecretKey ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testing || !secretKey}
                className="rounded-lg bg-violet-500/10 px-2 py-1 text-[11px] font-medium text-violet-400 ring-1 ring-violet-500/20 transition hover:bg-violet-500/20 disabled:opacity-40"
              >
                {testing ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  "Test"
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Webhook Secret */}
        <div>
          <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-content-2">
            <Webhook className="h-3.5 w-3.5" />
            Webhook Signing Secret
            {config?.hasWebhookSecret && !webhookSecret && (
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 ring-1 ring-emerald-500/20">
                Configured
              </span>
            )}
          </label>
          <div className="relative">
            <input
              type={showWebhookSecret ? "text" : "password"}
              value={webhookSecret}
              onChange={(e) => setWebhookSecret(e.target.value)}
              placeholder={
                config?.hasWebhookSecret
                  ? "••••••••  (leave blank to keep current)"
                  : "whsec_..."
              }
              className="w-full rounded-xl border border-edge bg-surface px-4 py-2.5 pr-10 text-sm text-content placeholder:text-content-4 focus:border-orange-500/50 focus:outline-none focus:ring-1 focus:ring-orange-500/30"
            />
            <button
              type="button"
              onClick={() => setShowWebhookSecret(!showWebhookSecret)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-content-3 hover:text-content-2"
            >
              {showWebhookSecret ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Price IDs */}
      <div className="rounded-2xl border border-edge bg-card p-6 space-y-5">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 ring-1 ring-cyan-500/20">
            <Tag className="h-5 w-5 text-cyan-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-content">Price IDs</p>
            <p className="text-xs text-content-3">
              Stripe Price IDs from your Products dashboard for each
              subscription tier
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {/* Premium Monthly */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-content-2">
              Premium — Monthly
            </label>
            <input
              type="text"
              value={premiumMonthly}
              onChange={(e) => setPremiumMonthly(e.target.value)}
              placeholder="price_..."
              className="w-full rounded-xl border border-edge bg-surface px-4 py-2.5 text-sm text-content placeholder:text-content-4 focus:border-orange-500/50 focus:outline-none focus:ring-1 focus:ring-orange-500/30"
            />
          </div>

          {/* Premium Yearly */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-content-2">
              Premium — Yearly
            </label>
            <input
              type="text"
              value={premiumYearly}
              onChange={(e) => setPremiumYearly(e.target.value)}
              placeholder="price_..."
              className="w-full rounded-xl border border-edge bg-surface px-4 py-2.5 text-sm text-content placeholder:text-content-4 focus:border-orange-500/50 focus:outline-none focus:ring-1 focus:ring-orange-500/30"
            />
          </div>

          {/* Enterprise Monthly */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-content-2">
              Enterprise — Monthly
            </label>
            <input
              type="text"
              value={enterpriseMonthly}
              onChange={(e) => setEnterpriseMonthly(e.target.value)}
              placeholder="price_..."
              className="w-full rounded-xl border border-edge bg-surface px-4 py-2.5 text-sm text-content placeholder:text-content-4 focus:border-orange-500/50 focus:outline-none focus:ring-1 focus:ring-orange-500/30"
            />
          </div>

          {/* Enterprise Yearly */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-content-2">
              Enterprise — Yearly
            </label>
            <input
              type="text"
              value={enterpriseYearly}
              onChange={(e) => setEnterpriseYearly(e.target.value)}
              placeholder="price_..."
              className="w-full rounded-xl border border-edge bg-surface px-4 py-2.5 text-sm text-content placeholder:text-content-4 focus:border-orange-500/50 focus:outline-none focus:ring-1 focus:ring-orange-500/30"
            />
          </div>
        </div>
      </div>

      {/* Help Section */}
      <div className="rounded-2xl border border-edge bg-card p-6">
        <h3 className="mb-3 text-sm font-semibold text-content">Setup Guide</h3>
        <ol className="space-y-2 text-xs text-content-3 list-decimal list-inside">
          <li>
            Go to{" "}
            <a
              href="https://dashboard.stripe.com/apikeys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-400 underline"
            >
              Stripe Dashboard → API Keys
            </a>{" "}
            and copy your <strong>Secret key</strong>{" "}
            <span className="text-content-4">(sk_live_... or sk_test_...)</span>
          </li>
          <li>
            Go to{" "}
            <a
              href="https://dashboard.stripe.com/webhooks"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-400 underline"
            >
              Stripe Dashboard → Webhooks
            </a>{" "}
            and create an endpoint pointing to{" "}
            <code className="rounded bg-surface px-1.5 py-0.5 text-content-2">
              https://api.yourdomain.com/api/stripe/webhook
            </code>
          </li>
          <li>
            Copy the webhook signing secret (whsec_...) from that endpoint
          </li>
          <li>
            Go to{" "}
            <a
              href="https://dashboard.stripe.com/products"
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-400 underline"
            >
              Stripe Dashboard → Products
            </a>{" "}
            and copy each Price ID (price_...) for your subscription tiers
          </li>
          <li>
            Paste all values above, enable the toggle, and hit{" "}
            <strong>Save Configuration</strong>
          </li>
        </ol>
      </div>
    </div>
  );
}
