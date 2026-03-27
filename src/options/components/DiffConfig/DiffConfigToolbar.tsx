import React from "react";
import type { DiffConfig } from "~types";
import ConfigToolbar from "../ConfigToolbar";
import DiffConfigForm from "./DiffConfigForm";

interface Props {
  title: string;
  setCustomConfigs: React.Dispatch<React.SetStateAction<DiffConfig[]>>;
}

export default ({ title, setCustomConfigs }: Props): JSX.Element => {
  return (
    <ConfigToolbar
      addTitle={title}
      addForm={<DiffConfigForm />}
      onAdd={(setOpen, ev) => {
        const formData = new FormData(ev.target as HTMLFormElement);
        setCustomConfigs((configs) => configs.concat({
          match: formData.get("match")!.toString(),
          diffSelector: formData.get("diffSelector")!.toString(),
          codeSelector: formData.get("codeSelector")!.toString(),
          fence: formData.get("fence")!.toString(),
        }));
        setOpen(false);
      }}
      onReset={(setOpen) => {
        setCustomConfigs([]);
        setOpen(false);
      }}
    />
  );
};
