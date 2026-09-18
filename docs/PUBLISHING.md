# Publish Guitar Academy

On macOS, double-click `PUBLISH_LIVE.command` at the repository root.

The publisher shows every file it intends to include and waits until `PUBLISH`
is typed. It then:

1. checks GitHub sign-in, opening the secure browser login only when needed;
2. checks that the current branch is `main` and that GitHub has no newer commits;
3. runs the current application's tests and production build;
4. synchronises the Firebase browser settings from `.env.local` to GitHub;
5. commits all displayed repository changes and pushes them to GitHub;
6. waits for Firebase Hosting and reports when the live update has succeeded.

If there is no new commit, the publisher starts a fresh deployment explicitly.
This makes it safe to use after repairing a GitHub or Firebase setting as well as
after editing application files.

The first run may open a browser so GitHub can authenticate. Firebase Hosting is
then deployed by GitHub Actions, using a repository secret created during the
one-time Firebase setup. `apps/current/.env.local` remains intentionally excluded
from Git.

The Hosting service-account secret only authorises the deployment. The website's
Firebase connection is configured separately at build time. The following GitHub
repository variables must match the values in `apps/current/.env.local`:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_APP_CHECK_SITE_KEY`

The publisher refreshes the Firebase variables every time, and the deployment workflow
checks them before building. If one is absent, publishing stops rather than
replacing the live site with a local-only build.

The Pixel installation is a Progressive Web App served by the same Firebase
Hosting deployment. It downloads an update in the background and then offers it:
the learner chooses "Update now", and nothing reloads on its own (B03). Updating
from a build released before 14 September 2026 is the exception — those builds
cannot ask, so the waiting version only takes over once every window of the app
is fully closed and reopened.

Recordings remain device-only. Cross-device sharing of a finished take is off
unless the repository variable `VITE_RECORDING_SHARING` is `enabled`. The live
project `learn-the-guitar` has **no Firebase Storage bucket**, and a new default
bucket requires the pay-as-you-go Blaze plan, so the variable is unset. With it
unset, the app offers no sharing control and the release deploys Firestore rules
only. Deploying storage rules to a project without Storage fails the whole
release, as it did on 17 September 2026.

To turn sharing on later: move the project to Blaze and set a budget alert.
Then open Firebase console → Storage → Get started; Google's always-free
Storage tier applies only in US-CENTRAL1, US-EAST1 and US-WEST1. Next, apply
`storage.cors.json` as below and set `VITE_RECORDING_SHARING=enabled` in both
`.env.local` and the GitHub repository variables. The next release then also
deploys `storage.rules`.

The GitHub deploy service account needs **Firebase Hosting Admin** and **Firebase
Rules Admin**. **Cloud Storage for Firebase Viewer** is needed only once storage
rules are deployed; the CLI reads the default bucket first.

If deployment fails, the publisher keeps the window open and displays the failed
step. Correct it and publish again. Pull requests run local Firestore and Storage
rule tests. The protected `main` workflow deploys those tested rules before
Hosting, so a frontend that depends on a rule change cannot silently go live while
old permissions remain active. If Storage is enabled, apply
`apps/current/storage.cors.json` to the bucket once as described in the Pixel setup
guide; this permits authenticated in-browser blob playback without issuing a
public download link.

The workflow references every third-party GitHub Action by a full reviewed commit
SHA. Keep the readable version comment, and update a SHA only through a reviewed
dependency pull request. The Firebase service account should have only the roles
needed for rules and Hosting deployment. A separate preview-only Firebase identity
is the next credential-hardening step; until it exists, same-repository preview
branches remain trusted maintainer code and fork previews receive no secret.
