import {
  connect,
  IntentCtx,
  ModelBlock,
  RenderItemFormSidebarPanelCtx,
} from "datocms-plugin-sdk";
import "datocms-react-ui/styles.css";
import React from "react";
import ReactDOM from "react-dom";
import ConfigScreen from "./entrypoints/ConfigScreen";
import { CustomPanel } from "./entrypoints/CustomSidebarPanel";
import { render } from "./utils/render";

const CUSTOM_SIDEBAR_ID = "sidebarRecordCopyEnv";

connect({
  itemFormSidebarPanels(model: ModelBlock, ctx: IntentCtx) {
    const { modelApiKey } = ctx.plugin.attributes.parameters;
    const keys = (modelApiKey as string)?.split(",");
    if (keys?.includes(model.attributes.api_key))
      return [
        {
          id: CUSTOM_SIDEBAR_ID,
          label: "Copy record",
          startOpen: true,
        },
      ];
    return [];
  },
  renderItemFormSidebarPanel(
    sidebarPanelId,
    ctx: RenderItemFormSidebarPanelCtx
  ) {
    ReactDOM.render(
      <React.StrictMode>
        <CustomPanel ctx={ctx} />
      </React.StrictMode>,
      document.getElementById("root")
    );
  },
  renderConfigScreen(ctx) {
    return render(<ConfigScreen ctx={ctx} />);
  },
});
