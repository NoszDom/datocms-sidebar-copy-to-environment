import {
  connect,
  ItemFormSidebarPanelsCtx,
  ItemType,
  RenderConfigScreenCtx,
  RenderItemFormSidebarPanelCtx,
} from "datocms-plugin-sdk";
import "datocms-react-ui/styles.css";
import React from "react";
import { CustomPanel } from "./entrypoints/CustomSidebarPanel";
import { buildClient } from "@datocms/cma-client-browser";
import { render } from "./utils/render";
import { ConfigScreen } from "./entrypoints/ConfigScreen";

const CUSTOM_SIDEBAR_ID = "sidebarRecordCopyEnv";

connect({
  itemFormSidebarPanels(_itemType: ItemType, ctx: ItemFormSidebarPanelsCtx) {
    const whitelistedRoles = ctx.plugin.attributes.parameters
      .whitelistedRoles as string[] | undefined;

    if (whitelistedRoles?.includes(ctx.currentRole.id)) {
      return [
        {
          id: CUSTOM_SIDEBAR_ID,
          label: "Copy record",
          placement: ["after", "schedule"],
          startOpen: true,
        },
      ];
    } else {
      return [];
    }
  },
  async renderItemFormSidebarPanel(_, ctx: RenderItemFormSidebarPanelCtx) {
    const client = buildClient({
      apiToken: ctx.currentUserAccessToken!,
    });
    const environments = await client.environments.list();
    render(
      <React.StrictMode>
        <CustomPanel ctx={ctx} environments={environments} />
      </React.StrictMode>,
    );
  },
  renderConfigScreen(ctx: RenderConfigScreenCtx) {
    return render(<ConfigScreen ctx={ctx}></ConfigScreen>);
  },
});
