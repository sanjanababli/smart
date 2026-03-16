const getStockStatus = (stock, threshold) => {
  if (stock <= 0) return { label: "Out of Stock", cls: "pp-stock-badge--out" };
  if (stock <= threshold) return { label: "Low Stock", cls: "pp-stock-badge--low" };
  return { label: "In Stock", cls: "pp-stock-badge--in" };
};

const ProductTable = ({ products, onEdit, onDelete }) => {
  if (!products.length) {
    return (
      <div className="pp-empty">
        <div className="pp-empty-icon">📦</div>
        <p>No products found.</p>
      </div>
    );
  }

  return (
    <table className="pp-table">
      <thead>
        <tr>
          <th>Product Name</th>
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
              <td><span className="pp-product-name">{product.name}</span></td>
              <td><span className="pp-category-tag">{product.category}</span></td>
              <td><span className="pp-price">₹{product.price}</span></td>
              <td><span className="pp-cost">₹{product.cost}</span></td>
              <td><span style={{ fontWeight: 600, color: product.stock <= product.threshold ? "rgba(248,113,113,0.9)" : "inherit" }}>{product.stock}</span></td>
              <td>{product.threshold}</td>
              <td><span className="pp-category-tag" style={{ background: "rgba(96,165,250,0.1)", color: "#60a5fa" }}>{product.vendorName || "TAXAS"}</span></td>
              <td><span className="pp-product-barcode">{product.barcode}</span></td>
              <td>
                <span className={`pp-stock-badge ${status.cls}`}>{status.label}</span>
              </td>
              <td>
                <div className="pp-actions">
                  <button
                    type="button"
                    className="pp-act-btn"
                    title="Edit"
                    onClick={() => onEdit(product)}
                  >✏️</button>
                  <button
                    type="button"
                    className="pp-act-btn danger"
                    title="Delete"
                    onClick={() => onDelete(product._id)}
                  >🗑️</button>
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

