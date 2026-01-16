import {
  connect,
  IntentCtx,
  ModelBlock,
  RenderItemFormSidebarPanelCtx,
} from "datocms-plugin-sdk";
import "datocms-react-ui/styles.css";
import React from "react";
import { createRoot } from "react-dom/client";
import { CustomPanel } from "./entrypoints/CustomSidebarPanel";

const CUSTOM_SIDEBAR_ID = "sidebarRecordCopyEnv";

connect({
  itemFormSidebarPanels(model: ModelBlock, ctx: IntentCtx) {
    return [
      {
        id: CUSTOM_SIDEBAR_ID,
        label: "Copy record",
        startOpen: true,
      },
    ];
  },
  renderItemFormSidebarPanel(_, ctx: RenderItemFormSidebarPanelCtx) {
    const root = document.getElementById("root");
    if (root) {
      createRoot(root).render(
        <React.StrictMode>
          <CustomPanel ctx={ctx} />
        </React.StrictMode>
      );
    }
  },
});
