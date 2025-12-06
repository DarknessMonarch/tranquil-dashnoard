"use client";

import { useState, useEffect } from "react";
import { useTemplateStore } from "@/app/store/TemplateStore";
import { useAuthStore } from "@/app/store/AuthStore";
import PopupComponent from "@/app/components/Popup";
import Dropdown from "@/app/components/Dropdown";
import { toast } from "sonner";
import styles from "@/app/styles/form.module.css";
import Table from "@/app/components/Table";

const TEMPLATE_COLUMNS = [
  { key: "title", label: "TITLE" },
  { key: "category", label: "CATEGORY" },
  { key: "tier", label: "TIER" },
  { key: "views", label: "VIEWS" },
  { key: "bookmarks", label: "BOOKMARKS" },
  { key: "isActive", label: "STATUS" },
  { key: "createdAt", label: "CREATED" },
];

// Aligned with server categories
const CATEGORIES = [
  "dating",
  "business",
  "social",
  "content",
  "networking"
];

const TIERS = ["starter", "pro", "elite"];

export default function AdminTemplates() {
  const {
    getAllTemplatesAdmin,
    createTemplate,
    updateTemplate,
    deleteTemplate,
  } = useTemplateStore();

  const { isAdmin } = useAuthStore();

  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "dating",
    content: "",
    tier: "starter",
    tags: "",
    isActive: true
  });

  useEffect(() => {
    if (isAdmin) {
      fetchTemplates();
    }
  }, [isAdmin]);

  const fetchTemplates = async () => {
    setLoading(true);
    const result = await getAllTemplatesAdmin();
    if (result.success) {
      setTemplates(result.data);
    }
    setLoading(false);
  };

  const transformedTemplates = templates.map(template => ({
    ...template,
    views: template.reads || 0,
    bookmarks: template.bookmarks || 0,
    isActive: template.isActive ? "Active" : "Inactive",
    createdAt: new Date(template.createdAt).toLocaleDateString(),
  }));

  const handleAdd = () => {
    setEditingTemplate(null);
    setFormData({
      title: "",
      description: "",
      category: "dating",
      content: "",
      tier: "starter",
      tags: "",
      isActive: true
    });
    setShowModal(true);
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setFormData({
      title: template.title,
      description: template.description || "",
      category: template.category,
      content: template.content,
      tier: template.tier,
      tags: template.tags?.join(", ") || "",
      isActive: template.isActive
    });
    setShowModal(true);
  };

  const handleDelete = async (template) => {
    setLoading(true);
    const result = await deleteTemplate(template._id);
    if (result.success) {
      toast.success("Template deleted");
      await fetchTemplates();
    } else {
      toast.error(result.message);
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.description || !formData.content) {
      toast.error("Title, description and content are required");
      return;
    }

    setLoading(true);
    const templateData = {
      title: formData.title,
      description: formData.description,
      category: formData.category,
      content: formData.content,
      tier: formData.tier,
      isActive: formData.isActive
    };

    const result = editingTemplate
      ? await updateTemplate(editingTemplate._id, templateData)
      : await createTemplate(templateData);

    if (result.success) {
      toast.success(editingTemplate ? "Template updated" : "Template created");
      setShowModal(false);
      resetForm();
      await fetchTemplates();
    } else {
      toast.error(result.message);
    }
    setLoading(false);
  };

  return (
    <div>
      <Table
        title="Templates"
        columns={TEMPLATE_COLUMNS}
        data={transformedTemplates}
        showEditButton={true}
        showDeleteButton={true}
        showAddButton={true}
        statusKey="isActive"
        isLoading={loading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onAdd={handleAdd}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />

      <PopupComponent
        IsOpen={showModal}
        OnClose={() => setShowModal(false)}
        Width={700}
        Height={700}
        Top={50}
        Right={50}
        Left={50}
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
              {editingTemplate ? "Edit Template" : "Create Template"}
            </h3>

            <div className={styles.formInputContainer}>
              <label>Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="Enter template title"
                className={styles.inputField}
              />
            </div>

            <div className={styles.formInputContainer}>
              <label>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Enter template description"
                rows={3}
                className={styles.inputField}
                style={{ resize: "vertical" }}
              />
            </div>

            <div className={styles.formInputContainer}>
              <label>Category</label>
              <Dropdown
                options={CATEGORIES.map(cat => ({ value: cat, label: cat.charAt(0).toUpperCase() + cat.slice(1) }))}
                onSelect={(option) => setFormData({...formData, category: option.value})}
                dropPlaceHolder="Select category"
                value={CATEGORIES.map(cat => ({ value: cat, label: cat.charAt(0).toUpperCase() + cat.slice(1) })).find(c => c.value === formData.category)}
              />
            </div>

            <div className={styles.formInputContainer}>
              <label>Tier</label>
              <Dropdown
                options={TIERS.map(tier => ({ value: tier, label: tier.charAt(0).toUpperCase() + tier.slice(1) }))}
                onSelect={(option) => setFormData({...formData, tier: option.value})}
                dropPlaceHolder="Select tier"
                value={TIERS.map(tier => ({ value: tier, label: tier.charAt(0).toUpperCase() + tier.slice(1) })).find(t => t.value === formData.tier)}
              />
            </div>

            <div className={styles.formInputContainer}>
              <label>Content</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({...formData, content: e.target.value})}
                placeholder="Enter template content"
                rows={6}
                className={styles.inputField}
                style={{ resize: "vertical" }}
              />
            </div>

            <div className={styles.formInputContainer}>
              <label>Tags (comma separated)</label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({...formData, tags: e.target.value})}
                placeholder="funny, casual, romantic"
                className={styles.inputField}
              />
            </div>

            <div className={styles.formToggleContainer}>
              <label>Active</label>
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className={styles.submitButton}
            >
              {loading ? "Saving..." : editingTemplate ? "Update Template" : "Create Template"}
            </button>
          </div>
        }
      />
    </div>
  );
}
