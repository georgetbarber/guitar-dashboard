# Durable account-restore decision

Scope: preserve a local restore through reload, sign-in and incoming snapshots,
and describe the supported merge operation accurately. No cloud erasure or schema
migration is part of this package.

Use an optional, validated `pendingRestoreId` on device workspace state. Existing
workspaces without it remain readable. Activation writes this operation ID in
the same IndexedDB transaction as restored state and recordings. Export omits
this device decision; each import establishes a new decision. Cloud profiles
continue to project only their explicit supported fields.

The store owns activation: pause persistence and sync, drain already-started
local saves, activate into the captured workspace, then display the restored
state. Workspace switching is refused during activation. Failure restores the
previous decision and leaves the old workspace available. State reducers also
refuse cloud merges while a decision is pending.

Confirmation clears the matching operation ID in an IndexedDB transaction before
resuming sync. Failure keeps the pause visible and retryable; a decision for an
older operation cannot clear a newer one. Signing out leaves the pending decision
with that account's isolated device workspace. A later sign-in sees it again.
Incoming snapshot subscriptions stop while held and are re-established after
confirmation; callbacks from retired subscriptions are ignored.

The supported account operation is normal merge: newer conflicting versions win
and unrelated account records remain. The interface must not call this complete
account replacement. Physical-device/PWA tests and general multi-tab editing
coordination remain separate release checks.

Proof: real IndexedDB transaction/round-trip tests; rendered provider remount,
auth, delayed-save and failed-confirmation tests; late incoming snapshot tests;
normal merge resumes only after confirmation; full unit/build/browser/rules gates.
