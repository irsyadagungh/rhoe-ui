"use client";

import { useState } from "react";
import { Button } from "@/registry/components/button/button";
import { Table, type TableColumn, type TableHeaderVariant } from "@/registry/components/table/table";
import { Tabs } from "@/registry/components/tabs/tabs";
import { PreviewCanvas } from "../preview-canvas";

interface Member {
  id: string;
  name: string;
  role: string;
  status: "Active" | "Invited";
  projects: number;
}

const members: Member[] = [
  { id: "ava", name: "Ava Morgan", role: "Product designer", status: "Active", projects: 12 },
  { id: "noah", name: "Noah Williams", role: "Frontend engineer", status: "Active", projects: 18 },
  { id: "mia", name: "Mia Chen", role: "Researcher", status: "Invited", projects: 7 },
  { id: "leo", name: "Leo Martin", role: "Design engineer", status: "Active", projects: 15 },
  { id: "zoe", name: "Zoe Wilson", role: "Product manager", status: "Invited", projects: 9 },
  { id: "ethan", name: "Ethan Brown", role: "Backend engineer", status: "Active", projects: 21 },
  { id: "lily", name: "Lily Anderson", role: "Content designer", status: "Active", projects: 11 },
  { id: "lucas", name: "Lucas Garcia", role: "Data analyst", status: "Invited", projects: 6 },
  { id: "maya", name: "Maya Thompson", role: "UX engineer", status: "Active", projects: 14 },
  { id: "oliver", name: "Oliver Davis", role: "Product designer", status: "Active", projects: 17 },
  { id: "sophia", name: "Sophia Miller", role: "Frontend engineer", status: "Invited", projects: 8 },
  { id: "liam", name: "Liam Martinez", role: "Design systems", status: "Active", projects: 23 },
  { id: "emma", name: "Emma Taylor", role: "Researcher", status: "Active", projects: 10 },
  { id: "henry", name: "Henry Moore", role: "Product manager", status: "Active", projects: 16 },
  { id: "isla", name: "Isla Jackson", role: "Visual designer", status: "Invited", projects: 5 },
];

const columns: TableColumn<Member>[] = [
  {
    key: "name",
    header: "Member",
    cell: (member) => <span className="font-[650]">{member.name}</span>,
    sortValue: (member) => member.name,
    width: "34%",
  },
  {
    key: "role",
    header: "Role",
    cell: (member) => <span className="text-[var(--text-secondary)]">{member.role}</span>,
    sortValue: (member) => member.role,
  },
  {
    key: "status",
    header: "Status",
    cell: (member) => (
      <span className="inline-flex items-center gap-2">
        <span className={`size-1.5 rounded-full ${member.status === "Active" ? "bg-[var(--success)]" : "bg-[var(--warning)]"}`} />
        {member.status}
      </span>
    ),
    sortValue: (member) => member.status,
  },
  {
    key: "projects",
    header: "Projects",
    cell: (member) => <span className="tabular-nums">{member.projects}</span>,
    sortValue: (member) => member.projects,
    align: "end",
  },
];

export function TableExample({
  headerVariant = "docked",
  selectable = false,
  showRowNumbers = true,
}: {
  headerVariant?: "docked" | "floating";
  selectable?: boolean;
  showRowNumbers?: boolean;
}) {
  const [editMode, setEditMode] = useState(false);
  return (
    <div className="mx-auto w-full max-w-5xl p-4 sm:p-8">
      {selectable && !showRowNumbers ? (
        <div className="mb-4 flex justify-end">
          <Button
            size="small"
            variant="bordered"
            label={["Edit", "Done"]}
            state={editMode ? 1 : 0}
            aria-pressed={editMode}
            onClick={() => setEditMode((current) => !current)}
          />
        </div>
      ) : null}
      <Table
        data={members}
        columns={columns}
        getRowId={(member) => member.id}
        headerVariant={headerVariant}
        selectable={selectable}
        editMode={editMode}
        showRowNumbers={showRowNumbers}
        defaultSort={{ key: "name", direction: "ascending" }}
        ariaLabel="Team members"
        className="max-h-[420px]"
      />
    </div>
  );
}

export type TableSelectionMode = "number" | "number-selection" | "checkbox" | "none";

export function TableSandbox() {
  const [headerVariant, setHeaderVariant] = useState<TableHeaderVariant>("docked");
  const [selectionMode, setSelectionMode] = useState<TableSelectionMode>("number");
  const [editMode, setEditMode] = useState(true);

  const selectable = selectionMode === "checkbox" || selectionMode === "number-selection";
  const showRowNumbers = selectionMode === "number" || selectionMode === "number-selection";

  return (
    <PreviewCanvas
      showReplay={false}
      toolbar={(
        <div className="flex w-full flex-wrap items-start gap-x-5 gap-y-2">
          <Tabs
            variant="flat"
            ariaLabel="Header variant"
            value={headerVariant}
            onValueChange={(value) => setHeaderVariant(value as TableHeaderVariant)}
            items={[
              { value: "docked", label: "Docked header", content: <span /> },
              { value: "floating", label: "Floating header", content: <span /> },
            ]}
          />
          <Tabs
            variant="flat"
            ariaLabel="Row indicator and selection"
            value={selectionMode}
            onValueChange={(value) => {
              const nextMode = value as TableSelectionMode;
              setSelectionMode(nextMode);
              if (nextMode === "checkbox") setEditMode(true);
            }}
            items={[
              { value: "number", label: "Row number", content: <span /> },
              { value: "number-selection", label: "Hover checkbox", content: <span /> },
              { value: "checkbox", label: "Dedicated checkbox", content: <span /> },
              { value: "none", label: "None", content: <span /> },
            ]}
          />
        </div>
      )}
    >
      <div className="mx-auto w-full max-w-5xl p-4 sm:p-8">
        {selectionMode === "checkbox" ? (
          <div className="mb-4 flex items-center justify-between">
            <span className="text-xs font-medium text-[var(--text-secondary)]">
              {editMode ? "Checkbox column visible" : "Checkbox column collapsed"}
            </span>
            <Button
              size="small"
              variant="bordered"
              label={["Edit", "Done"]}
              state={editMode ? 1 : 0}
              aria-pressed={editMode}
              onClick={() => setEditMode((current) => !current)}
            />
          </div>
        ) : null}
        <Table
          data={members}
          columns={columns}
          getRowId={(member) => member.id}
          headerVariant={headerVariant}
          selectable={selectable}
          editMode={selectionMode === "checkbox" ? editMode : false}
          showRowNumbers={showRowNumbers}
          defaultSort={{ key: "name", direction: "ascending" }}
          ariaLabel="Team members"
          className="max-h-[420px]"
        />
      </div>
    </PreviewCanvas>
  );
}
