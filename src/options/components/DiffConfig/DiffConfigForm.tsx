import { Button, InfoLabel, Input } from "@fluentui/react-components";
import { GlobeRegular, DocumentTableSearchRegular, CodeRegular } from "@fluentui/react-icons";
import React from "react";

import type { DiffConfig } from "~types";
import Close from "../../icons/Close";

interface Props {
  defaultValue?: DiffConfig;
}

export default ({
  defaultValue = {
    match: "*://bitbucket.org/*/pull-requests/*",
    diffSelector: ".bitkit-diff-wrapper-diff",
    codeSelector: ".code-diff",
    fence: "```mermaid",
  },
}: Props): JSX.Element => {
  const matchRef = React.createRef<HTMLInputElement>();
  const diffSelectorRef = React.createRef<HTMLInputElement>();
  const codeSelectorRef = React.createRef<HTMLInputElement>();
  const fenceRef = React.createRef<HTMLInputElement>();

  const clearButton = (ref: React.RefObject<HTMLInputElement>) => (
    <Button icon={<Close />} appearance="transparent" onClick={() => { ref.current!.value = ""; ref.current?.focus(); }} />
  );

  return (
    <>
      <InfoLabel required htmlFor="diff-match-input">Match Pattern</InfoLabel>
      <Input ref={matchRef} required type="text" id="diff-match-input" name="match"
        placeholder={defaultValue.match} defaultValue={defaultValue.match}
        contentBefore={<GlobeRegular />} contentAfter={clearButton(matchRef)} />

      <InfoLabel required htmlFor="diff-selector-input">Diff Wrapper Selector</InfoLabel>
      <Input ref={diffSelectorRef} required type="text" id="diff-selector-input" name="diffSelector"
        placeholder={defaultValue.diffSelector} defaultValue={defaultValue.diffSelector}
        contentBefore={<DocumentTableSearchRegular />} contentAfter={clearButton(diffSelectorRef)} />

      <InfoLabel required htmlFor="diff-code-selector-input">Code Line Selector</InfoLabel>
      <Input ref={codeSelectorRef} required type="text" id="diff-code-selector-input" name="codeSelector"
        placeholder={defaultValue.codeSelector} defaultValue={defaultValue.codeSelector}
        contentBefore={<CodeRegular />} contentAfter={clearButton(codeSelectorRef)} />

      <InfoLabel required htmlFor="diff-fence-input">Fence Marker</InfoLabel>
      <Input ref={fenceRef} required type="text" id="diff-fence-input" name="fence"
        placeholder={defaultValue.fence} defaultValue={defaultValue.fence}
        contentBefore={<CodeRegular />} contentAfter={clearButton(fenceRef)} />
    </>
  );
};
