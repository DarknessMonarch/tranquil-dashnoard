"use client";

import { useState, useEffect } from "react";
import { useSubscriptionStore } from "@/app/store/SubscriptionStore";
import { useAuthStore } from "@/app/store/AuthStore";
import PopupComponent from "@/app/components/Popup";
import Dropdown from "@/app/components/Dropdown";
import { toast } from "sonner";
import styles from "@/app/styles/form.module.css";
import Table from "@/app/components/Table";

const SERVER_API = process.env.NEXT_PUBLIC_SERVER_API;

const SUBSCRIPTION_COLUMNS = [
  { key: "user", label: "USER" },
  { key: "tier", label: "TIER" },
  { key: "amount", label: "AMOUNT" },
  { key: "status", label: "STATUS" },
  { key: "reference", label: "REFERENCE" },
  { key: "createdAt", label: "DATE" },
];

export default function AdminSubscriptions() {
  const { 
    allSubscriptions, 
    allSubscriptionsLoading, 
    getAllSubscriptions,
    grantSubscription
  } = useSubscriptionStore();

  const { isAdmin, getAuthHeader } = useAuthStore();

  const [searchTerm, setSearchTerm] = useState("");
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [grantData, setGrantData] = useState({
    userId: "",
    tier: "pro",
    duration: 30
  });

  const [pricingSettings, setPricingSettings] = useState({
    maxFreeTemplates: 5,
    proPrice: 3499,
    elitePrice: 9999
  });

  useEffect(() => {
    if (isAdmin) {
      getAllSubscriptions();
      loadPricingSettings();
    }
  }, [isAdmin, getAllSubscriptions]);

  const loadPricingSettings = async () => {
    try {
      const response = await fetch(`${SERVER_API}/subscriptions/pricing`, {
        headers: getAuthHeader()
      });

      const data = await response.json();

      if (data.status === 'success') {
        setPricingSettings({
          maxFreeTemplates: 5, // This is template-specific, keep default
          proPrice: data.data.pricing.pro.price,
          elitePrice: data.data.pricing.elite.price
        });
      }
    } catch (error) {
      console.error('Load pricing error:', error);
    }
  };

  const handleSavePricing = async () => {
    setLoading(true);

    try {
      const response = await fetch(`${SERVER_API}/subscriptions-admin/pricing`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader()
        },
        body: JSON.stringify({
          pro: pricingSettings.proPrice,
          elite: pricingSettings.elitePrice
        })
      });

      const data = await response.json();

      if (data.status === 'success') {
        toast.success("Pricing settings saved successfully");
        setShowPricingModal(false);
      } else {
        toast.error(data.message || "Failed to save pricing");
      }
    } catch (error) {
      console.error('Save pricing error:', error);
      toast.error("Failed to save pricing");
    } finally {
      setLoading(false);
    }
  };

  const transformedSubscriptions = allSubscriptions.map(sub => ({
    ...sub,
    user: sub.user?.username || sub.user?.email || "Unknown",
    amount: `KSh ${sub.amount?.toLocaleString() || 0}`,
    tier: sub.tier || "N/A",
    reference: sub.reference || "N/A",
    status: sub.status || "pending",
    createdAt: new Date(sub.createdAt).toLocaleDateString(),
  }));

  const handleGrantSubscription = async () => {
    if (!grantData.userId || !grantData.tier) {
      toast.error("User ID and tier are required");
      return;
    }

    setLoading(true);
    const result = await grantSubscription(
      grantData.userId,
      grantData.tier,
      grantData.duration
    );

    if (result.success) {
      toast.success("Subscription granted successfully");
      setShowGrantModal(false);
      setGrantData({ userId: "", tier: "pro", duration: 30 });
      await getAllSubscriptions();
    } else {
      toast.error(result.message);
    }
    setLoading(false);
  };

  const handleViewDetails = (subscription) => {
    toast.info(`Subscription: ${subscription.reference}`);
  };

  return (
    <div>
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        marginBottom: "20px" 
      }}>
        <h1 style={{
          fontSize: "2rem",
          fontWeight: "700",
          background: "linear-gradient(135deg, #ec4899 0%, #a855f7 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}>
          Subscriptions
        </h1>
        <button
          onClick={() => setShowPricingModal(true)}
          style={{
            padding: "12px 24px",
            background: "linear-gradient(135deg, #ec4899 0%, #a855f7 100%)",
            color: "white",
            border: "none",
            borderRadius: "12px",
            cursor: "pointer",
            fontSize: "1rem",
            fontWeight: "600",
            transition: "all 0.2s ease",
          }}
        >
          Pricing Settings
        </button>
      </div>

      <Table
        title=""
        columns={SUBSCRIPTION_COLUMNS}
        data={transformedSubscriptions}
        showEditButton={true}
        showDeleteButton={false}
        showAddButton={true}
        statusKey="status"
        isLoading={allSubscriptionsLoading || loading}
        onEdit={handleViewDetails}
        onAdd={() => setShowGrantModal(true)}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />

      {/* Grant Subscription Modal */}
      <PopupComponent
        IsOpen={showGrantModal}
        OnClose={() => setShowGrantModal(false)}
        Width={500}
        Top={50}
        Left={50}
        Right={50}
        Bottom={50}
        BorderRadiusTopLeft={20}
        BorderRadiusTopRight={20}
        BorderRadiusBottomLeft={20}
        BorderRadiusBottomRight={20}
        Blur={5}
        Zindex={1000}
        Content={
          <div className={styles.formMain}>
            <h3 style={{ 
              fontSize: "1.5rem", 
              fontWeight: "700",
              background: "linear-gradient(135deg, #ec4899 0%, #a855f7 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              marginBottom: "20px",
              textAlign: "center"
            }}>
              Grant Subscription
            </h3>

            <div className={styles.formInputContainer}>
              <label>User ID</label>
              <input
                type="text"
                value={grantData.userId}
                onChange={(e) => setGrantData({...grantData, userId: e.target.value})}
                placeholder="Enter user ID"
                className={styles.inputField}
              />
            </div>

            <div className={styles.formInputContainer}>
              <label>Tier</label>
              <Dropdown
                options={[
                  { value: "pro", label: `Pro (KSh ${pricingSettings.proPrice.toLocaleString()})` },
                  { value: "elite", label: `Elite (KSh ${pricingSettings.elitePrice.toLocaleString()})` }
                ]}
                onSelect={(option) => setGrantData({...grantData, tier: option.value})}
                dropPlaceHolder="Select tier"
                value={[
                  { value: "pro", label: `Pro (KSh ${pricingSettings.proPrice.toLocaleString()})` },
                  { value: "elite", label: `Elite (KSh ${pricingSettings.elitePrice.toLocaleString()})` }
                ].find(t => t.value === grantData.tier)}
              />
            </div>

            <div className={styles.formInputContainer}>
              <label>Duration (days)</label>
              <input
                type="number"
                value={grantData.duration}
                onChange={(e) => setGrantData({...grantData, duration: parseInt(e.target.value)})}
                placeholder="30"
                min="1"
                className={styles.inputField}
              />
            </div>

            <button
              onClick={handleGrantSubscription}
              disabled={loading}
              className={styles.submitButton}
            >
              {loading ? "Granting..." : "Grant Subscription"}
            </button>
          </div>
        }
      />

      {/* Pricing Settings Modal */}
      <PopupComponent
        IsOpen={showPricingModal}
        OnClose={() => setShowPricingModal(false)}
        Width={500}
        Top={50}
        Left={50}
        Right={50}
        Bottom={50}
        BorderRadiusTopLeft={20}
        BorderRadiusTopRight={20}
        BorderRadiusBottomLeft={20}
        BorderRadiusBottomRight={20}
        Blur={5}
        Zindex={1000}
        Content={
          <div className={styles.formMain}>
            <h3 style={{ 
              fontSize: "1.5rem", 
              fontWeight: "700",
              background: "linear-gradient(135deg, #ec4899 0%, #a855f7 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              marginBottom: "20px",
              textAlign: "center"
            }}>
              Pricing & Limits
            </h3>

            <div className={styles.formInputContainer}>
              <label>
                Max Free Templates
                <span className={styles.required}>*</span>
              </label>
              <input
                type="number"
                value={pricingSettings.maxFreeTemplates}
                onChange={(e) => setPricingSettings({
                  ...pricingSettings, 
                  maxFreeTemplates: parseInt(e.target.value) || 0
                })}
                placeholder="5"
                min="0"
                className={styles.inputField}
              />
              <span className={styles.helperText}>
                Maximum number of templates free users can access
              </span>
            </div>

            <div className={styles.formInputContainer}>
              <label>
                Pro Tier Price (KSh)
                <span className={styles.required}>*</span>
              </label>
              <input
                type="number"
                value={pricingSettings.proPrice}
                onChange={(e) => setPricingSettings({
                  ...pricingSettings, 
                  proPrice: parseInt(e.target.value) || 0
                })}
                placeholder="3499"
                min="0"
                className={styles.inputField}
              />
              <span className={styles.helperText}>
                Monthly subscription price for Pro tier
              </span>
            </div>

            <div className={styles.formInputContainer}>
              <label>
                Elite Tier Price (KSh)
                <span className={styles.required}>*</span>
              </label>
              <input
                type="number"
                value={pricingSettings.elitePrice}
                onChange={(e) => setPricingSettings({
                  ...pricingSettings, 
                  elitePrice: parseInt(e.target.value) || 0
                })}
                placeholder="9999"
                min="0"
                className={styles.inputField}
              />
              <span className={styles.helperText}>
                Monthly subscription price for Elite tier
              </span>
            </div>

            <button
              onClick={handleSavePricing}
              disabled={loading}
              className={styles.submitButton}
            >
              {loading ? "Saving..." : "Save Pricing Settings"}
            </button>
          </div>
        }
      />
    </div>
  );
}