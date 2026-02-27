"use client";

import { useEffect, useState, useCallback } from "react";
import { adminApi } from "@/lib/api";
import toast from "react-hot-toast";
import type { PlanConfig } from "@/types";
import {
  Loader2,
  Crown,
  Zap,
  Shield,
  Plus,
  Pencil,
  Trash2,
  Save,
  X,
  DollarSign,
  Star,
  ToggleLeft,
  ToggleRight,
  GripVertical,
  Check,
} from "lucide-react";

const EMPTY_LIMITS = {
  maxCvs: 2,
  maxProjects: 3,
  maxAiCreditsPerMonth: 10,
  maxPdfExportsPerMonth: 3,
  hasCustomDomain: false,
  hasAdvancedAiTools: false,
  hasPremiumTemplates: false,
  hasCustomBranding: false,
  hasPrioritySupport: false,
};

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<PlanConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<PlanConfig | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit form state
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formMonthlyPrice, setFormMonthlyPrice] = useState(0);
  const [formYearlyPrice, setFormYearlyPrice] = useState(0);
  const [formPopular, setFormPopular] = useState(false);
  const [formIsActive, setFormIsActive] = useState(true);
  const [formDisplayOrder, setFormDisplayOrder] = useState(0);
  const [formLimits, setFormLimits] = useState(EMPTY_LIMITS);
  const [formFeatures, setFormFeatures] = useState<string[]>([]);
  const [newFeature, setNewFeature] = useState("");
  const [formStripePriceIdMonthly, setFormStripePriceIdMonthly] = useState("");
  const [formStripePriceIdYearly, setFormStripePriceIdYearly] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getPlans();
      setPlans(res.data);
    } catch {
      toast.error("Failed to load plans");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const planIcon = (plan: string) => {
    if (plan === "enterprise")
      return <Shield className="h-5 w-5 text-purple-400" />;
    if (plan === "premium") return <Crown className="h-5 w-5 text-amber-400" />;
    return <Zap className="h-5 w-5 text-content-2" />;
  };

  const planGradient = (plan: string) => {
    if (plan === "enterprise")
      return "from-purple-500/20 to-purple-500/5 border-purple-500/20";
    if (plan === "premium")
      return "from-amber-500/20 to-amber-500/5 border-amber-500/20";
    return "from-zinc-500/20 to-zinc-500/5 border-zinc-500/10";
  };

  const openEdit = (plan: PlanConfig) => {
    setEditingPlan(plan);
    setIsNew(false);
    setFormName(plan.name);
    setFormDescription(plan.description);
    setFormMonthlyPrice(plan.monthlyPrice / 100); // cents to dollars
    setFormYearlyPrice(plan.yearlyPrice / 100);
    setFormPopular(plan.popular);
    setFormIsActive(plan.isActive);
    setFormDisplayOrder(plan.displayOrder);
    setFormLimits({ ...plan.limits });
    setFormFeatures([...plan.features]);
    setFormStripePriceIdMonthly(plan.stripePriceIdMonthly || "");
    setFormStripePriceIdYearly(plan.stripePriceIdYearly || "");
  };

  const handleSave = async () => {
    if (!editingPlan) return;
    setSaving(true);
    try {
      const payload = {
        name: formName,
        description: formDescription,
        monthlyPrice: Math.round(formMonthlyPrice * 100), // dollars to cents
        yearlyPrice: Math.round(formYearlyPrice * 100),
        popular: formPopular,
        isActive: formIsActive,
        displayOrder: formDisplayOrder,
        limits: formLimits,
        features: formFeatures,
        stripePriceIdMonthly: formStripePriceIdMonthly || undefined,
        stripePriceIdYearly: formStripePriceIdYearly || undefined,
      };

      await adminApi.updatePlan(editingPlan._id, payload);
      toast.success("Plan updated successfully");
      setEditingPlan(null);
      load();
    } catch {
      toast.error("Failed to update plan");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (plan: PlanConfig) => {
    if (plan.plan === "free") {
      toast.error("Cannot delete the Free plan");
      return;
    }
    if (!confirm(`Delete "${plan.name}" plan? This cannot be undone.`)) return;
    try {
      await adminApi.deletePlan(plan._id);
      toast.success("Plan deleted");
      load();
    } catch {
      toast.error("Failed to delete plan");
    }
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      setFormFeatures([...formFeatures, newFeature.trim()]);
      setNewFeature("");
    }
  };

  const removeFeature = (index: number) => {
    setFormFeatures(formFeatures.filter((_, i) => i !== index));
  };

  const updateLimit = (key: string, value: any) => {
    setFormLimits((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-content">Plan & Pricing</h1>
          <p className="text-sm text-content-3">
            Manage subscription plans, pricing, and features
          </p>
        </div>
      </div>

      {/* Plan Cards */}
      <div className="grid gap-6 lg:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan._id}
            className={`relative overflow-hidden rounded-2xl border bg-gradient-to-b p-6 ${planGradient(plan.plan)} ${
              !plan.isActive ? "opacity-50" : ""
            }`}
          >
            {/* Popular badge */}
            {plan.popular && (
              <div className="absolute right-4 top-4">
                <span className="flex items-center gap-1 rounded-full bg-amber-500/20 px-2.5 py-1 text-[10px] font-semibold text-amber-400">
                  <Star className="h-3 w-3" /> Popular
                </span>
              </div>
            )}

            {/* Inactive badge */}
            {!plan.isActive && (
              <div className="absolute left-4 top-4">
                <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-medium text-red-400">
                  Inactive
                </span>
              </div>
            )}

            {/* Plan icon + name */}
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-xl bg-card-hover p-2.5">
                {planIcon(plan.plan)}
              </div>
              <div>
                <h3 className="text-lg font-bold text-content">{plan.name}</h3>
                <p className="text-xs text-content-3">{plan.description}</p>
              </div>
            </div>

            {/* Pricing */}
            <div className="mb-5">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-content">
                  ${(plan.monthlyPrice / 100).toFixed(0)}
                </span>
                <span className="text-sm text-content-3">/mo</span>
              </div>
              {plan.yearlyPrice > 0 && (
                <p className="mt-0.5 text-xs text-content-4">
                  ${(plan.yearlyPrice / 100).toFixed(0)}/yr ($
                  {(plan.yearlyPrice / 100 / 12).toFixed(0)}/mo billed annually)
                </p>
              )}
            </div>

            {/* Limits Summary */}
            <div className="mb-4 grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-card p-2">
                <p className="text-[10px] text-content-4">CVs</p>
                <p className="text-sm font-semibold text-content">
                  {plan.limits.maxCvs === -1 ? "Unlimited" : plan.limits.maxCvs}
                </p>
              </div>
              <div className="rounded-lg bg-card p-2">
                <p className="text-[10px] text-content-4">Projects</p>
                <p className="text-sm font-semibold text-content">
                  {plan.limits.maxProjects === -1
                    ? "Unlimited"
                    : plan.limits.maxProjects}
                </p>
              </div>
              <div className="rounded-lg bg-card p-2">
                <p className="text-[10px] text-content-4">AI Credits/mo</p>
                <p className="text-sm font-semibold text-content">
                  {plan.limits.maxAiCreditsPerMonth === -1
                    ? "Unlimited"
                    : plan.limits.maxAiCreditsPerMonth}
                </p>
              </div>
              <div className="rounded-lg bg-card p-2">
                <p className="text-[10px] text-content-4">PDF Exports/mo</p>
                <p className="text-sm font-semibold text-content">
                  {plan.limits.maxPdfExportsPerMonth === -1
                    ? "Unlimited"
                    : plan.limits.maxPdfExportsPerMonth}
                </p>
              </div>
            </div>

            {/* Features */}
            <div className="mb-5 space-y-1.5">
              {plan.features.map((f, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-xs text-content-2"
                >
                  <Check className="h-3 w-3 text-emerald-400" />
                  {f}
                </div>
              ))}
            </div>

            {/* Boolean features */}
            <div className="mb-5 flex flex-wrap gap-1.5">
              {plan.limits.hasAdvancedAiTools && (
                <span className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-[10px] text-indigo-400">
                  AI Tools
                </span>
              )}
              {plan.limits.hasPremiumTemplates && (
                <span className="rounded-full bg-purple-500/10 px-2 py-0.5 text-[10px] text-purple-400">
                  Templates
                </span>
              )}
              {plan.limits.hasCustomDomain && (
                <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] text-blue-400">
                  Custom Domain
                </span>
              )}
              {plan.limits.hasCustomBranding && (
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-400">
                  Branding
                </span>
              )}
              {plan.limits.hasPrioritySupport && (
                <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-400">
                  Priority Support
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => openEdit(plan)}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-edge bg-card py-2 text-sm font-medium text-content-2 transition hover:bg-card-hover hover:text-content"
              >
                <Pencil className="h-3.5 w-3.5" /> Edit
              </button>
              {plan.plan !== "free" && (
                <button
                  onClick={() => handleDelete(plan)}
                  className="flex items-center justify-center rounded-xl border border-red-500/10 bg-red-500/5 px-3 py-2 text-red-400 transition hover:bg-red-500/10"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Order indicator */}
            <div className="mt-3 flex items-center gap-1 text-[10px] text-content-4">
              <GripVertical className="h-3 w-3" />
              Order: {plan.displayOrder}
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {editingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-edge bg-elevated p-6 shadow-2xl my-8">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {planIcon(editingPlan.plan)}
                <div>
                  <h2 className="text-lg font-bold text-content">
                    Edit {editingPlan.name} Plan
                  </h2>
                  <p className="text-xs text-content-3 capitalize">
                    {editingPlan.plan} plan configuration
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingPlan(null)}
                className="rounded-lg p-1.5 text-content-3 transition hover:bg-card-hover hover:text-content"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[calc(100vh-200px)] overflow-y-auto space-y-6 pr-1">
              {/* Basic Info */}
              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-content-4">
                  Basic Information
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs text-content-3">
                      Name
                    </label>
                    <input
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full rounded-xl border border-edge bg-card px-3 py-2.5 text-sm text-content outline-none focus:border-orange-500/30"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-content-3">
                      Display Order
                    </label>
                    <input
                      type="number"
                      value={formDisplayOrder}
                      onChange={(e) =>
                        setFormDisplayOrder(Number(e.target.value))
                      }
                      className="w-full rounded-xl border border-edge bg-card px-3 py-2.5 text-sm text-content outline-none focus:border-orange-500/30"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-1 block text-xs text-content-3">
                      Description
                    </label>
                    <input
                      type="text"
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      className="w-full rounded-xl border border-edge bg-card px-3 py-2.5 text-sm text-content outline-none focus:border-orange-500/30"
                    />
                  </div>
                </div>
                <div className="mt-3 flex gap-4">
                  <button
                    onClick={() => setFormPopular(!formPopular)}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs transition ${
                      formPopular
                        ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                        : "border-edge text-content-3 hover:text-content-2"
                    }`}
                  >
                    {formPopular ? (
                      <ToggleRight className="h-4 w-4" />
                    ) : (
                      <ToggleLeft className="h-4 w-4" />
                    )}
                    Popular
                  </button>
                  <button
                    onClick={() => setFormIsActive(!formIsActive)}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs transition ${
                      formIsActive
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                        : "border-red-500/30 bg-red-500/10 text-red-400"
                    }`}
                  >
                    {formIsActive ? (
                      <ToggleRight className="h-4 w-4" />
                    ) : (
                      <ToggleLeft className="h-4 w-4" />
                    )}
                    {formIsActive ? "Active" : "Inactive"}
                  </button>
                </div>
              </div>

              {/* Pricing */}
              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-content-4">
                  Pricing
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs text-content-3">
                      Monthly Price ($)
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-content-4" />
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formMonthlyPrice}
                        onChange={(e) =>
                          setFormMonthlyPrice(Number(e.target.value))
                        }
                        className="w-full rounded-xl border border-edge bg-card pl-9 pr-3 py-2.5 text-sm text-content outline-none focus:border-orange-500/30"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-content-3">
                      Yearly Price ($)
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-content-4" />
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formYearlyPrice}
                        onChange={(e) =>
                          setFormYearlyPrice(Number(e.target.value))
                        }
                        className="w-full rounded-xl border border-edge bg-card pl-9 pr-3 py-2.5 text-sm text-content outline-none focus:border-orange-500/30"
                      />
                    </div>
                    {formMonthlyPrice > 0 && formYearlyPrice > 0 && (
                      <p className="mt-1 text-[10px] text-content-4">
                        ${(formYearlyPrice / 12).toFixed(2)}/mo — saves{" "}
                        {Math.round(
                          ((formMonthlyPrice * 12 - formYearlyPrice) /
                            (formMonthlyPrice * 12)) *
                            100,
                        )}
                        %
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Limits */}
              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-content-4">
                  Limits
                </h3>
                <p className="mb-2 text-[10px] text-content-4">
                  Use -1 for unlimited
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs text-content-3">
                      Max CVs
                    </label>
                    <input
                      type="number"
                      min="-1"
                      value={formLimits.maxCvs}
                      onChange={(e) =>
                        updateLimit("maxCvs", Number(e.target.value))
                      }
                      className="w-full rounded-xl border border-edge bg-card px-3 py-2.5 text-sm text-content outline-none focus:border-orange-500/30"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-content-3">
                      Max Projects
                    </label>
                    <input
                      type="number"
                      min="-1"
                      value={formLimits.maxProjects}
                      onChange={(e) =>
                        updateLimit("maxProjects", Number(e.target.value))
                      }
                      className="w-full rounded-xl border border-edge bg-card px-3 py-2.5 text-sm text-content outline-none focus:border-orange-500/30"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-content-3">
                      AI Credits / Month
                    </label>
                    <input
                      type="number"
                      min="-1"
                      value={formLimits.maxAiCreditsPerMonth}
                      onChange={(e) =>
                        updateLimit(
                          "maxAiCreditsPerMonth",
                          Number(e.target.value),
                        )
                      }
                      className="w-full rounded-xl border border-edge bg-card px-3 py-2.5 text-sm text-content outline-none focus:border-orange-500/30"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-content-3">
                      PDF Exports / Month
                    </label>
                    <input
                      type="number"
                      min="-1"
                      value={formLimits.maxPdfExportsPerMonth}
                      onChange={(e) =>
                        updateLimit(
                          "maxPdfExportsPerMonth",
                          Number(e.target.value),
                        )
                      }
                      className="w-full rounded-xl border border-edge bg-card px-3 py-2.5 text-sm text-content outline-none focus:border-orange-500/30"
                    />
                  </div>
                </div>

                {/* Boolean Toggles */}
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {[
                    { key: "hasAdvancedAiTools", label: "Advanced AI Tools" },
                    { key: "hasPremiumTemplates", label: "Premium Templates" },
                    { key: "hasCustomDomain", label: "Custom Domain" },
                    { key: "hasCustomBranding", label: "Custom Branding" },
                    { key: "hasPrioritySupport", label: "Priority Support" },
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() =>
                        updateLimit(key, !(formLimits as any)[key])
                      }
                      className={`flex items-center justify-between rounded-xl border px-3 py-2.5 text-xs transition ${
                        (formLimits as any)[key]
                          ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-400"
                          : "border-edge bg-card text-content-3"
                      }`}
                    >
                      <span>{label}</span>
                      {(formLimits as any)[key] ? (
                        <ToggleRight className="h-4 w-4" />
                      ) : (
                        <ToggleLeft className="h-4 w-4" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Features List */}
              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-content-4">
                  Features (Pricing Display)
                </h3>
                <div className="space-y-1.5">
                  {formFeatures.map((f, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 rounded-lg border border-edge bg-card px-3 py-2"
                    >
                      <Check className="h-3 w-3 shrink-0 text-emerald-400" />
                      <span className="flex-1 text-xs text-content-2">{f}</span>
                      <button
                        onClick={() => removeFeature(i)}
                        className="shrink-0 text-content-4 hover:text-red-400"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex gap-2">
                  <input
                    type="text"
                    value={newFeature}
                    onChange={(e) => setNewFeature(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addFeature()}
                    placeholder="Add feature…"
                    className="flex-1 rounded-xl border border-edge bg-card px-3 py-2 text-xs text-content outline-none focus:border-orange-500/30"
                  />
                  <button
                    onClick={addFeature}
                    className="rounded-xl border border-edge bg-card px-3 py-2 text-xs text-content-2 hover:text-content"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Stripe Config */}
              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-content-4">
                  Stripe Configuration (optional)
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs text-content-3">
                      Monthly Price ID
                    </label>
                    <input
                      type="text"
                      value={formStripePriceIdMonthly}
                      onChange={(e) =>
                        setFormStripePriceIdMonthly(e.target.value)
                      }
                      placeholder="price_xxx"
                      className="w-full rounded-xl border border-edge bg-card px-3 py-2.5 text-xs font-mono text-content-2 outline-none focus:border-orange-500/30"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-content-3">
                      Yearly Price ID
                    </label>
                    <input
                      type="text"
                      value={formStripePriceIdYearly}
                      onChange={(e) =>
                        setFormStripePriceIdYearly(e.target.value)
                      }
                      placeholder="price_xxx"
                      className="w-full rounded-xl border border-edge bg-card px-3 py-2.5 text-xs font-mono text-content-2 outline-none focus:border-orange-500/30"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex items-center justify-end gap-3 border-t border-edge pt-4">
              <button
                onClick={() => setEditingPlan(null)}
                className="rounded-xl border border-edge px-4 py-2 text-sm text-content-2 transition hover:bg-card-hover"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2 text-sm font-medium text-white transition hover:bg-orange-600 disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
