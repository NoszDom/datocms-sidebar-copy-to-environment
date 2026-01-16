import {
  buildClient,
  LinkFieldValidators,
  SimpleSchemaTypes,
} from "@datocms/cma-client-browser";
import { RenderItemFormSidebarPanelCtx } from "datocms-plugin-sdk";
import { Canvas, Button } from "datocms-react-ui";
import { Dispatch, SetStateAction, useState } from "react";

type Props = {
  ctx: RenderItemFormSidebarPanelCtx;
};

interface LinkUpload {
  upload_id: string;
}
interface Upload {
  url: string;
  filename: string;
}

function buildApiClient(
  ctx: RenderItemFormSidebarPanelCtx,
  environment?: string
) {
  if (typeof ctx.currentUserAccessToken === "string") {
    return buildClient({
      apiToken: ctx.currentUserAccessToken,
      environment: environment ? environment : ctx.environment,
    });
  }
}

export function CustomPanel({ ctx }: Props) {
  const { environments } = ctx.plugin.attributes.parameters;
  const [envs] = useState(environments as string);
  const [selectedEnv, setSelectedEnv] = useState("");
  const [checkedAutoKey, setCheckedAutoKey] = useState(false);
  const [disable, setDisable] = useState(false);

  if (ctx.itemStatus === "new") {
    <div>Please create the record before copying to another environment</div>;
  }

  return (
    <Canvas ctx={ctx}>
      Select environment:
      <select
        id="selectedEnv"
        name="selectedEnv"
        value={undefined}
        onChange={(e) => {
          setSelectedEnv(e.target.value);
        }}
      >
        <option key={"optionEnv_none"} value="">
          Select
        </option>
        {envs.split(",").map((item) => (
          <option key={"optionEnv_" + item} value={item}>
            {item}
          </option>
        ))}
      </select>
      <br />
      <br />
      <label>
        <input
          type="checkbox"
          id="checkboxAutoKey"
          value={undefined}
          checked={checkedAutoKey}
          onChange={() => setCheckedAutoKey(!checkedAutoKey)}
        />{" "}
        Auto-generated Key?
      </label>
      <Button
        key="btnCopyRecordEnv"
        disabled={disable}
        onClick={() => copy(ctx, checkedAutoKey, selectedEnv, setDisable)}
        fullWidth
      >
        Copy
      </Button>
    </Canvas>
  );
}

function copy(
  ctx: RenderItemFormSidebarPanelCtx,
  checkedAutoKey: boolean,
  selectedEnv: string,
  setDisable: Dispatch<SetStateAction<boolean>>
) {
  if (selectedEnv === "") {
    alert("Select environment");
    return;
  }
  if (ctx.item?.id) {
    const client = buildApiClient(ctx);
    const client2 = buildApiClient(ctx, selectedEnv);

    if (!client || !client2) {
      console.error("Token is invalid");
      ctx.customToast({
        type: "warning",
        message: "Could not copy the record",
      });
      return;
    }

    setDisable(true);

    const itemId = ctx.item.id;
    const itemType = ctx.itemType.attributes.api_key;

    client.fields
      .list(itemType)
      .then(async (fields) => {
        const item = await client.items.find(itemId, {}).then((item) => item);
        const field_primary = await client.fields
          .list(item.item_type.id)
          .then((fields) =>
            fields.filter(
              (field) =>
                field.validators && field.validators.hasOwnProperty("unique")
            )
          );
        const result = await Promise.all(
          fields.map(async (field) => {
            let link: string[] = [];
            if (field.validators?.hasOwnProperty("item_item_type")) {
              const linkFieldValidators =
                field.validators as LinkFieldValidators;
              link = linkFieldValidators.item_item_type?.item_types;
            }
            let isLink = false;
            let isPrimaryField = false;
            let isFile = false;
            let value = item[field.api_key];
            let api_key_link = null;
            let type_link = null;
            if (field.field_type === "link") {
              isLink = true;
              if (value) {
                const item_link = await client.items
                  .find(value as string, {})
                  .then((item) => item);
                const item_type_link = await client.itemTypes.find(link[0]);
                const field_primary_link = await client.fields
                  .list(link[0])
                  .then((fields2) =>
                    fields2.filter(
                      (field2) =>
                        field2.validators &&
                        field2.validators.hasOwnProperty("unique")
                    )
                  );
                value = null;
                if (field_primary_link && field_primary_link.length > 0) {
                  type_link = item_type_link.api_key;
                  api_key_link = field_primary_link[0].api_key;
                  value = item_link[api_key_link];
                }
              }
            }

            if (
              field_primary &&
              field_primary.length > 0 &&
              field.api_key === field_primary[0].api_key
            ) {
              isPrimaryField = true;
            }

            if (field.field_type === "file") {
              isFile = true;
              if (value) {
                let upload_id = (value as LinkUpload).upload_id;
                const item_upload = await client.uploads.find(upload_id);
                value = {
                  url: item_upload.url,
                  filename: item_upload.filename,
                };
              }
            }

            if (
              ["gallery", "multiple", "structured_text", "rich_text"].includes(
                field.field_type
              )
            ) {
              value = null;
            }

            return {
              api_key: field.api_key,
              value: value,
              isLink: isLink,
              api_key_link: api_key_link,
              type_link: type_link,
              isPrimaryField: isPrimaryField,
              isFile: isFile,
            };
          })
        );
        return result;
      })
      .then(async (fields) => {
        const result = await Promise.all(
          fields.map(async (field) => {
            let value = field.value;
            if (checkedAutoKey && field.isPrimaryField && !field.isLink) {
              value = `${value} (copy ${new Date().getTime()})`;
            }
            if (field.isLink && field.type_link && field.api_key_link) {
              const map = new Map<string, {}>();
              map.set(field.api_key_link, { eq: field.value });

              value = await client2.items
                .list({
                  filter: {
                    type: field.type_link,
                    fields: {
                      ...Object.fromEntries(map),
                    },
                  },
                  version: "current",
                })
                .then((items) => {
                  if (items && items.length > 0) {
                    return items[0].id;
                  }
                  return null;
                });
            }

            if (field.isFile && value) {
              let upload_id = await client2.uploads
                .list({
                  filter: {
                    fields: {
                      filename: {
                        matches: {
                          pattern: (value as Upload).filename,
                          caseSensitive: false,
                        },
                      },
                    },
                  },
                })
                .then((items) => {
                  if (items && items.length > 0) {
                    return items[0].id;
                  }
                  return null;
                });

              if (!upload_id) {
                let blob = await fetch((value as Upload).url).then((resource) =>
                  resource.blob()
                );
                let fileName = (value as Upload).filename;
                upload_id = await client2.uploads
                  .createFromFileOrBlob({
                    fileOrBlob: new File([blob], fileName),
                    filename: fileName,
                  })
                  .then((result) => result.id);
              }
              value = {
                upload_id: upload_id,
              };
            }

            return { api_key: field.api_key, value: value };
          })
        );
        return result;
      })
      .then(async (fields) => {
        const map = new Map(
          fields.map((field) => {
            return [field.api_key, field.value];
          })
        );

        const item_type = await client2.itemTypes.find(itemType);
        const body: SimpleSchemaTypes.ItemCreateSchema = {
          item_type: {
            type: "item_type",
            id: item_type.id,
          },
          ...Object.fromEntries(map),
        };
        const result = await client2.items.create(body);

        return result;
      })
      .then(() => {
        ctx.notice(`Record successfully copied to ${selectedEnv}`);
      })
      .catch((e) => {
        console.error(e);
        ctx.customToast({
          type: "warning",
          message: "Could not copy the record",
        });
      })
      .finally(() => setDisable(false));
  }
}
