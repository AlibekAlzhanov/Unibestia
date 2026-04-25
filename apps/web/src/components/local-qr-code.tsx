"use client";

import { type JSX } from "react";
import { QRCodeSVG } from "qrcode.react";

type LocalQrCodeProps = {
  value: string;
};

export function LocalQrCode({ value }: LocalQrCodeProps): JSX.Element {
  return (
    <div className="mx-auto mt-4 flex h-[232px] w-[232px] items-center justify-center rounded-2xl bg-white p-3">
      <QRCodeSVG
        value={value}
        size={208}
        level="M"
        marginSize={2}
        title="UniBestia QR"
      />
    </div>
  );
}
