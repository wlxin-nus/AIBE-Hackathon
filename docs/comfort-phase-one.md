# Shared workplace comfort phase one

## Objective and challenge fit

The selected challenge is **People-Centred Low-Carbon Portfolios**. Two people use iPhone Safari, with one iPhone also providing the hotspot. The laptop hosts a building-side dashboard. Each participant voluntarily shares an alias, an acceptable thermal-comfort range and a position. Preferences can be exported independently of the current session.

The first decision is whether automatic indoor position updates are credible enough for this demo. Connectivity and geolocation must be assessed separately. The current blank canvas has normalized coordinates only; it is not a measured floor plan.

The full challenge connects workforce needs, workplace experience and portfolio choices. Comfort-based zoning addresses workplace experience, but portfolio relevance needs a later comparison of shared-space/floor allocation, occupied HVAC zones and explicit energy assumptions. Do not infer preferences from age or claim measured carbon savings. Keep commuting emissions outside this first experiment and state that scope.

Source: the user-provided `Challenge Statements.docx`, challenge 05. The accompanying judging photograph specifies five equally weighted criteria: problem understanding; usefulness and impact; prototype quality; technical and AI execution; feasibility and limitations, each worth 10 points.

## Verified on 31 October 2026

- A dependency-free Node server and two browser views are available in `prototype/`.
- The integration test verifies two distinct participants, independent preference/position updates, invalid input rejection, room/session access checks, opt-in, explicit leave and heartbeat expiry. The filesystem is served through a small whitelist, not a repository-wide static root.
- The network changed during testing. The original LAN address became invalid when the laptop joined the iPhone hotspot. The user subsequently confirmed both iPhones could open the updated LAN page.
- The server received two real iPhone sessions with different manual positions and ongoing heartbeats. A subsequent browser snapshot confirmed that both positions had changed. This validates real manual position synchronization, not automatic tracking.
- Both iPhones reported `isSecureContext = false`, geolocation API availability, and no Bluetooth API. A geolocation API being present is not proof it can run.
- Preference export is implemented as a portable JSON download containing only the comfort range and schema version. Saving the file on each physical iPhone still needs user verification.
- Claude produced a complete design proposal using `claude-opus-5-5`, explicitly requested `high` effort, in 153.411 seconds. It is saved as `design/comfort-concept.html`; the proposal has been viewed in a browser. Earlier medium-effort attempts are historical evidence only.
- No phone GPS fix has been verified; no automatic indoor tracking, physical floor registration, BMS connection, real VAV actuation or energy measurement has been completed.

## Run the local experiment

From the repository root:

```powershell
node .\prototype\server.cjs
```

The command prints the room code, desktop URL and current LAN participant URLs. Keep the terminal running. On the laptop open the printed desktop URL. On both iPhones, open the participant URL in Safari, enter different aliases, opt in and join. Tap different canvas positions. Keep Safari in the foreground; a suspended background tab can stop its heartbeat. No firewall/security settings were changed in the initial successful test.

The server polls at the dashboard once per second and receives phone heartbeats every five seconds. A participant expires after 20 seconds without updates. 'Active participants' means opted-in browser sessions, not the actual population of the building. Reloading/rejoining can temporarily create another session until the old one expires. The room code is a temporary LAN access control, not production authentication. Session state stays in memory and disappears when the server stops.

```powershell
node --test .\tests\comfort-probe.test.cjs
```

If a local network test fails inside Codex's sandbox, run that test with the authorized network-enabled shell; do not change the test to hide the failure.

## Positioning decision

| Option | Current evidence | Decision |
|---|---|---|
| Same Wi-Fi/hotspot | Working transport for two actual iPhones | Does not provide room coordinates |
| Browser geolocation | API requires a secure context and user permission | Trusted HTTPS must be established before testing fixes |
| Native Web Bluetooth in iPhone Safari | Not supported; absent on both test phones | Not a first-demo positioning route |
| Motion sensors | No absolute room-coordinate registration | Do not present integrated acceleration as reliable indoor tracking |
| Manual canvas position | Actual two-phone synchronization verified | Working fallback |
| Zone check-in using fixed links/QR labels | Can reuse explicit zone selection later | Coarse, user-confirmed location, not continuous tracking |

A same-hotspot HTTP page cannot perform the phone geolocation test. The prior instruction not to publish content remains active; a trusted HTTPS public diagnostic/deployment requires that instruction to be revised by the user. Do not bypass certificate warnings or weaken browser security.

For a later HTTPS test, first hold both phones stationary at a marked point for 30 seconds, then walk a measured 5–10 metre path, pause, and return. Record fix count, timestamps, reported accuracy, stationary drift and displacement repeatability. Reject room/zone assignment if uncertainty is comparable to the zone dimensions, if stationary jitter resembles movement, or if repeated walks are inconsistent. For an illustrative 6-metre-wide zone, a provisional target could be accuracy and drift materially below 2 metres; that is a demo criterion, not an engineering standard. A moving dot alone is not a pass.

Even a good fix requires a common floor origin, orientation and scale before projecting latitude/longitude onto a floor. The present diagnostic reports relative displacement on each phone only and deliberately does not turn it into shared floor positions. Raw GPS coordinates stay on the phone; only capability status and reported accuracy may reach the LAN server.

References: [MDN watchPosition](https://developer.mozilla.org/en-US/docs/Web/API/Geolocation/watchPosition), [MDN accuracy](https://developer.mozilla.org/en-US/docs/Web/API/GeolocationCoordinates/accuracy), [Web Bluetooth implementation status](https://github.com/whatwg/bluetooth/blob/main/implementation-status.md).

## Design and later control logic

Claude proposes a large abstract plan, explicit occupant points with presence halos, three illustrative zones, acceptable comfort ranges and a conflict review state, plus a phone preference view. Its values and geometry are illustrative. Review this before integrating a final layout. A presence halo is not measured room temperature. A future density layer should have a defined spatial bandwidth and remain separate from individual preferences.

For the next functional increment, define three normalized zone polygons independently of a real floor plan. Assign a zone from a confirmed position. Calculate acceptable-range intersections, flag conflicts, and show a candidate zone-air setpoint with the rule and input values. Treat the user's 25 °C baseline as a scenario assumption; it is not a universal building default, supply-air temperature, or proof of an actual VAV configuration. Preserve occupied-zone ventilation and equipment constraints in any future real integration. No current code controls equipment.

An AI reviewer can interpret constraints, explain conflicts and compare space-allocation scenarios. Numerical checks and operating limits should be deterministic. Calling an AI during development is not evidence of an implemented runtime agent.

## Remaining time

The hard development cutoff remains **before 14:00 on 31 October 2026, UTC+8**. Target demo readiness by **13:45**, with feature freeze at **13:15**. After this experiment, prioritize design approval and a dependable position mode. Time-box any automatic-positioning attempt; preserve the already working manual path. Then integrate three zones and a transparent simulated recommendation, verify the two-phone scenario and export, and prepare a backup capture before the cutoff.
