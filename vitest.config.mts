import { defineConfig } from "vitest/config";

// Testler tests/ altında; veritabanı ya da tarayıcı gerektirmeyen saf fonksiyonlar Node ortamında çalışır
export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
  },
});
