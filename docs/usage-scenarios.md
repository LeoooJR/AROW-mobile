# Unexpected everyday usage scenarios

This index records accidental, ordinary-user situations that can expose gaps in
AROW Mobile. Its purpose is discovery and durable coverage tracking, not a list
of security attacks or a claim that every entry is fixed.

## Coverage and handling at a glance

**App handling: 3 managed, 9 partially managed, 4 unverified.**
**Automated coverage: 1 covered, 13 partial, 2 missing.**
Assessment: 2026-10-30, baseline `7488ef7`; evidence and limitations are in each entry.

Handling and automated coverage are separate:

- **Managed:** The primary observed behavior works. Broader variants may still
  need verification; missing automation remains open.
- **Partially managed:** Safeguards or recovery exist, but feedback, usability,
  or part of the scenario still needs attention.
- **Unverified:** Implementation was inspected, but this situation has not been
  exercised live. It must not be treated as handled.
- **Covered / Partial / Missing** in the automation column mean an existing
  journey covers the primary scenario / tests cover only parts or related
  behavior / no automated coverage of the scenario was identified. These labels
  describe existing test scope, not tests run or passed in this session.

### Managed behavior

These primary behaviors were observed working. Two still lack a complete
automated journey.

| ID                  | Situation                       | Automated coverage                      | Next action                                                                           |
| ------------------- | ------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------- |
| [USE-005](#use-005) | Close the active point's card   | **Partial** — coordination unit tests   | Add a journey closing the card during simulation; assert status and Stop remain.      |
| [USE-007](#use-007) | Home and return                 | **Covered** — notification/Home journey | Maintain the existing journey; test lock, process death, and task removal separately. |
| [USE-014](#use-014) | In-range PK absent from dataset | **Partial** — resolution unit tests     | Add the missing-record → correction journey; verify fast edits on device.             |

### Partially managed — needs attention

These entries remain open even where recovery succeeded. A successful retry or
an intentional behavior does not resolve the remaining user-facing question.

| ID                  | Situation                                | Automated coverage                                           | Next action                                                                                                        |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| [USE-001](#use-001) | Developer options switched off           | **Partial** — cleanup/controller unit tests                  | Clarify recovery instructions. Live retesting is excluded by the user; retain historical evidence.                 |
| [USE-002](#use-002) | Mock-app selection removed mid-run       | **Partial** — cleanup tests; provider selection before Start | Explain mock-selection restoration; add revocation → restoration → Stop coverage.                                  |
| [USE-003](#use-003) | Wi-Fi and mobile data switched off       | **Partial** — foreground connectivity-loss journey           | Verify uncached tiles, Wi-Fi-to-cellular fallback, and failed-request recovery.                                    |
| [USE-004](#use-004) | Decimal-style PK input                   | **Partial** — sanitization/range unit tests                  | Clarify punctuation normalization; cover decimal, comma, signed, and clipboard variants.                           |
| [USE-006](#use-006) | Map-only mode during simulation          | **Partial** — map-only journey without active simulation     | Decide how users discover Stop in map-only mode; cover active simulation and Back.                                 |
| [USE-008](#use-008) | Location services switched off mid-run   | **Partial** — readiness/real-location tests                  | Clarify the running status with Location off; verify foreground return and delivery to a receiving app.            |
| [USE-011](#use-011) | AROW task swiped away                    | **Missing** — no task-dismissal journey                      | Make continued simulation after dismissal explicit; automate task removal, reopen, and Stop.                       |
| [USE-013](#use-013) | Another point selected during simulation | **Partial** — selection/coordination unit tests              | Resolve the search/card action inconsistency; cover prepared target versus applied fix.                            |
| [USE-016](#use-016) | Simulated/active label after Stop        | **Partial** — presentation/controller unit tests             | Distinguish retained mock fixes from active simulation; assert cleanup, fix freshness, and real-position recovery. |

### Unverified — investigation and coverage needed

Existing readiness or layout code is not sufficient evidence that these
transitions are managed.

| ID                  | Situation                              | Automated coverage                                  | Next action                                                                                                   |
| ------------------- | -------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| [USE-009](#use-009) | Location permission downgraded mid-run | **Partial** — permission/readiness tests            | Exercise approximate-only and full denial separately during a run; check restart, native state, and recovery. |
| [USE-010](#use-010) | Notifications blocked mid-run          | **Partial** — denial at Start; notification journey | Block a previously allowed channel during simulation; check warning, background visibility, and Stop.         |
| [USE-012](#use-012) | Large text and landscape               | **Missing** — no combined configuration journey     | Exercise large text, landscape, keyboard, long cards, and reachable Stop; restore settings.                   |
| [USE-015](#use-015) | Standalone offline cold launch         | **Partial** — startup failure/retry unit tests      | Use a standalone preview/release build; verify access to local data, failure feedback, and online Retry.      |

## Maintaining this index

- Update the overview's handling status, automation status, next action, and
  assessment baseline whenever an entry changes. Keep counts consistent with
  the rows. Move a row between groups only when evidence supports the change.
- Mark automation Covered only for the scenario's stated scope, with the journey
  linked in its detailed entry. Record test execution separately. Close a handling
  gap only after documenting its resolution and verification.
- Keep stable `USE-NNN` identifiers and their matching anchors. Update an existing
  situation instead of creating a duplicate. Add variants when foreground/background,
  startup, or permission state changes the outcome.
- Record the situation, possible consequence, actual observation, and current
  project handling separately. A plausible consequence is not an observed bug.
- Use the live-result labels `Observed gap`, `Observed recovery`,
  `Observed limitation`, and `Not yet exercised`. Code inspection alone never
  establishes a live result. Record the date, build, device, reproduction steps,
  and recovery.
- Link the implementation and existing tests that address the situation. Name
  missing coverage explicitly; the presence of a test is not proof it ran in
  the exploration session.
- Revisit entries after related changes. Update current handling, coverage, and
  remaining gaps in place; preserve only observations needed to understand the
  risk. Keep implementation recaps, run logs, and step-by-step evidence in linked
  test documentation or review artifacts, rather than appending a work history.
- Do not repeat the Developer-options-off experiment (`USE-001`): the user
  excluded it from subsequent rounds because it also disables the test channel.
- Test only on confirmed emulators unless a physical device is explicitly
  authorized. Restore temporary device settings and stop simulations afterward.

## Situations

<a id="use-001"></a>

### USE-001 — Turn off Developer options during simulation

- **Situation:** A user starts a simulation, opens Android Settings, and switches
  off Developer options without stopping the simulation first.
- **Possible consequence:** Mock-location authority disappears while the app
  still claims to simulate; stopping or returning to real location may fail.
- **Live result:** **Observed gap**, 2026-10-30. Start at `499+752`, close the
  metadata card, open Developer options and turn its main switch off. Returning
  to AROW shows “Position simulée — Erreur”, “Arrêt incomplet. Réessayez” and
  “Réessayer l’arrêt”. Pressing retry while the setting remains off leaves the
  same error. The app correctly avoids claiming a successful stop, but does not
  explain which Android setting must be restored. Actual continued injection
  must not be inferred from the retained coordinates or conservative error.
- **Project handling:** [Service refresh](../modules/arow-mock-location/android/src/main/java/expo/modules/arowmocklocation/MockLocationService.kt)
  catches injection errors; [engine cleanup](../modules/arow-mock-location/android/src/main/java/expo/modules/arowmocklocation/MockLocationEngine.kt)
  retains ownership on failed removal. [Controller reconciliation](../src/features/simulation/simulation-controller.ts)
  preserves the retry-stop path; [presentation](../src/components/composites/location-bar/location-presentation.ts)
  gives the generic cleanup message.
- **Coverage:** [Controller tests](../src/features/simulation/simulation-controller.test.ts)
  cover retained cleanup failures and repeated stop requests. No configured
  device journey switches Developer options off during a running simulation.
  Recovery after restoring the Android settings was not completed by the agent.
  The user manually re-enabled Developer options and USB debugging after
  interrupting the session. AROW's mock-app selection was separately restored
  through Settings in the resumed round; that is not proof of seamless recovery
  of the original interrupted operation.
- **Test note:** Switching this setting off also disconnected ADB. Observation
  continued using emulator-console screenshots and ordinary touchscreen input;
  no guest setting was forced back through a debug shell.
- **Scope restriction:** Retain this historical observation, but do not repeat
  the experiment in subsequent exploration rounds. Developer options being on
  does not by itself establish that USB debugging or mock-app selection has
  returned to its previous state.

<a id="use-002"></a>

### USE-002 — Remove AROW as the mock-location app during simulation

- **Situation:** A user chooses no mock-location app, or another app, in Android
  Developer options while AROW is simulating in the background.
- **Possible consequence:** Injection or cleanup fails; a stale running status
  or simulated last-known fix may mislead the user.
- **Live result:** **Observed gap and recovery**, 2026-10-30. Start `499+752`,
  open Developer options, and change only “Select mock location app” from AROW
  to “Nothing”. Returning shows “Arrêt incomplet. Réessayez” and “Réessayer
  l'arrêt”; retry without restoring authority leaves the error. Select AROW
  again in Settings, return, and press retry: the status returns to real-location
  search and the action becomes Start. Developer options and USB debugging
  remained on throughout this test. The retry path recovers, but its message
  does not tell a first-time user to restore mock selection. Retained coordinates
  do not prove continued injection while authority is absent.
- **Screenshot:** Local artifact `mock-selection-removed.png` in the session's
  screenshot directory.
- **Project handling:** [Engine](../modules/arow-mock-location/android/src/main/java/expo/modules/arowmocklocation/MockLocationEngine.kt)
  checks mock authority before Start. Injection failures go through service
  cleanup; cleanup failure retains ownership and an explicit retry-stop action.
  The controller polls a running native snapshot and reconciles on foreground
  return. Current cleanup feedback does not name mock-app selection as a remedy.
- **Coverage gap:** Controller tests simulate cleanup failure, and the
  [mock-provider journey](../.maestro/tests/select-mock-location-provider.yaml)
  selects a provider before Start. Neither exercises revocation during a run,
  restoration, and successful cleanup afterward.

<a id="use-003"></a>

### USE-003 — Lose connectivity while using the foreground app

- **Situation:** A user switches off Wi-Fi and mobile data while viewing the map
  or simulating, then pans to an uncached area and uses railway point search.
- **Possible consequence:** Blank map areas, blocked local search, loss of Stop,
  misleading location status, or failure to recover when connectivity returns.
- **Live result:** **Observed recovery.** The loaded map, local search, and
  simulation Stop/Start remain usable offline. Wi-Fi reconnection does not require
  relaunching AROW. Uncached content and cellular fallback remain unverified.
- **Project handling:** [Point resolution](../src/components/composites/map-toolbar/point-search-sheet/use-milestone-resolution.ts)
  uses the local railway repository. Native simulation does not depend on the
  basemap network. [Map startup](../src/features/use-map-startup.ts) handles
  startup failures; the route only reports map errors to that gate while loading,
  so startup tests do not establish feedback for later connectivity loss.
- **Coverage:** **Partial.** The
  [Maestro journey](../.maestro/tests/manage-connectivity-loss.yaml) covers
  connectivity loss after startup, map interaction, local lookup, simulation
  Stop/Start, and Wi-Fi reconnection. Verified on an Android 36 development
  client at baseline `7488ef7`.
- **Remaining gaps:** Uncached basemap availability, Wi-Fi-to-cellular fallback,
  and failed tile-request recovery. Offline cold launch is tracked in USE-015;
  retained mock-fix presentation after Stop is tracked in USE-016.

<a id="use-004"></a>

### USE-004 — Enter a decimal-style PK in the kilometer field

- **Situation:** On line `893000`, section `1`, type `509.000` into Kilomètre
  and `000` into Partie métrique, interpreting the dot as a familiar separator.
- **Possible consequence:** Punctuation removal could silently change the
  intended position or permit an unintended simulation target.
- **Live result:** **Observed recovery**, 2026-10-30. The kilometer field becomes
  `509000`. The complete input displays “Repère hors section” with the recorded
  limits; “Utiliser ce point” remains disabled. Reselecting Section 1 clears the
  fields; plus resolves the first recorded point, `499+752`. Punctuation is
  removed without explaining that normalization, which remains a usability
  limitation. This was typed input, not a clipboard-paste test.
- **Project handling:** [Input sanitization and range validation](../src/features/railway-reference/search/milestone-input.ts)
  and [form reset](../src/components/composites/map-toolbar/point-search-sheet/point-search-form-reducer.ts).
- **Coverage:** Existing [input tests](../src/features/railway-reference/search/milestone-input.test.ts)
  cover sanitization/validation; this exact decimal-style journey is not in the
  configured Maestro flows. Add comma, signed numbers, partial metrics, and
  clipboard variants when this entry is revisited.

<a id="use-005"></a>

### USE-005 — Close the selected card while simulation is running

- **Situation:** Start simulation, then press the card's close icon, assuming it
  might also close or stop the operation.
- **Possible consequence:** Simulation becomes invisible or loses its stop
  control; users may incorrectly think closing the card stops mock location.
- **Live result:** **Observed recovery**, 2026-10-30. The card disappears but
  “Position simulée — Active” and “Arrêter la simulation” remain visible.
- **Project handling:** [Map/location coordination](../src/features/use-map-location.ts)
  keeps the action when simulation requires stopping, independently of selection.
- **Coverage:** Existing [coordination tests](../src/features/use-map-location.test.ts)
  and [lifecycle guide](../src/features/simulation/README.md) cover this distinction.
  The configured map-selection journey closes a prepared target while inactive;
  that alone does not cover closing a card during an active simulation.

<a id="use-006"></a>

### USE-006 — Enter map-only mode while simulation is active

- **Situation:** A user wants more map space and taps the full-screen control
  during simulation, then looks for Stop.
- **Possible consequence:** Hidden controls are mistaken for a stopped
  simulation, or the user cannot discover how to stop it.
- **Live result:** **Observed limitation**, 2026-10-30. During an active
  `499+752` simulation, map-only mode leaves the map and exit icon visible but
  removes both the simulation status and Stop. A service inspection in that
  screen still reports the foreground simulation service. Android Back restores
  the active status and Stop; Stop was subsequently exercised in USE-008.
  This is intentional overlay behavior, with a discoverability risk while active.
  The development build's floating Tools button overlaps part of the exit
  control; the screenshot was retaken after using its unobstructed upper area.
- **Screenshot:** `active-map-only.png`.
- **Project handling:** [Map route](../src/app/index.tsx) hides the location bar
  while map-focused; [selection hook](../src/features/use-map-selection.ts)
  handles Android Back to exit. Hiding overlays does not stop simulation.
- **Coverage:** [Map-focus journey](../.maestro/tests/manage-map-focus.yaml)
  exercises map-only mode, and selection tests cover Back. Neither establishes
  discoverability of Stop during a running simulation.

<a id="use-007"></a>

### USE-007 — Leave the app with Home and return during simulation

- **Situation:** Start simulation, go to the Android launcher, then return to AROW.
- **Possible consequence:** The UI and Android service disagree, or simulation
  continues without a way to stop it after return.
- **Live result:** **Observed recovery**, 2026-10-30. A service inspection while
  Home was visible found `MockLocationService` in the foreground with notification
  ID `8051`. Returning showed “Position simulée — Active” and Stop.
- **Project handling:** [Foreground service](../modules/arow-mock-location/android/src/main/java/expo/modules/arowmocklocation/MockLocationService.kt)
  refreshes independently of the screen. [Provider](../src/features/simulation/simulation-provider.tsx)
  reconciles on foreground return.
- **Coverage:** The existing [notification journey](../.maestro/tests/manage-simulation-notification.yaml)
  exercises Home and notification return. Screen lock, process death, and task
  dismissal remain distinct cases rather than covered variants of Home.

<a id="use-008"></a>

### USE-008 — Switch off Android location services after Start

- **Situation:** Turn the phone's Location switch off while simulation is active,
  return to AROW, and try Stop and Start again.
- **Possible consequence:** “Active” may outlive usable location delivery, or
  cleanup may become inaccessible when location is disabled.
- **Live result:** **Observed limitation and recovery**, 2026-10-30. With
  `499+752` active, switch Android Location off (driven by
  `cmd location set-location-enabled false`). Android displays “No location
  access”; choose Close to leave Location off. AROW still shows “Position
  simulée — Active” and Stop. Stop succeeds and the real-location status becomes
  “Services désactivés”. A subsequent Start is rejected with “Activez les services
  de localisation”. Location was restored afterward. The running screen does
  not distinguish location delivery being disabled from the engine remaining
  active; actual delivery to another app was not measured.
- **Screenshot:** `location-disabled-active.png`, after dismissing Android's
  warning while leaving Location off.
- **Project handling:** [Engine readiness](../modules/arow-mock-location/android/src/main/java/expo/modules/arowmocklocation/MockLocationEngine.kt)
  checks the setting before Start. The running refresh injects fixes without
  re-running readiness; reconciliation reads the stored native snapshot.
  Therefore startup validation alone does not establish mid-run behavior.
- **Coverage gap:** The live run covers Stop and rejected restart with Location
  off. Existing readiness/real-location tests do not reproduce the mid-run
  Android transition. Foreground-return behavior and delivery to a receiving
  application still need separate checks.

<a id="use-009"></a>

### USE-009 — Downgrade precise location access during simulation

- **Situation:** In app permissions, change precise access to approximate, or
  deny location access, while AROW is simulating in the background.
- **Possible consequence:** Android may restart the app; service state, selected
  point, and user feedback may no longer agree after return.
- **Live result:** Not yet exercised. Approximate-only and full denial must be
  recorded separately; they are not equivalent permission states.
- **Project handling:** Engine readiness requires fine location. The
  [real-location controller](../src/features/real-location/real-location-controller.ts)
  rechecks permission on foreground return; the simulation provider reconciles
  native state on mount and resume.
- **Coverage gap:** [Permission journey](../.maestro/tests/manage-location-permission.yaml)
  covers location access recovery, not proof of a permission downgrade during
  an already running native simulation.

<a id="use-010"></a>

### USE-010 — Block notifications after simulation has already started

- **Situation:** Start with notifications allowed, disable the app's notification
  channel in Settings, then leave AROW running in the background.
- **Possible consequence:** Simulation continues after its background indicator
  disappears, without a new warning in the app.
- **Live result:** Not yet exercised.
- **Project handling:** [Notification preparation](../src/features/simulation/simulation-notifications.ts)
  checks actual visibility after an explicit successful Start. The
  [provider](../src/features/simulation/simulation-provider.tsx) does not repeat
  that check during native snapshot polling. The warning is deliberately separate
  from simulation success.
- **Coverage gap:** [Notification journey](../.maestro/tests/manage-simulation-notification.yaml)
  covers denial at Start and background return; blocking a previously allowed
  channel mid-run needs its own observation.

<a id="use-011"></a>

### USE-011 — Swipe AROW away from Recents during simulation

- **Situation:** A user swipes the app's recent-task card away, believing this
  always stops its work, then opens AROW again.
- **Possible consequence:** A service may outlive the task, or an operation may
  stop without the next screen explaining what happened.
- **Live result:** **Observed limitation and recovery**, 2026-10-30. With
  `500+000` running, open Recents and swipe AROW's card upward. A fresh Recents
  hierarchy no longer contains the AROW card; the foreground service still
  exists with notification ID `8051`. Reopening AROW shows the same simulated
  coordinates and Stop. Swiping the task away is therefore not a Stop on this
  emulator. An initial slower gesture did not remove the card and was not used
  as evidence. Home, force-stop, process death, reboot, and other manufacturers'
  task policies remain separate scenarios.
- **Project handling:** [Service](../modules/arow-mock-location/android/src/main/java/expo/modules/arowmocklocation/MockLocationService.kt)
  returns `START_NOT_STICKY`; [manifest plugin](../modules/arow-mock-location/app.plugin.js)
  declares its foreground type but does not set `stopWithTask`.
  `START_NOT_STICKY` governs restart after service termination, and by itself
  does not prove immediate shutdown on a task swipe. The
  [lifecycle guide](../src/features/simulation/README.md)'s no-restart statement
  must not be read as a guarantee that dismissing a task stops its existing
  service.
- **Coverage gap:** No configured Maestro journey swipes away a running task and
  checks both service/provider state and the next launch. Reopening a development
  client here is not proof of standalone-build cold-start behavior.

<a id="use-012"></a>

### USE-012 — Large text and rotation while controls are crowded

- **Situation:** Increase Android font size, rotate into landscape, and open
  search or a long railway card while simulation is running.
- **Possible consequence:** Stop, input fields, validation messages, or the sheet
  dismissal affordance becomes clipped or unreachable.
- **Live result:** Not yet exercised.
- **Project handling:** The [details frame](../src/components/composites/map-feature-details-card/map-feature-details-frame.tsx)
  constrains height and scrolls metadata; the
  [search sheet](../src/components/composites/map-toolbar/point-search-sheet/index.tsx)
  scrolls its body and retains a footer. This does not prove usability with all
  font/window combinations.
- **Coverage gap:** Existing component tests and portrait journeys do not
  establish large-text landscape behavior with the keyboard open.

<a id="use-013"></a>

### USE-013 — Choose a different point while an existing simulation runs

- **Situation:** While simulating point A, search for point B or browse a neighbour
  and press “Utiliser ce point”, expecting immediate movement.
- **Possible consequence:** Card, highlight, prepared target, and applied position
  may describe different points without an understandable distinction.
- **Live result:** **Observed limitation**, 2026-10-30, also offline. While
  simulating `499+752` at `45.82680 N, 4.84784 E`, resolve `500+000` in search.
  The sheet enables “Utiliser ce point” and accepts it. The card now describes
  `500+000` at `45.82465 N, 4.84849 E`, but the active location remains at
  `499+752`. The equivalent action on the card is disabled. Stop then Start
  applies `500+000` correctly, including without network access. This preserves
  the existing fix but leaves two identically named selection actions with
  different availability during a run.
- **Screenshot:** `selected-point-differs-active-fix.png`.
- **Project handling:** [Map coordination](../src/features/use-map-location.ts)
  prevents a new native Start while stopping is required; the map card action
  is guarded by `canSelectSimulationTarget` in [the route](../src/app/index.tsx).
  Point search still supplies `selection.onMilestoneSelect` through the toolbar.
  A changed selection alone does not imply a changed applied fix.
- **Coverage gap:** Existing selection/coordination unit tests cover individual
  rules, not the complete user journey comparing both entry paths while active.

<a id="use-014"></a>

### USE-014 — Enter a PK inside the displayed range but absent from the dataset

- **Situation:** A user sees the section's minimum and maximum and assumes every
  metric position between them is selectable.
- **Possible consequence:** The app could invent a point or reuse an earlier
  resolved position when the requested record is absent.
- **Live result:** **Observed recovery**, 2026-10-30, offline on line `893000`,
  section `1`. Enter `500` and `001`: “Le repère 500+001 n'est pas disponible
  dans cette section” appears and selection is disabled. Correct the metric to
  `000`: “Point résolu” appears and selection is enabled. The previous resolved
  point is not reused for the missing record. Fast consecutive edits while a
  lookup is pending remain untested live.
- **Screenshot:** `offline-missing-milestone.png`.
- **Project handling:** [Milestone resolution](../src/components/composites/map-toolbar/point-search-sheet/use-milestone-resolution.ts)
  performs an exact lookup, correlates results by ID, and ignores stale responses.
  The footer enables selection only for a ready result. Range bounds do not
  guarantee intermediate records.
- **Coverage:** [Resolution tests](../src/components/composites/map-toolbar/point-search-sheet/use-milestone-resolution.test.ts)
  explicitly cover unavailable points and stale responses. Add this complete
  missing-record/correction journey to automated coverage when implementing a
  related change.

<a id="use-015"></a>

### USE-015 — Open the app offline, even after previously using its local data

- **Situation:** After an earlier successful session, open AROW without network
  access and expect the bundled railway data and search to remain accessible.
- **Possible consequence:** An online-basemap failure gates access to otherwise
  local railway functionality; Retry may appear ineffective until connectivity
  returns.
- **Live result:** Not yet exercised in a standalone release/preview build.
  Losing Metro in a development client must not be reported as this app behavior.
- **Project handling:** [Basemap startup check](../src/components/adapters/map/check-basemap-source.ts)
  requires successful online source metadata as well as a rendered map frame;
  [startup state](../src/hooks/platform/use-app-startup.ts) has a 30-second timeout
  and a fresh Retry attempt.
- **Coverage:** Existing [map startup tests](../src/features/use-map-startup.test.ts)
  and [startup hook tests](../src/hooks/platform/use-app-startup.test.ts) cover
  failure/retry logic. They do not establish a release build's offline UX.

<a id="use-016"></a>

### USE-016 — Stop completes but the location bar still says simulated and active

- **Situation:** Press Stop and immediately look at the location bar to confirm
  that simulation ended.
- **Possible consequence:** “Active” alongside a Start button makes a successful
  stop look unsuccessful. A cached mock fix can be mistaken for ongoing injection
  or a fresh real position.
- **Live result:** **Observed limitation**, 2026-10-30. During USE-003, after
  stopping `499+752`, the action becomes “Démarrer la simulation”, but the bar
  reads “Position simulée — Active”, with the old coordinates and 3 m accuracy.
  Starting the prepared `500+000` then changes the applied fix correctly.
  This observation does not establish that injection continued after Stop.
- **Recheck after USE-011:** Reopen after task dismissal and stop `500+000`.
  The service is absent from `dumpsys activity services`, and `dumpsys location`
  lists GPS and network providers without their earlier `[mock]` markers.
  The bar still says simulated/active at the last coordinates, with 3 m accuracy.
  In this reopened session there is no prepared target or Start/Stop action.
  Native cleanup and the visible “Active” label must therefore be asserted
  separately; neither the label nor old coordinates prove ongoing injection.
  A later final check received a real fix (`45.74491 N, 4.86234 E`) and the bar
  returned to “Position réelle”, connected. The misleading interval was
  transient; its duration was not measured.
- **Screenshot:** `stale-mock-after-stop.png`.
- **Project handling:** [Real-location source](../src/features/real-location/real-location-source.ts)
  preserves the platform's `mocked` flag but does not carry the fix timestamp
  into the displayed descriptor. [Location presentation](../src/components/composites/location-bar/location-presentation.ts)
  calls a mocked real-location descriptor simulated/active even when AROW's
  controller is stopped. This supports external mock sources but does not
  distinguish a retained fix from current simulation activity.
- **Coverage gap:** Presentation/controller unit tests cover their individual
  states. A device journey must assert post-Stop status, native service/provider
  cleanup, freshness of the next received fix, and eventual real-position
  recovery separately. The existing notification-removal assertion alone cannot
  establish all of those properties.
