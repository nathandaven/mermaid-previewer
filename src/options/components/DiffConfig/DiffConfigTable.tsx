import { GlobeRegular, DocumentTableSearchRegular, CodeRegular } from "@fluentui/react-icons";
import React from "react";
import type { DiffConfig } from "~types";
import ConfigTable, { type Column, type Row } from "../ConfigTable";
import DiffConfigForm from "./DiffConfigForm";

const columns: Column[] = [
  { key: "match", label: "Match Pattern" },
  { key: "diffSelector", label: "Diff Selector" },
  { key: "codeSelector", label: "Code Selector" },
  { key: "fence", label: "Fence" },
];

const getRow = (index: number, config: DiffConfig, isDefault: boolean): Row => ({
  key: index,
  cells: [
    { key: "match", value: config.match, icon: <GlobeRegular />, default: isDefault },
    { key: "diffSelector", value: config.diffSelector, icon: <DocumentTableSearchRegular />, default: isDefault },
    { key: "codeSelector", value: config.codeSelector, icon: <CodeRegular />, default: isDefault },
    { key: "fence", value: config.fence, icon: <CodeRegular />, default: isDefault },
  ],
});

const getConfig = (row: Row): DiffConfig => ({
  match: row.cells.find((c) => c.key === "match")!.value,
  diffSelector: row.cells.find((c) => c.key === "diffSelector")!.value,
  codeSelector: row.cells.find((c) => c.key === "codeSelector")!.value,
  fence: row.cells.find((c) => c.key === "fence")!.value,
});

interface Props {
  defaultConfigs: DiffConfig[];
  customConfigs: DiffConfig[];
  setCustomConfigs: React.Dispatch<React.SetStateAction<DiffConfig[]>>;
}

export default ({ defaultConfigs, customConfigs, setCustomConfigs }: Props): JSX.Element => {
  const rows = React.useMemo(
    () => defaultConfigs
      .map((c, i) => getRow(i, c, true))
      .concat(customConfigs.map((c, i) => getRow(i + defaultConfigs.length, c, false))),
    [defaultConfigs, customConfigs],
  );

  return (
    <ConfigTable
      columns={columns}
      rows={rows}
      editFormTitle="Edit Diff Selector"
      editForm={(row) => <DiffConfigForm defaultValue={getConfig(row)} />}
      onEdit={(row, setOpen, ev) => {
        const formData = new FormData(ev.target as HTMLFormElement);
        const index = row.key - defaultConfigs.length;
        setCustomConfigs((configs) => {
          const pre = configs.slice(0, index);
          const suf = configs.slice(index + 1);
          setOpen(false);
          return pre.concat({
            match: formData.get("match")!.toString(),
            diffSelector: formData.get("diffSelector")!.toString(),
            codeSelector: formData.get("codeSelector")!.toString(),
            fence: formData.get("fence")!.toString(),
          }, suf);
        });
      }}
      onDelete={(row, setOpen) => {
        const index = row.key - defaultConfigs.length;
        setCustomConfigs((configs) => configs.filter((_, i) => i !== index));
        setOpen(false);
      }}
    />
  );
};
