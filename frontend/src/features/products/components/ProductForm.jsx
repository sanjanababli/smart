import { useEffect, useState } from "react";

const emptyForm = {
  name: "",
  category: "",
  price: "",
  cost: "",
  stock: "",
  threshold: "",
  barcode: "",
  vendorName: "TAXAS",
  vendorEmail: "pratrnerli@gmail.com",
  vendorAddress: "belgavi"
};

const ProductForm = ({ selectedProduct, onSubmit, onCancel, isOpen, onClose }) => {
  const [formData, setFormData] = useState(emptyForm);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (selectedProduct) {
      setFormData({
        _id: selectedProduct._id,
        name: selectedProduct.name,
        category: selectedProduct.category,
        price: selectedProduct.price,
        cost: selectedProduct.cost,
        stock: selectedProduct.stock,
        threshold: selectedProduct.threshold,
        barcode: selectedProduct.barcode,
        vendorName: selectedProduct.vendorName || "TAXAS",
        vendorEmail: selectedProduct.vendorEmail || "pratrnerli@gmail.com",
        vendorAddress: selectedProduct.vendorAddress || "belgavi"
      });
      return;
    }

    setFormData(emptyForm);
  }, [selectedProduct]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const result = await onSubmit({
      ...formData,
      price: Number(formData.price),
      cost: Number(formData.cost),
      stock: Number(formData.stock),
      threshold: Number(formData.threshold)
    });

    if (result.success) {
      setFormData(emptyForm);
    } else {
      setError(result.message);
    }

    setIsSubmitting(false);
  };

  const handleClose = () => {
    setFormData(emptyForm);
    setError("");
    if (onCancel) onCancel();
    if (onClose) onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="pp-modal-overlay" onClick={handleClose}>
      <div className="pp-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="pp-modal-header">
          <h2 className="pp-modal-title">
            {selectedProduct ? "Edit Product" : "Add New Product"}
          </h2>
          <button type="button" className="pp-modal-close" onClick={handleClose}>
            ✕
          </button>
        </div>

        <form className="pp-form-grid" onSubmit={handleSubmit}>
          <div className="pp-form-group full-width">
            <label className="pp-form-label">Product Name</label>
            <input
              className="pp-form-input"
              name="name"
              placeholder="Enter product name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="pp-form-group">
            <label className="pp-form-label">Category</label>
            <input
              className="pp-form-input"
              name="category"
              placeholder="e.g. Electronics"
              value={formData.category}
              onChange={handleChange}
              required
            />
          </div>

          <div className="pp-form-group">
            <label className="pp-form-label">Barcode</label>
            <input
              className="pp-form-input"
              name="barcode"
              placeholder="Scan or enter barcode"
              value={formData.barcode}
              onChange={handleChange}
              required
            />
          </div>

          <div className="pp-form-group">
            <label className="pp-form-label">Price (₹)</label>
            <input
              className="pp-form-input"
              name="price"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={formData.price}
              onChange={handleChange}
              required
            />
          </div>

          <div className="pp-form-group">
            <label className="pp-form-label">Cost (₹)</label>
            <input
              className="pp-form-input"
              name="cost"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={formData.cost}
              onChange={handleChange}
              required
            />
          </div>

          <div className="pp-form-group">
            <label className="pp-form-label">Stock Quantity</label>
            <input
              className="pp-form-input"
              name="stock"
              type="number"
              min="0"
              placeholder="0"
              value={formData.stock}
              onChange={handleChange}
              required
            />
          </div>

          <div className="pp-form-group">
            <label className="pp-form-label">Low Stock Threshold</label>
            <input
              className="pp-form-input"
              name="threshold"
              type="number"
              min="0"
              placeholder="e.g. 10"
              value={formData.threshold}
              onChange={handleChange}
              required
            />
          </div>

          <div className="pp-form-group">
            <label className="pp-form-label">Vendor Name</label>
            <input
              className="pp-form-input"
              name="vendorName"
              placeholder="e.g. TAXAS"
              value={formData.vendorName}
              onChange={handleChange}
            />
          </div>

          <div className="pp-form-group">
            <label className="pp-form-label">Vendor Email</label>
            <input
              className="pp-form-input"
              name="vendorEmail"
              type="email"
              placeholder="e.g. pratrnerli@gmail.com"
              value={formData.vendorEmail}
              onChange={handleChange}
            />
          </div>

          <div className="pp-form-group full-width">
            <label className="pp-form-label">Vendor Address</label>
            <input
              className="pp-form-input"
              name="vendorAddress"
              placeholder="e.g. belgavi"
              value={formData.vendorAddress}
              onChange={handleChange}
            />
          </div>

          {error ? <div className="pp-form-error">{error}</div> : null}

          <div className="pp-form-actions">
            <button type="submit" className="pp-btn-primary" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : selectedProduct ? "Update Product" : "Create Product"}
            </button>
            <button type="button" className="pp-btn-secondary" onClick={handleClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;
