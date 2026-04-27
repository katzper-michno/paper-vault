import express from "express";
import cors from "cors";
import { router } from "./router";
import { Legacy } from "./services/legacy";

// Migrate legacy vault entries
Legacy.migrateLegacyVaultEntries()

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api", router);

app.listen(process.env.BACKEND_PORT, () => {
  console.log(
    `Papervault server running on http://localhost:${process.env.BACKEND_PORT}`,
  );
  console.log(`Available endpoints:`);
  console.log(`   GET    /healthcheck`);
  console.log(`   GET    /api/search?q=:query`);
  console.log(`   GET    /api/papers`);
  console.log(`   POST   /api/papers`);
  console.log(`   PUT    /api/papers/:id`);
  console.log(`   DELETE /api/papers/:id`);
  console.log(`   GET    /api/papers/:id/bibtex`);
  console.log(`   POST   /papers/:id/files`);
  console.log(`   DELETE /papers/:id/files/:name`);
  console.log(`   GET /papers/:id/files/open`);
  console.log(`   GET /papers/:id/files/:name/open`);
});
