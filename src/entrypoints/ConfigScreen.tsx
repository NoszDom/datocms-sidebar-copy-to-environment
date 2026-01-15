import { buildClient } from "@datocms/cma-client";
import { RenderConfigScreenCtx } from "datocms-plugin-sdk";
import { Button, Canvas, Form, TextField, TextInput } from "datocms-react-ui";
import { useState } from "react";

type Props = {
  ctx: RenderConfigScreenCtx;
};

type Parameters = {
  modelApiKey: string;
  environments: string;
};

function buildApiClient(ctx: RenderConfigScreenCtx) {
  if (typeof ctx.currentUserAccessToken === "string") {
    return buildClient({
      apiToken: ctx.currentUserAccessToken,
    });
  }
}

export default function ConfigScreen({ ctx }: Props) {
  const parameters = ctx.plugin.attributes.parameters as Parameters;

  const [modelApiKey, setModelApiKey] = useState(parameters.modelApiKey);
  const [environments, setEnvironments] = useState(parameters.environments);

  const load = () => {
    allEnvironments(ctx).then((envs) => {
      if (envs) {
        setEnvironments(envs);
      }
    });
  };

  const setting = () => {
    ctx.updatePluginParameters({
      modelApiKey: modelApiKey.toLowerCase(),
      environments: environments,
    });
    ctx.notice("Settings updated successfully!");
  };

  return (
    <Canvas ctx={ctx}>
      <Form>
        <Button buttonType="primary" onClick={load}>
          Load
        </Button>

        <TextInput
          id="environments"
          name="environments"
          disabled={true}
          value={environments || undefined}
          onChange={undefined}
        />

        <TextField
          id="modelApiKey"
          name="modelApiKey"
          label="Model Api Key"
          hint="Add the model"
          value={modelApiKey || undefined}
          onChange={(newValue) => setModelApiKey(newValue.toLowerCase())}
        />

        <Button buttonType="primary" onClick={setting}>
          Configure
        </Button>
      </Form>
    </Canvas>
  );
}
async function allEnvironments(ctx: RenderConfigScreenCtx) {
  const client = buildApiClient(ctx);
  if (!client) {
    return null;
  }

  return await client.environments.list().then((items) => {
    return items.map((item) => item.id).join();
  });
}
