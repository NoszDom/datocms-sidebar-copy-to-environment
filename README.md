# Sidebar Copy to Env

A DatoCMS plugin that allows copying records from one environment to another with a configurable whitelist of roles.

**Created from unmaintained project:** [datocms-plugin-sidebar-record-copy-env](https://github.com/cadiazo/datocms-plugin-sidebar-record-copy-env)

## Features

- Copy records to another environment directly from the sidebar
- Configurable role-based access control (whitelisted roles)
- Environment selection interface

## Configuration

The plugin requires the following setup:

### Plugin Permissions

- `currentUserAccessToken` - Required to authenticate API requests

### Plugin Settings

Configure the plugin with:

- **Whitelisted Roles**: Set which user roles can access the copy feature

## Usage

1. The plugin appears on the sidebar under the Publishing Schedule block.
2. Select the target environment. The first element in the list is the primary environment.
3. Click **Copy**:
   - If the record uses assets that can't be found on the target environment, copy the assets.
   - If done, copy the record:
     - If a record with the same ID already exists on the target environment, the plugin updates that record.
     - If no record exists with the same ID, the plugin creates a new record on the target environment.

## Important Considerations

- The record to be copied must have the same field structure and model in the target environment
- Users must have the appropriate role permissions configured in the plugin settings
