import { toast } from "sonner";
import Image from "next/image";
import { useState } from "react";
import Nothing from "@/app/components/Nothing";
import NoDataImg from "@/public/assets/noData.png";
import LoadingLogo from "@/app/components/LoadingLogo";
import styles from "@/app/styles/accountTable.module.css";

const SERVER_API = process.env.NEXT_PUBLIC_SERVER_API;

const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath;
  return `${SERVER_API}${imagePath}`;
};

import { IoSearch as SearchIcon } from "react-icons/io5";
import {
  MdOutlineFileDownload as DownloadIcon,
  MdNote as ViewIcon,
  MdDelete as DeleteIcon,
  MdEmail as EmailIcon,
  MdAdd as AddIcon,
} from "react-icons/md";

export default function AdminTable({
  title,
  columns,
  data,
  showEditButton = true,
  showDeleteButton = true,
  showAddButton = false,
  showBulkActions = false,
  statusKey = "status",
  isLoading = false,
  onEdit = null,
  onDelete = null,
  onAdd = null,
  onBulkDelete = null,
  onBulkEmail = null,
  searchTerm = "",
  onSearchChange = null,
  enableSearch = true,
  enableDownload = true,
  enableSelection = false,
  selectedItems = new Set(),
  onSelectionChange = null,
  customActions = null,
}) {
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm || "");

  const handleSearch = (e) => {
    const value = e.target.value;
    if (onSearchChange) {
      onSearchChange(value);
    } else {
      setLocalSearchTerm(value);
    }
  };

  const filteredData = data.filter((item) => {
    const currentSearchTerm = onSearchChange ? searchTerm : localSearchTerm;
    return Object.values(item).some(
      (value) =>
        value &&
        typeof value !== "object" &&
        value.toString().toLowerCase().includes(currentSearchTerm.toLowerCase())
    );
  });

  const handleItemSelection = (itemId) => {
    if (onSelectionChange) {
      const newSelection = new Set(selectedItems);
      if (newSelection.has(itemId)) {
        newSelection.delete(itemId);
      } else {
        newSelection.add(itemId);
      }
      onSelectionChange(newSelection);
    }
  };

  const handleSelectAll = () => {
    if (onSelectionChange) {
      if (selectedItems.size === filteredData.length && filteredData.length > 0) {
        onSelectionChange(new Set());
      } else {
        onSelectionChange(new Set(filteredData.map((item) => item._id)));
      }
    }
  };

  const handleDelete = async (item) => {
    if (!item || !item._id) {
      toast.error("Invalid item selected for deletion");
      return;
    }

    if (!window.confirm(`Are you sure you want to delete this item?`)) {
      return;
    }

    if (onDelete) {
      await onDelete(item);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedItems.size === 0) {
      toast.error("No items selected for deletion");
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${selectedItems.size} item(s)?`)) {
      return;
    }

    if (onBulkDelete) {
      await onBulkDelete(Array.from(selectedItems));
    }
  };

  const handleBulkEmail = async () => {
    if (selectedItems.size === 0) {
      toast.error("No items selected for email");
      return;
    }

    if (onBulkEmail) {
      await onBulkEmail(Array.from(selectedItems));
    }
  };

  const handleDownload = () => {
    try {
      const headers = columns.map((col) => col.label).join(",");
      const rows = filteredData
        .map((item) =>
          columns
            .map((col) => {
              const value = item[col.key];
              
              if (col.key === "profileImage" || col.key === "images") return "";

              if (typeof value === "object" && value !== null) {
                return JSON.stringify(value).replace(/"/g, '""');
              }

              return value ? `"${value.toString().replace(/"/g, '""')}"` : "";
            })
            .join(",")
        )
        .join("\n");

      const csv = `${headers}\n${rows}`;
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `${title.toLowerCase()}_data.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`${title} data downloaded successfully`);
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download data");
    }
  };

  const getStatusStyle = (status) => {
    if (!status) return "";
    const normalizedStatus = status.toString().toLowerCase();

    switch (normalizedStatus) {
      case "admin":
      case "active":
      case "elite":
        return styles.statusAdmin;
      case "user":
      case "regular":
      case "pro":
        return styles.statusRegular;
      case "starter":
        return styles.statusPending;
      default:
        return styles.statusPending;
    }
  };

  const renderCellContent = (item, column) => {
    const value = item[column.key];

    if (column.key === "profileImage" || column.key === "images") {
      if (value) {
        const imageSrc = Array.isArray(value) ? value[0] : value;
        const formattedImageUrl = getImageUrl(imageSrc);
        if (!formattedImageUrl) return <span>-</span>;
        return (
          <div className={styles.imageContainer}>
            <Image
              src={formattedImageUrl}
              alt="preview"
              width={40}
              height={40}
              className={styles.tableImage}
            />
          </div>
        );
      }
      const displayName = item.username || item.name || "?";
      return (
        <div className={styles.avatarPlaceholder}>
          {displayName.charAt(0).toUpperCase()}
        </div>
      );
    }

    if (column.key === "createdAt" || column.key === "registeredAt" || column.key === "date") {
      if (!value) return "N/A";
      try {
        return new Date(value).toLocaleString();
      } catch {
        return value;
      }
    }

    if (column.key === statusKey) {
      return value && value.trim() !== "" ? (
        <span className={`${styles.statusBadge} ${getStatusStyle(value)}`}>
          {value}
        </span>
      ) : null;
    }

    if (column.key === "email" && item.emailVerified !== undefined) {
      return (
        <div className={styles.emailWithStatus}>
          <span>{value}</span>
          <span className={item.emailVerified ? styles.verified : styles.unverified}>
            {item.emailVerified ? "✓" : "!"}
          </span>
        </div>
      );
    }

    if (typeof value === "boolean") {
      return value ? "Yes" : "No";
    }

    return value || "N/A";
  };

  const renderActions = (item) => {
    return (
      <div className={styles.actionButtons}>
        {customActions && customActions(item)}
        
        {showEditButton && onEdit && (
          <button
            className={styles.editButton}
            onClick={(e) => {
              e.stopPropagation();
              onEdit(item);
            }}
            title="View details"
          >
            <ViewIcon className={styles.actionIcon} />
          </button>
        )}

        {showDeleteButton && onDelete && (
          <button
            className={styles.deleteButton}
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(item);
            }}
            title="Delete item"
          >
            <DeleteIcon className={styles.actionIcon} />
          </button>
        )}
      </div>
    );
  };

  return (
    <div className={styles.tableContainer}>
      <div className={styles.tableControls}>
        {enableSearch && (
          <div className={styles.searchContainer}>
            <SearchIcon className={styles.searchIcon} />
            <input
              type="text"
              placeholder={`Search ${title.toLowerCase()}...`}
              className={styles.searchInput}
              value={onSearchChange ? searchTerm : localSearchTerm}
              onChange={handleSearch}
            />
          </div>
        )}

        <div className={styles.actionControls}>
          {showBulkActions && (
            <>
              <button
                className={`${styles.bulkButton} ${styles.bulkEmailButton}`}
                onClick={handleBulkEmail}
                disabled={selectedItems.size === 0}
                title="Send bulk email"
              >
                <EmailIcon className={styles.bulkIcon} />
                ({selectedItems.size})
              </button>
              <button
                className={`${styles.bulkButton} ${styles.bulkDeleteButton}`}
                onClick={handleBulkDelete}
                disabled={selectedItems.size === 0}
                title="Bulk delete"
              >
                <DeleteIcon className={styles.bulkIcon} />
                ({selectedItems.size})
              </button>
            </>
          )}

          {showAddButton && onAdd && (
            <button className={styles.addButton} onClick={onAdd} title="Add new">
              <AddIcon className={styles.addIcon} />
            </button>
          )}

          {enableDownload && (
            <button className={styles.downloadButton} onClick={handleDownload}>
              <DownloadIcon className={styles.downloadIcon} />
            </button>
          )}
        </div>
      </div>

      <div className={styles.tableContentWrapper}>
        <div className={styles.tableWrapper}>
          {isLoading ? (
            <div className={styles.loadingContainer}>
              <LoadingLogo />
            </div>
          ) : filteredData.length > 0 ? (
            <table className={styles.table}>
              <thead>
                <tr>
                  {enableSelection && (
                    <th className={styles.checkboxColumn}>
                      <div className={styles.customCheckbox}>
                        <input
                          type="checkbox"
                          checked={
                            selectedItems.size === filteredData.length &&
                            filteredData.length > 0
                          }
                          onChange={handleSelectAll}
                        />
                        <div className={styles.checkboxMark}></div>
                      </div>
                    </th>
                  )}
                  {columns.map((column, index) => (
                    <th key={index}>{column.label}</th>
                  ))}
                  {(showEditButton || showDeleteButton || customActions) && (
                    <th className={styles.actionColumn}>Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item, index) => (
                  <tr key={item._id || index}>
                    {enableSelection && (
                      <td className={styles.checkboxCell}>
                        <div className={styles.customCheckbox}>
                          <input
                            type="checkbox"
                            checked={selectedItems.has(item._id)}
                            onChange={() => handleItemSelection(item._id)}
                          />
                          <div className={styles.checkboxMark}></div>
                        </div>
                      </td>
                    )}
                    {columns.map((column, colIndex) => (
                      <td key={colIndex}>{renderCellContent(item, column)}</td>
                    ))} 
                    {(showEditButton || showDeleteButton || customActions) && (
                      <td>{renderActions(item)}</td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <Nothing
              NothingImage={NoDataImg}
              Text={`No ${title.toLowerCase()} found`}
              Alt={`No ${title.toLowerCase()} found`}
            />
          )}
        </div>
      </div>
    </div>
  );
}
