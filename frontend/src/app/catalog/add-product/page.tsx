"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft, ArrowRight, Check, ChevronRight, Loader2, PackagePlus, Search } from "lucide-react";
import BrandMark from "@/components/layout/BrandMark";
import CategoryPicker from "@/components/add-product/CategoryPicker";
import ExistingProductFinder from "@/components/add-product/ExistingProductFinder";
import NewProductForm from "@/components/add-product/NewProductForm";
import OfferForm from "@/components/add-product/OfferForm";
import { buildCategoryIndex, categoryPath } from "@/components/add-product/categoryTree";
import {
  ApiError,
  CatalogSearchResult,
  CategoryNode,
  CreateProductResponse,
  fetchCategoryTree,
} from "@/services/addProductService";
import styles from "@/components/add-product/addProduct.module.css";

type Stage = "choose" | "find" | "offer" | "category" | "details" | "done";

type DoneState =
  | { kind: "offer"; product: CatalogSearchResult; sku: string }
  | { kind: "product"; result: CreateProductResponse };

const EXISTING_STEPS: { label: string; stages: Stage[] }[] = [
  { label: "Listing type", stages: ["choose"] },
  { label: "Find product", stages: ["find"] },
  { label: "Your offer", stages: ["offer"] },
  { label: "Done", stages: ["done"] },
];

const NEW_STEPS: { label: string; stages: Stage[] }[] = [
  { label: "Listing type", stages: ["choose"] },
  { label: "Category", stages: ["category"] },
  { label: "Product details", stages: ["details"] },
  { label: "Done", stages: ["done"] },
];

export default function AddProductPage() {
  const [mode, setMode] = useState<"existing" | "new" | null>(null);
  const [stage, setStage] = useState<Stage>("choose");
  const [categories, setCategories] = useState<CategoryNode[] | null>(null);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [leaf, setLeaf] = useState<CategoryNode | null>(null);
  const [pendingLeaf, setPendingLeaf] = useState<CategoryNode | null>(null);
  const [pickedProduct, setPickedProduct] = useState<CatalogSearchResult | null>(null);
  const [done, setDone] = useState<DoneState | null>(null);

  useEffect(() => {
    fetchCategoryTree()
      .then(setCategories)
      .catch((err) => setCategoryError(err instanceof ApiError ? err.messages[0] : "Couldn't load categories."));
  }, []);

  const index = useMemo(() => (categories ? buildCategoryIndex(categories) : null), [categories]);
  const leafPath = useMemo(() => (index && leaf ? categoryPath(index, leaf.id) : []), [index, leaf]);
  const pendingPath = useMemo(
    () => (index && pendingLeaf ? categoryPath(index, pendingLeaf.id) : []),
    [index, pendingLeaf]
  );

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [stage]);

  function startOver() {
    setMode(null);
    setStage("choose");
    setLeaf(null);
    setPendingLeaf(null);
    setPickedProduct(null);
    setDone(null);
  }

  const steps = mode === "existing" ? EXISTING_STEPS : NEW_STEPS;
  const activeStep = steps.findIndex((s) => s.stages.includes(stage));

  const heading: Record<Stage, { title: string; sub: string }> = {
    choose: { title: "Add a product", sub: "Sell something already on Makaano, or list a product that's new to the catalog." },
    find: { title: "Find the product in our catalog", sub: "If it already exists, you only add your price and stock." },
    offer: { title: "Create your offer", sub: "Set your price, stock and delivery for this product." },
    category: { title: "Select a category", sub: "Pick the most specific category — it decides which details buyers see." },
    details: { title: "Product details", sub: "Fill in the details, variations, photos and tax information." },
    done: { title: "", sub: "" },
  };

  const needsCategories = stage === "category" || stage === "details" || stage === "find";

  return (
    <div className={styles.page}>
      <header className={styles.topbar}>
        <Link href="/dashboard" aria-label="Makaano Seller Central">
          <BrandMark tone="light" size={26} />
        </Link>
        <span className={styles.topbarDivider} />
        <span className={styles.topbarTitle}>Add a product</span>
        <Link href="/catalog" className={styles.topbarBack}>
          <ArrowLeft size={15} /> Back to catalog
        </Link>
      </header>

      <div className={styles.stepperBar}>
        <ol className={styles.stepper}>
          {steps.map((step, i) => (
            <li key={step.label} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {i > 0 && <span className={styles.stepLine} />}
              <span
                className={`${styles.step} ${i === activeStep ? styles.stepActive : ""} ${i < activeStep ? styles.stepDone : ""}`}
              >
                <span className={styles.stepDot}>{i < activeStep ? <Check size={13} strokeWidth={3} /> : i + 1}</span>
                {step.label}
              </span>
            </li>
          ))}
        </ol>
      </div>

      <main className={styles.container}>
        {stage !== "done" && (
          <div className={styles.pageHead}>
            <h1>{heading[stage].title}</h1>
            <p>{heading[stage].sub}</p>
          </div>
        )}

        {needsCategories && categoryError && (
          <div className={`${styles.alert} ${styles.alertError}`}>
            <AlertCircle size={16} /> {categoryError}
          </div>
        )}
        {needsCategories && !index && !categoryError && (
          <div className={styles.loading}>
            <Loader2 size={18} className={styles.spin} /> Loading categories…
          </div>
        )}

        {stage === "choose" && (
          <div className={styles.modeGrid}>
            <button
              type="button"
              className={styles.modeCard}
              onClick={() => {
                setMode("existing");
                setStage("find");
              }}
            >
              <span className={styles.modeIcon}>
                <Search size={22} />
              </span>
              <h3>Sell an existing product</h3>
              <p>The product is already listed on Makaano by its brand or another seller.</p>
              <ul>
                <li><Check size={14} /> Search by ASIN, name, category or brand</li>
                <li><Check size={14} /> Add only your price, stock and delivery</li>
                <li><Check size={14} /> Live in minutes</li>
              </ul>
              <span className={styles.modeCta}>
                Find product <ArrowRight size={16} />
              </span>
            </button>
            <button
              type="button"
              className={styles.modeCard}
              onClick={() => {
                setMode("new");
                setStage("category");
              }}
            >
              <span className={styles.modeIcon}>
                <PackagePlus size={22} />
              </span>
              <h3>Add a new product</h3>
              <p>The product isn&apos;t on Makaano yet. You create the catalog page buyers will see.</p>
              <ul>
                <li><Check size={14} /> Category, specifications and variations</li>
                <li><Check size={14} /> Photos, description, HSN and GST</li>
                <li><Check size={14} /> Gets its own ASIN after review</li>
              </ul>
              <span className={styles.modeCta}>
                Create product <ArrowRight size={16} />
              </span>
            </button>
          </div>
        )}

        {stage === "find" && index && (
          <ExistingProductFinder
            index={index}
            onPick={(product) => {
              setPickedProduct(product);
              setStage("offer");
            }}
            onCreateNew={() => {
              setMode("new");
              setStage("category");
            }}
          />
        )}

        {stage === "offer" && pickedProduct && (
          <OfferForm
            product={pickedProduct}
            onBack={() => setStage("find")}
            onCreated={(sku) => {
              setDone({ kind: "offer", product: pickedProduct, sku });
              setStage("done");
            }}
          />
        )}

        {stage === "category" && index && (
          <>
            <div className={styles.card}>
              <CategoryPicker
                index={index}
                initialLeafId={leaf?.id}
                onLeafChange={setPendingLeaf}
              />
            </div>
            <div className={styles.actionBar}>
              <div className={styles.actionBarInner}>
                <div className={styles.actionBarInfo}>
                  {pendingLeaf ? (
                    <span className={styles.breadcrumb}>
                      {pendingPath.map((node, i) => (
                        <span key={node.id} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                          {i === pendingPath.length - 1 ? <strong>{node.name}</strong> : node.name}
                          {i < pendingPath.length - 1 && <ChevronRight size={12} />}
                        </span>
                      ))}
                    </span>
                  ) : (
                    "Keep going until you reach a category marked “Select”."
                  )}
                </div>
                <div className={styles.actionBarButtons}>
                  <button type="button" className={styles.btnSecondary} onClick={startOver}>
                    Back
                  </button>
                  <button
                    type="button"
                    className={styles.btnPrimary}
                    disabled={!pendingLeaf}
                    onClick={() => {
                      setLeaf(pendingLeaf);
                      setStage("details");
                    }}
                  >
                    Continue <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Kept mounted while changing category so a same-category round trip keeps the seller's input. */}
        {leaf && mode === "new" && stage !== "done" && (
          <div hidden={stage !== "details"}>
            <NewProductForm
              key={leaf.id}
              leaf={leaf}
              path={leafPath}
              onChangeCategory={() => {
                setPendingLeaf(leaf);
                setStage("category");
              }}
              onCreated={(result) => {
                setDone({ kind: "product", result });
                setStage("done");
              }}
            />
          </div>
        )}

        {stage === "done" && done && (
          <div className={styles.success}>
            <span className={styles.successIcon}>
              <Check size={28} strokeWidth={2.5} />
            </span>
            {done.kind === "offer" ? (
              <>
                <h1>Your offer is live</h1>
                <p>
                  You&apos;re now selling <strong>{done.product.title}</strong> as SKU{" "}
                  <span className={styles.mono}>{done.sku}</span>.
                </p>
              </>
            ) : (
              <>
                <h1>Product submitted</h1>
                <p>
                  {done.result.variations.length > 0
                    ? `${done.result.variations.length} variants were created under one parent product.`
                    : "Your product has been added to the Makaano catalog."}{" "}
                  It will appear to buyers after a quick quality check.
                </p>
                <div className={styles.asinList}>
                  <div>
                    <span>{done.result.is_parent ? "Parent ASIN" : "ASIN"}</span>
                    <span className={styles.mono}>{done.result.asin}</span>
                  </div>
                  {done.result.variations.map((v) => (
                    <div key={v.asin}>
                      <span>{v.title}</span>
                      <span className={styles.mono}>{v.asin}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
            <div className={styles.successActions}>
              <button type="button" className={styles.btnPrimary} onClick={startOver}>
                Add another product
              </button>
              <Link href="/catalog" className={styles.btnSecondary}>
                Go to catalog
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
