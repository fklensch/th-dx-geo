# Salesforce org metadata (slim SFDX project)

This is the **org side** of the demo — everything that lives inside Salesforce.
It is intentionally minimal: the headless app does the heavy lifting.

## Contents

- `force-app/main/default/objects/Account/fields/Location__c.field-meta.xml`
  A geolocation field on Account so hotels can carry lat/long (used by the
  concierge theme; optional for the core data + agent demo).
- `data/Account.json` — three sample hotel Accounts to load into a fresh org.

## Deploy + load (with the `sf` CLI)

```bash
# from this salesforce/ directory, with an authorized org (sf org login web)
sf project deploy start --source-dir force-app
sf data import tree --files data/Account.json
```

The Agentforce **agent itself is built in the org UI** (Agentforce Builder),
not deployed from here — see ../docs/SETUP.md.
