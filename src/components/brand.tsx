import { BRAND_NAME } from "@/config/brand";

export function Brand() {
  return <div className="brand-mark" aria-label={BRAND_NAME}><span aria-hidden="true">P</span>{BRAND_NAME}</div>;
}