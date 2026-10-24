"use client";

import { useState } from "react";
import { AtSign, LockKeyhole, Mail, Search, User } from "lucide-react";
import { Button } from "@/registry/components/button/button";
import { Input, type InputSize, type InputVariant } from "@/registry/components/input/input";
import styles from "../preview-styles/input.module.css";
import { PreviewSizeTabs } from "./size-tabs";

export function InputExample({ variant }: { variant: InputVariant }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("wrong-address");
  const [dense, setDense] = useState(false);

  return (
    <PreviewSizeTabs>
      {(size) => <InputFields
        dense={dense}
        email={email}
        onDenseChange={() => setDense((current) => !current)}
        onEmailChange={setEmail}
        onUsernameChange={setUsername}
        size={size}
        username={username}
        variant={variant}
      />}
    </PreviewSizeTabs>
  );
}

function InputFields({
  dense,
  email,
  onDenseChange,
  onEmailChange,
  onUsernameChange,
  size,
  username,
  variant,
}: {
  dense: boolean;
  email: string;
  onDenseChange: () => void;
  onEmailChange: (value: string) => void;
  onUsernameChange: (value: string) => void;
  size: InputSize;
  username: string;
  variant: InputVariant;
}) {
  return (
    <div className={styles.previewStack}>
      <Input
        label="Username"
        placeholder="Search a username"
        hint="Use the name people will recognize."
        prefixIcon={<Search />}
        suffixIcon={<AtSign />}
        variant={variant}
        dense={dense}
        size={size}
        value={username}
        onValueChange={onUsernameChange}
      />
      <Input
        type="email"
        label="Email address"
        prefixIcon={<Mail />}
        variant={variant}
        dense={dense}
        size={size}
        value={email}
        onValueChange={onEmailChange}
        error="Enter a valid email address."
      />
      <Input
        label="Workspace owner"
        defaultValue="irsyad"
        prefixIcon={<User />}
        suffixIcon={<LockKeyhole />}
        variant={variant}
        dense={dense}
        size={size}
        disabled
      />
      <div className={styles.previewControls}>
        <span>Dense input</span>
        <Button
          variant="bordered"
          tone="secondary"
          size="small"
          aria-pressed={dense}
          onClick={onDenseChange}
        >
          {dense ? "On" : "Off"}
        </Button>
      </div>
    </div>
  );
}
