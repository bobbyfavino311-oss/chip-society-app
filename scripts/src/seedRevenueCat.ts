import { getUncachableRevenueCatClient } from "./revenueCatClient";

import {
  listProjects,
  createProject,
  listApps,
  createApp,
  listAppPublicApiKeys,
  listProducts,
  createProduct,
  listOfferings,
  createOffering,
  updateOffering,
  listPackages,
  createPackages,
  attachProductsToPackage,
  type App,
  type Product,
  type Project,
  type Offering,
  type Package,
  type CreateProductData,
} from "@replit/revenuecat-sdk";

const PROJECT_NAME = "Chip Society";

const APP_STORE_APP_NAME = "Chip Society iOS";
const APP_STORE_BUNDLE_ID = "com.chipsociety.app";
const PLAY_STORE_APP_NAME = "Chip Society Android";
const PLAY_STORE_PACKAGE_NAME = "com.chipsociety.app";

const OFFERING_IDENTIFIER = "chip_shop";
const OFFERING_DISPLAY_NAME = "Chip Shop";

type BundleDef = {
  identifier: string;
  displayName: string;
  chips: number;
  priceUsdCents: number;
};

const CHIP_BUNDLES: BundleDef[] = [
  { identifier: "chips_100k",  displayName: "Pocket Change — 100K Chips",  chips: 100_000,     priceUsdCents: 99   },
  { identifier: "chips_500k",  displayName: "Stack — 500K Chips",          chips: 500_000,     priceUsdCents: 399  },
  { identifier: "chips_1500k", displayName: "Buy-In — 1.5M Chips",         chips: 1_500_000,   priceUsdCents: 999  },
  { identifier: "chips_5m",    displayName: "High Roller — 5M Chips",      chips: 5_000_000,   priceUsdCents: 2499 },
  { identifier: "chips_15m",   displayName: "Whale — 15M Chips",           chips: 15_000_000,  priceUsdCents: 4999 },
  { identifier: "chips_50m",   displayName: "Shark — 50M Chips",           chips: 50_000_000,  priceUsdCents: 9999 },
];

type TestStorePricesResponse = {
  object: string;
  prices: { amount_micros: number; currency: string }[];
};

async function seedRevenueCat() {
  const client = await getUncachableRevenueCatClient();

  // ── Project ───────────────────────────────────────────────────────────────

  let project: Project;
  const { data: existingProjects, error: listProjectsError } = await listProjects({
    client,
    query: { limit: 20 },
  });
  if (listProjectsError) throw new Error("Failed to list projects");

  const existingProject = existingProjects.items?.find((p) => p.name === PROJECT_NAME);
  if (existingProject) {
    console.log("Project already exists:", existingProject.id);
    project = existingProject;
  } else {
    const { data: newProject, error } = await createProject({ client, body: { name: PROJECT_NAME } });
    if (error) throw new Error("Failed to create project");
    console.log("Created project:", newProject.id);
    project = newProject;
  }

  // ── Apps ──────────────────────────────────────────────────────────────────

  const { data: apps, error: listAppsError } = await listApps({
    client,
    path: { project_id: project.id },
    query: { limit: 20 },
  });
  if (listAppsError || !apps || apps.items.length === 0) throw new Error("No apps found");

  const testStoreApp: App | undefined = apps.items.find((a) => a.type === "test_store");
  if (!testStoreApp) throw new Error("No test store app found — expected it to be auto-created");
  console.log("Test Store app:", testStoreApp.id);

  let appStoreApp: App | undefined = apps.items.find((a) => a.type === "app_store");
  if (!appStoreApp) {
    const { data: newApp, error } = await createApp({
      client,
      path: { project_id: project.id },
      body: { name: APP_STORE_APP_NAME, type: "app_store", app_store: { bundle_id: APP_STORE_BUNDLE_ID } },
    });
    if (error) throw new Error("Failed to create App Store app");
    appStoreApp = newApp;
    console.log("Created App Store app:", appStoreApp.id);
  } else {
    console.log("App Store app found:", appStoreApp.id);
  }

  let playStoreApp: App | undefined = apps.items.find((a) => a.type === "play_store");
  if (!playStoreApp) {
    const { data: newApp, error } = await createApp({
      client,
      path: { project_id: project.id },
      body: { name: PLAY_STORE_APP_NAME, type: "play_store", play_store: { package_name: PLAY_STORE_PACKAGE_NAME } },
    });
    if (error) throw new Error("Failed to create Play Store app");
    playStoreApp = newApp;
    console.log("Created Play Store app:", playStoreApp.id);
  } else {
    console.log("Play Store app found:", playStoreApp.id);
  }

  // ── Products ──────────────────────────────────────────────────────────────

  const { data: existingProducts, error: listProductsError } = await listProducts({
    client,
    path: { project_id: project.id },
    query: { limit: 100 },
  });
  if (listProductsError) throw new Error("Failed to list products");

  async function ensureProduct(targetApp: App, label: string, identifier: string, displayName: string, isTestStore: boolean): Promise<Product> {
    const existing = existingProducts.items?.find(
      (p) => p.store_identifier === identifier && p.app_id === targetApp.id,
    );
    if (existing) {
      console.log(`${label} product already exists (${identifier}):`, existing.id);
      return existing;
    }

    const body: CreateProductData["body"] = {
      store_identifier: identifier,
      app_id: targetApp.id,
      type: "consumable",
      display_name: displayName,
    };
    if (isTestStore) {
      body.title = displayName;
    }

    const { data: created, error } = await createProduct({
      client,
      path: { project_id: project.id },
      body,
    });
    if (error) throw new Error(`Failed to create ${label} product: ${identifier} — ${JSON.stringify(error)}`);
    console.log(`Created ${label} product (${identifier}):`, created.id);
    return created;
  }

  const bundleProducts: { bundle: BundleDef; testProduct: Product; appStoreProduct: Product; playStoreProduct: Product }[] = [];

  for (const bundle of CHIP_BUNDLES) {
    const testProduct      = await ensureProduct(testStoreApp, "Test Store", bundle.identifier, bundle.displayName, true);
    const appStoreProduct  = await ensureProduct(appStoreApp,  "App Store",  bundle.identifier, bundle.displayName, false);
    const playStoreProduct = await ensureProduct(playStoreApp, "Play Store", bundle.identifier, bundle.displayName, false);
    bundleProducts.push({ bundle, testProduct, appStoreProduct, playStoreProduct });

    // Add test store price
    const { error: priceError } = await client.post<TestStorePricesResponse>({
      url: "/projects/{project_id}/products/{product_id}/test_store_prices",
      path: { project_id: project.id, product_id: testProduct.id },
      body: { prices: [{ amount_micros: bundle.priceUsdCents * 10_000, currency: "USD" }] },
    });
    if (priceError) {
      if (typeof priceError === "object" && "type" in priceError && priceError["type"] === "resource_already_exists") {
        console.log(`Test store price already exists for ${bundle.identifier}`);
      } else {
        throw new Error(`Failed to add test store price for ${bundle.identifier}: ${JSON.stringify(priceError)}`);
      }
    } else {
      console.log(`Added test store price for ${bundle.identifier}: $${(bundle.priceUsdCents / 100).toFixed(2)}`);
    }
  }

  // ── Offering ──────────────────────────────────────────────────────────────

  const { data: existingOfferings, error: listOfferingsError } = await listOfferings({
    client,
    path: { project_id: project.id },
    query: { limit: 20 },
  });
  if (listOfferingsError) throw new Error("Failed to list offerings");

  let offering: Offering | undefined = existingOfferings.items?.find((o) => o.lookup_key === OFFERING_IDENTIFIER);
  if (!offering) {
    const { data: newOffering, error } = await createOffering({
      client,
      path: { project_id: project.id },
      body: { lookup_key: OFFERING_IDENTIFIER, display_name: OFFERING_DISPLAY_NAME },
    });
    if (error) throw new Error("Failed to create offering");
    console.log("Created offering:", newOffering.id);
    offering = newOffering;
  } else {
    console.log("Offering already exists:", offering.id);
  }

  if (!offering.is_current) {
    const { error } = await updateOffering({
      client,
      path: { project_id: project.id, offering_id: offering.id },
      body: { is_current: true },
    });
    if (error) throw new Error("Failed to set offering as current");
    console.log("Set offering as current");
  }

  // ── Packages ──────────────────────────────────────────────────────────────

  const { data: existingPackages, error: listPackagesError } = await listPackages({
    client,
    path: { project_id: project.id, offering_id: offering.id },
    query: { limit: 20 },
  });
  if (listPackagesError) throw new Error("Failed to list packages");

  for (const { bundle, testProduct, appStoreProduct, playStoreProduct } of bundleProducts) {
    const pkgIdentifier = bundle.identifier;
    let pkg: Package | undefined = existingPackages.items?.find((p) => p.lookup_key === pkgIdentifier);

    if (!pkg) {
      const { data: newPkg, error } = await createPackages({
        client,
        path: { project_id: project.id, offering_id: offering.id },
        body: { lookup_key: pkgIdentifier, display_name: bundle.displayName },
      });
      if (error) throw new Error(`Failed to create package: ${pkgIdentifier}`);
      console.log(`Created package (${pkgIdentifier}):`, newPkg.id);
      pkg = newPkg;
    } else {
      console.log(`Package already exists (${pkgIdentifier}):`, pkg.id);
    }

    const { error: attachError } = await attachProductsToPackage({
      client,
      path: { project_id: project.id, package_id: pkg.id },
      body: {
        products: [
          { product_id: testProduct.id,      eligibility_criteria: "all" },
          { product_id: appStoreProduct.id,  eligibility_criteria: "all" },
          { product_id: playStoreProduct.id, eligibility_criteria: "all" },
        ],
      },
    });
    if (attachError) {
      if (attachError.type === "unprocessable_entity_error") {
        console.log(`Products already attached to package ${pkgIdentifier}`);
      } else {
        throw new Error(`Failed to attach products to package ${pkgIdentifier}: ${JSON.stringify(attachError)}`);
      }
    } else {
      console.log(`Attached products to package ${pkgIdentifier}`);
    }
  }

  // ── API Keys ──────────────────────────────────────────────────────────────

  const { data: testKeys,  error: testKeysError  } = await listAppPublicApiKeys({ client, path: { project_id: project.id, app_id: testStoreApp.id } });
  const { data: iosKeys,   error: iosKeysError   } = await listAppPublicApiKeys({ client, path: { project_id: project.id, app_id: appStoreApp.id } });
  const { data: droidKeys, error: droidKeysError } = await listAppPublicApiKeys({ client, path: { project_id: project.id, app_id: playStoreApp.id } });

  if (testKeysError || iosKeysError || droidKeysError) throw new Error("Failed to fetch API keys");

  console.log("\n====================");
  console.log("RevenueCat setup complete — Chip Society");
  console.log("Project ID:", project.id);
  console.log("Test Store App ID:", testStoreApp.id);
  console.log("App Store App ID:", appStoreApp.id);
  console.log("Play Store App ID:", playStoreApp.id);
  console.log("Public API Keys - Test Store:", testKeys?.items.map((k) => k.key).join(", ") ?? "N/A");
  console.log("Public API Keys - App Store:",  iosKeys?.items.map((k) => k.key).join(", ")  ?? "N/A");
  console.log("Public API Keys - Play Store:", droidKeys?.items.map((k) => k.key).join(", ") ?? "N/A");
  console.log("====================");
  console.log("\nSet these environment variables:");
  console.log(`REVENUECAT_PROJECT_ID=${project.id}`);
  console.log(`REVENUECAT_TEST_STORE_APP_ID=${testStoreApp.id}`);
  console.log(`REVENUECAT_APPLE_APP_STORE_APP_ID=${appStoreApp.id}`);
  console.log(`REVENUECAT_GOOGLE_PLAY_STORE_APP_ID=${playStoreApp.id}`);
  console.log(`EXPO_PUBLIC_REVENUECAT_TEST_API_KEY=${testKeys?.items[0]?.key ?? ""}`);
  console.log(`EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=${iosKeys?.items[0]?.key ?? ""}`);
  console.log(`EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=${droidKeys?.items[0]?.key ?? ""}`);
  console.log("====================\n");
}

seedRevenueCat().catch(console.error);
