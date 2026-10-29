"use client";
import { useState } from "react";
import { Switch } from "@/registry/components/switch/switch";
import {
  UploadManager,
  type UploadRequest,
} from "@/registry/components/upload-manager/upload-manager";

function simulateUpload({ signal, onProgress }: UploadRequest, fail = false) {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException("Canceled", "AbortError"));
      return;
    }
    let progress = 0;
    const interval = window.setInterval(() => {
      progress = Math.min(progress + 4, 100);
      onProgress(progress);
      if (progress === 100) {
        window.clearInterval(interval);
        signal.removeEventListener("abort", abort);
        if (fail) reject(new Error("The server could not process this file."));
        else resolve();
      }
    }, 120);
    function abort() {
      window.clearInterval(interval);
      reject(new DOMException("Canceled", "AbortError"));
    }
    signal.addEventListener("abort", abort, { once: true });
  });
}

export function UploadManagerExample({ mode = "inline", triggerVariant = "button" }: { mode?: "inline" | "overlay"; triggerVariant?: "button" | "panel" }) {
  const [fail, setFail] = useState(false);
  const [local, setLocal] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  return (
    <div className="mx-auto w-full max-w-md p-6">
      <div className="mb-4 flex flex-wrap gap-4"><Switch label="Keep files locally" checked={local} onCheckedChange={(next) => { setLocal(next); setPendingFiles([]); }} />{!local && <Switch label="Simulate upload failure" checked={fail} onCheckedChange={setFail} />}</div>
      {local ? <UploadManager key="local" mode={mode} triggerVariant={triggerVariant} uploadMode="local" onFilesChange={setPendingFiles} /> : <UploadManager key="direct" mode={mode} triggerVariant={triggerVariant} onUpload={(request) => simulateUpload(request, fail)} />}
      <p className="mt-4 text-xs text-[var(--text-secondary)]">
        {local ? `${pendingFiles.length} file(s) ready to submit. Files remain in browser memory.` : fail ? "Uploads are simulated and will fail to demonstrate the error state." : "Preview only: uploads are simulated and files are not sent."}
      </p>
    </div>
  );
}
