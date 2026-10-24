"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { CatalogNav } from "./catalog-nav";
import styles from "./catalog.module.css";

export function CatalogMobileNav() {
  const pathname = usePathname();
  return <MobileNav key={pathname} />;
}

function MobileNav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <div className={styles.mobileNav} data-open={open || undefined}>
      <button
        className={styles.mobileNavTrigger}
        type="button"
        aria-label={open ? "Close navigation" : "Open navigation"}
        aria-expanded={open}
        aria-controls="mobile-catalog-navigation"
        onClick={() => setOpen((current) => !current)}
      >
        {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
      </button>
      <button
        className={styles.mobileNavBackdrop}
        type="button"
        tabIndex={open ? 0 : -1}
        aria-label="Close navigation"
        onClick={() => setOpen(false)}
      />
      <aside
        className={styles.mobileNavPanel}
        id="mobile-catalog-navigation"
        aria-label="Documentation navigation"
        aria-hidden={!open}
        {...(!open ? { inert: true } : {})}
        onClickCapture={(event) => {
          if ((event.target as HTMLElement).closest("a")) setOpen(false);
        }}
      >
        <CatalogNav />
      </aside>
    </div>
  );
}
