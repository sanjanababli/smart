import { connectDatabase, disconnectDatabase } from "../src/config/db.js";
import { Product } from "../src/models/Product.js";
import { logger } from "../src/config/logger.js";
import dotenv from "dotenv";

dotenv.config();

const updateVendorDefaults = async () => {
  try {
    await connectDatabase();
    
    logger.info("Starting vendor defaults migration...");
    
    const result = await Product.updateMany(
      {
        $or: [
          { vendorName: { $exists: false } },
          { vendorEmail: { $exists: false } },
          { vendorAddress: { $exists: false } }
        ]
      },
      {
        $set: {
          vendorName: "TAXAS",
          vendorEmail: "pratrnerli@gmail.com",
          vendorAddress: "belgavi"
        }
      }
    );
    
    logger.info(`Migration complete. Updated ${result.modifiedCount} products.`);
    
    await disconnectDatabase();
    process.exit(0);
  } catch (error) {
    logger.error("Migration failed", { error: error.message });
    await disconnectDatabase();
    process.exit(1);
  }
};

updateVendorDefaults();
