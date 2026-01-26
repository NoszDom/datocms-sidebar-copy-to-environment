import { buildClient, SimpleSchemaTypes } from "@datocms/cma-client-browser";
import { Environment } from "@datocms/cma-client/dist/types/generated/ApiTypes";
import { RenderItemFormSidebarPanelCtx } from "datocms-plugin-sdk";
import { Canvas, Button, SelectField } from "datocms-react-ui";
import { Dispatch, SetStateAction, useState } from "react";

type Props = {
  ctx: RenderItemFormSidebarPanelCtx;
  environments: Environment[];
};

enum ActionType {
  UPDATE = "update",
  CREATE = "create",
}

const FIELDS_TO_EXCLUDE = [
  "id",
  "type",
  "updated_at",
  "created_at",
  "position",
  "item_type",
  "creator",
  "meta",
];

function buildApiClient(
  ctx: RenderItemFormSidebarPanelCtx,
  environment?: string,
) {
  if (typeof ctx.currentUserAccessToken === "string") {
    return buildClient({
      apiToken: ctx.currentUserAccessToken,
      environment: environment ? environment : ctx.environment,
    });
  }
}

export function CustomPanel({ ctx, environments }: Props) {
  const mappedEnvs = environments
    .filter((env) => env.id !== ctx.environment)
    .sort((a, b) => (a.meta.primary ? -1 : b.meta.primary ? 1 : 0))
    .map((env) => env.id);
  const [envs] = useState(mappedEnvs);
  const [selectedEnv, setSelectedEnv] = useState("");
  const [disable, setDisable] = useState(true);

  if (ctx.itemStatus === "new") {
    return (
      <Canvas ctx={ctx}>
        Please create the record before copying to another environment
      </Canvas>
    );
  }

  return (
    <Canvas ctx={ctx}>
      <div style={{ marginBottom: "var(--spacing-m)" }}>
        <SelectField
          id="selectedEnv"
          name="selectedEnv"
          label="Select Environment"
          required={true}
          value={
            selectedEnv ? { value: selectedEnv, label: selectedEnv } : null
          }
          onChange={(option) => {
            setSelectedEnv((option as any)?.value || "");
            setDisable(false);
          }}
          selectInputProps={{
            options: envs.map((env) => ({ value: env, label: env })),
          }}
        />
      </div>
      <Button
        key="btnCopyRecordEnv"
        disabled={disable}
        onClick={() => copy(ctx, selectedEnv, setDisable)}
        fullWidth
      >
        Copy
      </Button>
    </Canvas>
  );
}

async function copy(
  ctx: RenderItemFormSidebarPanelCtx,
  selectedEnv: string,
  setDisable: Dispatch<SetStateAction<boolean>>,
) {
  if (!ctx.item?.id) {
    return;
  }

  const currentClient = buildApiClient(ctx);
  const targetClient = buildApiClient(ctx, selectedEnv);

  if (!currentClient || !targetClient) {
    console.error("Token is invalid");
    ctx.customToast({
      type: "warning",
      message: "Could not copy the record",
    });
    return;
  }

  setDisable(true);

  try {
    const itemId = ctx.item.id;
    const itemType = ctx.itemType.attributes.api_key;

    const item = await currentClient.items.find(itemId, { nested: true });

    FIELDS_TO_EXCLUDE.forEach((field) => delete (item as any)[field]);

    const resultActionType = await copyItemToTargetEnv(
      targetClient,
      itemId,
      itemType,
      item,
    );

    if (resultActionType === ActionType.CREATE) {
      ctx.notice(
        `Record did not exist in ${selectedEnv} and was <strong>created successfully</strong>.`,
      );
    } else {
      ctx.notice(
        `Record exists in ${selectedEnv} and was <strong>updated successfully</strong>.`,
      );
    }
  } catch (e) {
    console.error(e);
    ctx.alert("Could not copy the record!");
  } finally {
    setDisable(false);
  }
}

async function copyItemToTargetEnv(
  client: ReturnType<typeof buildClient>,
  itemId: string,
  itemType: string,
  fields: Record<string, any>,
): Promise<ActionType> {
  const item_type = await client.itemTypes.find(itemType);

  try {
    await client.items.update(itemId, { ...fields });
    return ActionType.UPDATE;
  } catch (error) {
    const createBody: SimpleSchemaTypes.ItemCreateSchema = {
      id: itemId,
      item_type: {
        type: "item_type",
        id: item_type.id,
      },
      ...fields,
    };

    await client.items.create(createBody);
    return ActionType.CREATE;
  }
}
