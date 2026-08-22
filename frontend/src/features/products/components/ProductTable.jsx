const getStockStatus = (stock, threshold) => {
  if (stock <= 0)          return { label: "Out of Stock", cls: "pp-stock-badge--out" };
  if (stock <= threshold)  return { label: "Low Stock",    cls: "pp-stock-badge--low" };
  return                          { label: "In Stock",     cls: "pp-stock-badge--in"  };
};

const ProductTable = ({ products, onEdit, onDelete }) => {
  if (!products.length) {
    return (
      <div className="pp-empty">
        <div className="pp-empty-icon" style={{ fontSize: 32, opacity: 0.3 }}>&#9633;</div>
        <p>No products found.</p>
      </div>
    );
  }

  return (
    <table className="pp-table">
      <thead>
        <tr>
          <th>Product</th>
          <th>Category</th>
          <th>Price</th>
          <th>Cost</th>
          <th>Stock</th>
          <th>Threshold</th>
          <th>Vendor</th>
          <th>Barcode</th>
          <th>Status</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {products.map((product) => {
          const status = getStockStatus(product.stock, product.threshold);
          return (
            <tr key={product._id}>
              <td>
                <span className="pp-product-name">{product.name}</span>
              </td>
              <td>
                <span className="pp-category-tag">{product.category}</span>
              </td>
              <td>
                <span className="pp-price">₹{product.price}</span>
              </td>
              <td>
                <span className="pp-cost">₹{product.cost}</span>
              </td>
              <td>
                <span style={{
                  fontWeight: 700,
                  color: product.stock <= product.threshold
                    ? "var(--danger)"
                    : "var(--text-primary)",
                }}>
                  {product.stock}
                </span>
              </td>
              <td style={{ color: "var(--text-secondary)" }}>{product.threshold}</td>
              <td>
                <span className="pp-category-tag" style={{
                  background: "var(--blue-50)",
                  color: "var(--blue-700)",
                  border: "1px solid var(--blue-100)",
                }}>
                  {product.vendorName || "TAXAS"}
                </span>
              </td>
              <td>
                <span className="pp-product-barcode">{product.barcode}</span>
              </td>
              <td>
                <span className={`pp-stock-badge ${status.cls}`}>{status.label}</span>
              </td>
              <td>
                <div className="pp-actions">
                  <button
                    type="button"
                    className="pp-act-btn"
                    title="Edit product"
                    onClick={() => onEdit(product)}
                  >
                    &#9998;
                  </button>
                  <button
                    type="button"
                    className="pp-act-btn danger"
                    title="Delete product"
                    onClick={() => onDelete(product._id)}
                  >
                    &#10005;
                  </button>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

export default ProductTable;