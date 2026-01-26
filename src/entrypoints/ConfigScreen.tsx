import { buildClient } from "@datocms/cma-client-browser";
import { RenderConfigScreenCtx } from "datocms-plugin-sdk";
import { Canvas, Button, SwitchField, Form, Spinner } from "datocms-react-ui";
import { Suspense, use, useState } from "react";

type Props = {
  ctx: RenderConfigScreenCtx;
};

export function ConfigScreen({ ctx }: Props) {
  const rolesPromise = fetchRoles(ctx);

  return (
    <Suspense
      fallback={
        <Canvas ctx={ctx}>
          <Spinner></Spinner>
          Loading...
        </Canvas>
      }
    >
      <ConfigScreenContent ctx={ctx} rolesPromise={rolesPromise} />
    </Suspense>
  );
}

async function fetchRoles(ctx: RenderConfigScreenCtx) {
  const client = buildClient({
    apiToken: ctx.currentUserAccessToken!,
  });
  const list = await client.roles.list();
  return list.sort((a, b) => a.name.localeCompare(b.name));
}

function ConfigScreenContent({
  ctx,
  rolesPromise,
}: Props & { rolesPromise: Promise<any[]> }) {
  const roles = use(rolesPromise);
  const parameters = ctx.plugin.attributes.parameters;

  const [whitelistedRoles, setWhitelistedRoles] = useState(
    (parameters.whitelistedRoles as string[]) || [],
  );
  const [disabled, setDisabled] = useState(true);

  return (
    <Canvas ctx={ctx}>
      <Form
        spacing="condensed"
        onSubmit={() => {
          saveWhitelistedRoles(ctx, whitelistedRoles);
          setDisabled(true);
        }}
      >
        <strong>Roles that can copy between environments</strong>
        {roles.map((role) => (
          <SwitchField
            id={role.id}
            name={role.name}
            key={role.id}
            label={role.name}
            value={whitelistedRoles.includes(role.id)}
            onChange={(value) => {
              if (value) {
                setWhitelistedRoles((prev) => [...prev, role.id]);
              } else {
                setWhitelistedRoles((prev) =>
                  prev.filter((id) => id !== role.id),
                );
              }
              setDisabled(false);
            }}
          ></SwitchField>
        ))}
        <Button
          onClick={() => {
            saveWhitelistedRoles(ctx, whitelistedRoles);
            setDisabled(true);
          }}
          disabled={disabled}
        >
          Save settings
        </Button>
      </Form>
    </Canvas>
  );
}

function saveWhitelistedRoles(
  ctx: RenderConfigScreenCtx,
  whitelistedRoles: string[],
) {
  ctx.updatePluginParameters({ whitelistedRoles });
  ctx.notice("Settings saved!");
}
