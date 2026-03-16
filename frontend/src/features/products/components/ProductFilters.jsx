import { useState } from "react";

const ProductFilters = ({ currentFilters, onApply, onClose }) => {
  const [formData, setFormData] = useState(currentFilters);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onApply(formData);
    if (onClose) onClose();
  };

  const handleReset = () => {
    const resetData = {
      search: "",
      category: "",
      minPrice: "",
      maxPrice: "",
      inStock: false
    };
    setFormData(resetData);
    onApply(resetData);
    if (onClose) onClose();
  };

  return (
    <form className="pp-filter-panel" onSubmit={handleSubmit}>
      <div className="pp-filter-group">
        <label className="pp-filter-label">Category</label>
        <input
          className="pp-filter-input"
          name="category"
          placeholder="All categories"
          value={formData.category}
          onChange={handleChange}
        />
      </div>

      <div className="pp-filter-group">
        <label className="pp-filter-label">Min Price</label>
        <input
          className="pp-filter-input"
          name="minPrice"
          type="number"
          min="0"
          step="0.01"
          placeholder="₹ 0"
          value={formData.minPrice}
          onChange={handleChange}
        />
      </div>

      <div className="pp-filter-group">
        <label className="pp-filter-label">Max Price</label>
        <input
          className="pp-filter-input"
          name="maxPrice"
          type="number"
          min="0"
          step="0.01"
          placeholder="₹ ∞"
          value={formData.maxPrice}
          onChange={handleChange}
        />
      </div>

      <label className="pp-filter-checkbox">
        <input
          name="inStock"
          type="checkbox"
          checked={formData.inStock}
          onChange={handleChange}
        />
        In stock only
      </label>

      <div className="pp-filter-actions">
        <button type="submit" className="pp-filter-apply">Apply</button>
        <button type="button" className="pp-filter-reset" onClick={handleReset}>Reset</button>
      </div>
    </form>
  );
};

export default ProductFilters;
