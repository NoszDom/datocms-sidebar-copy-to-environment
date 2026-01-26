import {
  connect,
  ItemFormSidebarPanelsCtx,
  ItemType,
  RenderItemFormSidebarPanelCtx,
} from "datocms-plugin-sdk";
import "datocms-react-ui/styles.css";
import React from "react";
import { createRoot } from "react-dom/client";
import { CustomPanel } from "./entrypoints/CustomSidebarPanel";
import { buildClient } from "@datocms/cma-client-browser";

const CUSTOM_SIDEBAR_ID = "sidebarRecordCopyEnv";

connect({
  itemFormSidebarPanels(_itemType: ItemType, _ctx: ItemFormSidebarPanelsCtx) {
    return [
      {
        id: CUSTOM_SIDEBAR_ID,
        label: "Copy record",
        placement: ["after", "schedule"],
        startOpen: true,
      },
    ];
  },
  async renderItemFormSidebarPanel(_, ctx: RenderItemFormSidebarPanelCtx) {
    const client = buildClient({
      apiToken: ctx.currentUserAccessToken!,
    });
    const environments = await client.environments.list();
    const root = document.getElementById("root");
    if (root) {
      createRoot(root).render(
        <React.StrictMode>
          <CustomPanel ctx={ctx} environments={environments} />
        </React.StrictMode>,
      );
    }
  },
});
