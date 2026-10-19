"use client";

import { useState } from "react";
import { Package } from "lucide-react";
import styles from "./addProduct.module.css";

export default function ProductThumb({ src, size = 26 }: { src: string | null; size?: number }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className={styles.thumb}>
      {src && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element -- catalog images come from many hosts
        <img src={src} alt="" onError={() => setFailed(true)} />
      ) : (
        <Package size={size} />
      )}
    </div>
  );
}
