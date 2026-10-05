# SPEC — Module 05: Savings Plan

Version: 1.1  
Status: APPROVED
Module ID: `05-savings-plan`  
Depends on: `spec/00-product.md`, `spec/02-trips.md`, `spec/04-budget-expenses.md`, `AGENTS.md`, `docs/adr/ADR-002-money-and-currency.md`  
Primary handoff: Module 06 — Daily Itinerary

---

## 1. Purpose

Turn the Trip's approved financial model into a clear funding plan that answers one practical question:

> How much money still needs to be funded before departure, and what saving pace would reach that amount on time?

This module is advisory. It must be deterministic, explainable, auditable from the underlying Trip financial data, and must never behave like a bank account, investment product, credit product or financial-advice engine.

---

## 2. Product outcome

When this module is complete, the authenticated Trip owner can:

1. see the exact savings/funding target being used and why;
2. enter how much money is currently set aside and still available for the Trip;
3. have eligible net payments already made for the Trip count toward funding progress without double counting;
4. see total funded amount;
5. see amount still to fund;
6. see any surplus above the target;
7. see days remaining until departure;
8. see suggested daily, weekly and monthly saving pace;
9. understand whether the Trip is not started, partially funded, fully funded, overfunded, departing today or already started/past;
10. see calculations update when the Trip forecast, target budget, paid totals, saved amount or departure date changes;
11. see the calculation basis in plain language;
12. use the planner even when the Trip has no manually defined target budget, provided a financial forecast exists;
13. receive a safe empty state when neither target budget nor usable forecast exists.

---

## 3. Actors

### 3.1 Authenticated Trip owner

Can view and edit the savings-plan input for their own Trip.

### 3.2 Authenticated non-owner

Cannot view or modify another user's savings data or derived funding calculations.

### 3.3 Visitor

Cannot access the Savings Plan.

---

## 4. Scope

### Included

- savings target derivation;
- current available/saved Trip funds;
- eligible paid amount;
- funded total;
- amount still to fund;
- surplus;
- funding progress percentage;
- departure countdown;
- daily saving pace;
- weekly saving pace;
- monthly saving pace;
- deterministic rounding rules;
- no-target/empty state;
- fully-funded state;
- overfunded state;
- departure-today state;
- departure-passed state;
- automatic recalculation after approved source data changes;
- owner-only access;
- loading/error/success/empty states;
- QA acceptance scenarios.

### Explicitly out of scope

- bank account connections;
- automatic detection of user's real savings balance;
- direct debits or scheduled transfers;
- investment recommendations;
- credit/loan recommendations;
- interest/yield calculations;
- envelope budgeting outside a Trip;
- recurring personal-finance budgets;
- group savings goals;
- traveller-by-traveller contributions;
- savings contribution history/ledger;
- push/email saving reminders;
- gamification/streaks;
- automatic adjustment based on salary or income;
- AI financial advice;
- currency speculation or FX forecasting;
- automatic changes to Trip costs in order to make the target affordable.

---

## 5. Canonical concepts

### 5.1 Savings target

The Savings Target is the amount Triply considers necessary to fund before departure.

The MVP uses the canonical product rule from `spec/00-product.md`:

```text
if Trip target budget is defined:
    savings target = target budget
else if current Trip forecast is available:
    savings target = current Trip forecast
else:
    savings target = unavailable
```

The UI must always identify the basis:

- `Target budget` when the manually defined Trip target is used;
- `Current forecast` when no target budget exists and the Module 04 forecast is used.

The Savings Plan must not silently choose a different basis.

### 5.2 Current available funds

`Current available funds` means money the user has earmarked for this Trip **and which is still currently available/unspent**.

Example:

```text
User originally saved: €1,000
Already paid toward Trip: €300
Money still sitting aside: €700

Current available funds input = €700
Eligible paid amount = €300
Total funded = €1,000
```

This definition is critical to prevent double counting.

The UI must explain that already-paid Trip costs should not also remain inside the `currently available` amount.

### 5.3 Eligible paid amount

Eligible paid amount comes from Module 04's **net Payment total in the Trip base currency**, after valid payment refunds/negative payment adjustments.

```text
eligible paid = max(0, net paid total)
```

MVP rule:

- Payment records count toward funding progress;
- Actual Expense records do not independently count toward funding progress;
- this prevents the same economic event from being counted once as a Payment and again as an Actual Expense;
- standalone Actual Expenses may affect reporting in Module 04, but do not become savings funding unless represented by an eligible Payment.

### 5.4 Total funded

```text
total funded = current available funds + eligible paid amount
```

All values use the Trip base currency.

### 5.5 Amount still to fund

```text
amount still to fund = max(0, savings target - total funded)
```

### 5.6 Surplus

```text
surplus = max(0, total funded - savings target)
```

Surplus is informative. Triply must not automatically increase the Trip budget or forecast because a surplus exists.

### 5.7 Funding progress

For a positive target:

```text
raw progress = total funded / savings target
```

User-facing progress percentage is capped at 100%.

For `savings target = 0`:

- if total funded is `0`, display `100% funded`;
- if total funded is greater than `0`, display `100% funded` plus the surplus;
- never divide by zero;
- never display infinity/NaN.

Internal analytics may preserve an uncapped ratio later, but that is outside the MVP UI contract.

---

## 6. Savings-plan input model

The MVP has one user-maintained monetary input per Trip:

### 6.1 `current_available_amount`

Conceptual fields:

| Field | Requirement |
|---|---|
| `trip_id` | Required; unique per Trip |
| `current_available_amount` | Required non-negative money once Savings Plan is configured; default `0` |
| `currency` | Must equal Trip base currency |
| `updated_at` | Required |

Architecture/Database agents may implement this as a dedicated one-to-one entity or a Trip financial settings record, but must preserve these semantics.

### 6.2 No savings contribution ledger in MVP

The system does not require the user to log every deposit into their travel savings.

The user updates the current amount they still have available.

Example:

```text
Yesterday: €500 available
Today: user adds €100 to savings
User updates current available amount to €600
```

A historical contribution ledger can be added in a future module/spec.

---

## 7. Authoritative source data

Savings Plan is a derived module. It does not create an alternative financial truth.

Authoritative inputs are:

| Input | Source |
|---|---|
| Trip target budget | Module 02 / Module 04 contract |
| Current forecast | Module 04 |
| Net paid total | Module 04 |
| Current available funds | Module 05 |
| Trip start date | Module 02 |
| Current date | application clock/user locale context |
| Trip base currency | Module 02 / Module 04 |

The Dashboard must later consume the same Module 05 calculation output rather than recomputing formulas independently.

---

## 8. Funding-target rules

### RN-05-01 — Target budget takes precedence

If the Trip has a manually defined target budget, that amount is the Savings Target even if current forecast is lower or higher.

Example:

```text
Target budget: €3,000
Current forecast: €2,650
Savings target: €3,000
```

### RN-05-02 — Forecast fallback

If no target budget exists, use Module 04's current forecast.

Example:

```text
Target budget: not set
Current forecast: €2,650
Savings target: €2,650
```

### RN-05-03 — No usable target

If there is no target budget and the forecast is unavailable/contains no priced amount, Savings Plan cannot calculate a funding requirement.

The UI must show a clear empty state such as:

`Add planned trip costs or set a target budget to calculate your savings plan.`

It must not interpret missing target data as zero.

### RN-05-04 — Explicit zero target budget

An explicitly configured target budget of `0` is a real value, not missing data.

The Savings Plan treats the target as zero and follows the zero-target progress rules.

### RN-05-05 — Forecast changes propagate

When forecast is the target basis, approved Module 04 changes that alter forecast must recalculate Savings Plan immediately/consistently after persistence succeeds.

### RN-05-06 — Target budget changes propagate

When target budget is the target basis, changing it must recalculate funding requirement and saving pace.

---

## 9. Current available funds rules

### RN-05-07 — Non-negative only

Current available funds cannot be negative.

### RN-05-08 — Trip base currency only

Current available funds is entered and stored in the Trip base currency.

MVP does not support a multi-currency savings wallet.

### RN-05-09 — Manual current balance

The field represents a current balance, not a cumulative historical total.

### RN-05-10 — Paid costs excluded from current available balance

Product copy must communicate that money already paid toward Trip costs should not remain included in the current available input.

### RN-05-11 — No automatic mutation from payments

Creating a Payment in Module 04 must **not automatically decrease** `current_available_amount`.

Reason: Triply cannot know whether the payment was made from the user's earmarked Trip funds, salary, card, another account or another source.

Instead:

- Payment increases `eligible paid amount` automatically;
- user remains responsible for keeping `current available funds` equal to the amount still actually available.

This avoids hidden assumptions about the user's banking behaviour.

---

## 10. Eligible-paid rules

### RN-05-12 — Use net Payments

Eligible paid amount uses Module 04 net paid total after payment-level refunds/adjustments.

### RN-05-13 — Never double count Actual Expense

Actual Expense does not independently increase funding progress.

### RN-05-14 — Refunds reduce eligible paid

A valid negative Payment adjustment reduces eligible paid amount.

Example:

```text
Payment: +€200
Refund adjustment: -€50
Eligible paid: €150
```

### RN-05-15 — Negative net paid is floored for funding

If edge-case adjustments produce a negative net paid total, Savings Plan uses `0` as eligible paid.

Savings progress cannot become negative.

The original ledger remains unchanged in Module 04.

---

## 11. Departure countdown

### 11.1 Calendar-day basis

Savings pace is based on the number of calendar days from the current local date to the Trip start date.

```text
days until departure = trip start date - current local date
```

Dates are calendar dates, not UTC-duration timestamps.

### RN-05-16 — Future departure

If Trip start date is in the future:

```text
days until departure > 0
```

Normal saving pace can be calculated.

### RN-05-17 — Departure today

If start date equals current date:

```text
days until departure = 0
```

If amount still to fund > 0:

- show the remaining amount as `needed today` / equivalent;
- daily, weekly and monthly pace are not displayed as normal recurring rates;
- do not divide by zero.

If amount still to fund = 0, show fully funded.

### RN-05-18 — Departure passed

If start date is before current date:

- Savings Plan enters `trip_started_or_past` state;
- no future daily/weekly/monthly saving pace is calculated;
- funding summary may remain visible for historical context;
- the UI must not imply the user can meet a past deadline by saving at a future rate.

---

## 12. Saving-pace formulas

Saving pace is advisory and is calculated only when:

```text
amount still to fund > 0
AND
days until departure > 0
```

### 12.1 Daily pace

```text
daily pace raw = amount still to fund / days until departure
```

### 12.2 Weekly pace

```text
weekly pace raw = daily pace raw × 7
```

### 12.3 Monthly pace

For deterministic MVP calculations, Triply uses the average Gregorian month length:

```text
average month days = 365.2425 / 12
average month days ≈ 30.436875

monthly pace raw = daily pace raw × 30.436875
```

The UI may label this as `≈ per month` because it is a normalized monthly pace, not a calendar-month payment schedule.

### 12.4 Rounding

Displayed recommended saving amounts must round **up** to the smallest supported unit of the Trip currency.

Reason: normal rounding down could recommend a pace that mathematically misses the target.

Examples for a 2-decimal currency:

```text
€10.001 → €10.01
€10.010 → €10.01
€10.011 → €10.02
```

The Architecture Agent must use the currency precision utilities defined by the monetary architecture; floating-point arithmetic is prohibited for authoritative calculations.

### RN-05-19 — Rates are independent recommendations

Daily, weekly and monthly rates are separately derived from the same exact underlying daily rate.

They are not commitments and are not stored as financial transactions.

### RN-05-20 — Fully funded

When amount still to fund is zero:

```text
daily pace = 0
weekly pace = 0
monthly pace = 0
```

The primary UI state is `Fully funded`, not `Save €0/day`.

---

## 13. Savings-plan states

The module must expose a deterministic state derived from the data.

### 13.1 `no_target`

No target budget and no usable forecast.

### 13.2 `not_funded`

Target > 0 and total funded = 0, departure is future.

### 13.3 `partially_funded`

Target > 0 and:

```text
0 < total funded < target
```

### 13.4 `fully_funded`

```text
total funded = target
```

or zero-target rules produce a funded state.

### 13.5 `overfunded`

```text
total funded > target
```

Show surplus.

### 13.6 `departure_today`

Trip begins today and is not fully funded.

### 13.7 `trip_started_or_past`

Trip start date is before current date.

Status priority must be deterministic. Recommended priority:

```text
no_target
→ trip_started_or_past
→ fully_funded / overfunded
→ departure_today
→ not_funded / partially_funded
```

Architecture may encode these as enum values but may not alter semantics without spec approval.

---

## 14. UI information hierarchy

The Savings Plan page/card must make the following understandable without requiring the user to infer formulas.

### 14.1 Primary summary

Show:

- Savings target;
- target basis (`Target budget` or `Current forecast`);
- Total funded;
- Still to fund or Surplus;
- progress percentage;
- days until departure when applicable.

### 14.2 Funding breakdown

Show:

```text
Currently available       €X
Already paid              €Y
────────────────────────────
Total funded              €Z
```

The wording must make clear that `Already paid` comes from Trip financial records.

### 14.3 Saving pace

When applicable:

```text
≈ €X / month
≈ €Y / week
≈ €Z / day
```

Do not imply these are scheduled transfers.

### 14.4 Explanation

The user must be able to understand how Triply arrived at the result.

A compact explanation may state:

`Your target is €3,000. You currently have €700 available and have already paid €300, so €2,000 remains to fund before departure.`

No AI-generated explanation is required.

---

## 15. Main flows

### Flow A — First savings plan with target budget

```text
Open Trip
→ Savings Plan
→ target basis = Target budget
→ user enters current available funds
→ Triply reads net paid total
→ calculate total funded
→ calculate remaining
→ calculate days remaining
→ calculate monthly/weekly/daily pace
→ show breakdown and progress
```

### Flow B — No target budget, use forecast

```text
Open Savings Plan
→ no target budget exists
→ Module 04 current forecast exists
→ target basis = Current forecast
→ calculate normally
```

### Flow C — No target and no forecast

```text
Open Savings Plan
→ no target budget
→ no usable priced forecast
→ show no-target empty state
→ CTA can lead to set target budget or add planned costs
```

### Flow D — Payment added elsewhere

```text
Module 04 Payment successfully created
→ net paid changes
→ Savings Plan recomputes eligible paid
→ total funded changes
→ remaining and pace change
```

### Flow E — User updates available funds

```text
Edit current available funds
→ validate non-negative base-currency amount
→ persist
→ recompute all derived values
→ show success state
```

### Flow F — Trip fully funded

```text
total funded >= target
→ remaining = 0
→ no saving pace required
→ show funded state
→ show surplus if > target
```

---

## 16. Error and edge cases

### 16.1 Failed save

If updating current available funds fails:

- do not display the unsaved value as authoritative;
- preserve the last persisted calculation;
- show retry-capable error state;
- prevent duplicate writes on repeated user action.

### 16.2 Stale financial totals

Savings Plan must not calculate from a knowingly stale client-side total if authoritative Module 04 data has changed.

Architecture must define a reliable derived-data refresh strategy.

### 16.3 Currency mismatch

A savings amount in a currency different from the Trip base currency must be rejected in MVP.

### 16.4 Target falls below funded amount

If target budget/forecast later falls below total funded:

- remaining becomes `0`;
- state becomes overfunded;
- surplus is displayed;
- Triply does not automatically lower `current available funds`.

### 16.5 Forecast increases

If forecast is the target basis and forecast rises:

- target rises;
- remaining is recalculated;
- progress may decrease;
- no historical monetary record is mutated.

### 16.6 Refund after fully funded

If a Payment refund reduces eligible paid:

- total funded decreases;
- the Trip may return from fully funded to partially funded;
- saving pace recalculates when departure is future.

### 16.7 Trip start date edited

Changing the Trip start date recalculates the deadline and saving pace, but never changes target or funded money.

### 16.8 Archived trip

Archived trips may display a historical Savings Plan summary but should not encourage active saving actions by default.

Detailed archived UX may be resolved by Design while preserving read-only/historical semantics where appropriate.

---

## 17. Security and privacy requirements

### SEC-05-01 — Ownership

Savings-plan input and derived data are owner-only.

### SEC-05-02 — RLS

Database persistence for current available funds must be protected by RLS or equivalent row-level ownership enforcement.

### SEC-05-03 — Server authorization

Server mutations must validate Trip ownership independently of client state.

### SEC-05-04 — Monetary tampering

Client-provided derived totals must never be trusted as authoritative.

The server/domain layer must calculate or validate target, net paid and derived funding values from authoritative sources.

### SEC-05-05 — No financial credentials

This module must not request bank passwords, card credentials, account login credentials or financial institution secrets.

---

## 18. Accessibility and responsive behaviour

Core Savings Plan functionality must work on mobile.

Requirements:

- monetary inputs have visible labels;
- progress is not communicated by colour alone;
- progress bars expose accessible text/value semantics;
- status messages are understandable without icons;
- currency and amount are readable with locale-aware formatting;
- keyboard operation is supported;
- error text identifies the affected field;
- saving-pace cards remain legible on narrow screens.

---

## 19. Analytics contract

Analytics must not block MVP completion.

If analytics exists, approved events may include:

- `savings_plan_viewed`
- `savings_available_amount_updated`
- `savings_plan_fully_funded`

Do not send exact monetary values, sensitive notes or personally identifying financial details to analytics by default.

---

## 20. Acceptance scenarios — DADO / QUANDO / ENTÃO

### AC-05-01 — Target budget basis

**DADO** target budget €3,000 and current forecast €2,600  
**QUANDO** Savings Plan loads  
**ENTÃO** savings target is €3,000 and basis is `Target budget`.

### AC-05-02 — Forecast fallback

**DADO** no target budget and current forecast €2,600  
**QUANDO** Savings Plan loads  
**ENTÃO** savings target is €2,600 and basis is `Current forecast`.

### AC-05-03 — No target

**DADO** no target budget and no usable forecast  
**QUANDO** Savings Plan loads  
**ENTÃO** it shows a no-target empty state and does not treat target as €0.

### AC-05-04 — Current available plus paid

**DADO** savings target €3,000, current available €700 and eligible paid €300  
**QUANDO** Savings Plan calculates  
**ENTÃO** total funded is €1,000 and still to fund is €2,000.

### AC-05-05 — Prevent double counting actual

**DADO** eligible paid €300 and an Actual Expense of €300 represents the same economic cost  
**QUANDO** Savings Plan calculates  
**ENTÃO** funding progress counts €300 from Payments, not €600.

### AC-05-06 — Standalone actual does not fund

**DADO** a standalone Actual Expense of €50 with no Payment  
**QUANDO** Savings Plan calculates  
**ENTÃO** it does not add €50 to eligible paid funding.

### AC-05-07 — Payment refund

**DADO** +€300 Payment and -€100 payment adjustment  
**QUANDO** Savings Plan calculates  
**ENTÃO** eligible paid is €200.

### AC-05-08 — Negative net paid floor

**DADO** edge-case net paid total -€20  
**QUANDO** Savings Plan calculates  
**ENTÃO** eligible paid for savings is €0 and progress is never negative.

### AC-05-09 — Partially funded

**DADO** target €2,000 and total funded €800  
**QUANDO** departure is in the future  
**ENTÃO** remaining is €1,200 and status is partially funded.

### AC-05-10 — Not funded

**DADO** target €2,000 and total funded €0  
**QUANDO** departure is in the future  
**ENTÃO** remaining is €2,000 and status is not funded.

### AC-05-11 — Fully funded

**DADO** target €2,000 and total funded €2,000  
**QUANDO** Savings Plan loads  
**ENTÃO** remaining is €0, progress is 100%, and normal saving pace is not required.

### AC-05-12 — Overfunded

**DADO** target €2,000 and total funded €2,250  
**QUANDO** Savings Plan loads  
**ENTÃO** remaining is €0, progress displays 100%, and surplus displays €250.

### AC-05-13 — Zero target

**DADO** explicit target budget €0  
**QUANDO** total funded is €0  
**ENTÃO** progress is valid, displays 100% funded, and no divide-by-zero occurs.

### AC-05-14 — Zero target with funds

**DADO** target €0 and total funded €100  
**QUANDO** Savings Plan loads  
**ENTÃO** progress displays 100% and surplus €100.

### AC-05-15 — Daily pace

**DADO** €1,000 remains and departure is exactly 100 calendar days away  
**QUANDO** pace is calculated  
**ENTÃO** raw daily pace is €10/day before currency-unit ceiling.

### AC-05-16 — Weekly pace

**DADO** raw daily pace €10  
**QUANDO** weekly pace is calculated  
**ENTÃO** raw weekly pace is €70.

### AC-05-17 — Monthly normalized pace

**DADO** raw daily pace €10  
**QUANDO** monthly pace is calculated  
**ENTÃO** raw normalized monthly pace is €304.36875 before currency-unit ceiling.

### AC-05-18 — Round recommendations upward

**DADO** a 2-decimal Trip currency and raw daily pace €10.001  
**QUANDO** amount is displayed  
**ENTÃO** recommendation is €10.01, not €10.00.

### AC-05-19 — Departure today and money missing

**DADO** €400 remains and Trip begins today  
**QUANDO** Savings Plan loads  
**ENTÃO** it shows €400 needed today and does not divide by zero for recurring rates.

### AC-05-20 — Departure today fully funded

**DADO** remaining €0 and Trip begins today  
**QUANDO** Savings Plan loads  
**ENTÃO** it shows fully funded.

### AC-05-21 — Departure passed

**DADO** Trip start date was yesterday  
**QUANDO** Savings Plan loads  
**ENTÃO** future daily/weekly/monthly saving pace is not calculated.

### AC-05-22 — Forecast target increases

**DADO** forecast is the savings basis and changes from €2,000 to €2,400  
**QUANDO** Module 04 persistence succeeds  
**ENTÃO** Savings Plan target becomes €2,400 and remaining/progress recalculate.

### AC-05-23 — Target budget changes

**DADO** target budget is savings basis and changes from €3,000 to €2,700  
**QUANDO** update succeeds  
**ENTÃO** Savings Plan uses €2,700 without mutating paid or available funds.

### AC-05-24 — Payment added

**DADO** current available €500 and eligible paid €200  
**QUANDO** a new €100 Payment is successfully added  
**ENTÃO** eligible paid becomes €300 and total funded becomes €800, with current available still €500.

### AC-05-25 — Payment does not mutate saved balance

**DADO** current available €500  
**QUANDO** a €100 Payment is created  
**ENTÃO** current available remains €500 unless the user explicitly edits it.

### AC-05-26 — Invalid negative available funds

**DADO** user enters -€50 as current available  
**QUANDO** they save  
**ENTÃO** validation rejects the value and persisted amount is unchanged.

### AC-05-27 — Currency mismatch

**DADO** Trip base currency EUR  
**QUANDO** a mutation attempts to save available funds as GBP  
**ENTÃO** it is rejected in MVP.

### AC-05-28 — Failed save rollback

**DADO** persisted current available is €500  
**QUANDO** user submits €700 and persistence fails  
**ENTÃO** authoritative display returns/remains €500 and retry is available.

### AC-05-29 — Forecast below paid + available

**DADO** forecast basis €1,000 and total funded €1,300  
**QUANDO** Savings Plan calculates  
**ENTÃO** it shows overfunded with €300 surplus and does not mutate source data.

### AC-05-30 — Start date moved earlier

**DADO** €1,000 remains and departure date is moved closer  
**QUANDO** Trip update succeeds  
**ENTÃO** saving pace increases based on the new exact days remaining.

### AC-05-31 — Start date moved later

**DADO** €1,000 remains and departure date is moved later  
**QUANDO** Trip update succeeds  
**ENTÃO** saving pace decreases based on the new exact days remaining.

### AC-05-32 — Owner isolation

**DADO** User A and User B have different Trips  
**QUANDO** User B requests User A's Savings Plan data  
**ENTÃO** access is denied and no monetary data is leaked.

### AC-05-33 — Client tampering

**DADO** client submits a forged `total_funded` value  
**QUANDO** server processes an update  
**ENTÃO** forged derived total is ignored and authoritative totals are recomputed from source data.

### AC-05-34 — Locale formatting

**DADO** Trip currency EUR and product locale pt-PT  
**QUANDO** Savings Plan displays values  
**ENTÃO** monetary formatting follows locale conventions without changing stored values.

### AC-05-35 — Unpriced forecast items

**DADO** no target budget and some Cost Items are unpriced but at least one priced forecast amount exists  
**QUANDO** Savings Plan uses forecast basis  
**ENTÃO** it uses the Module 04 current forecast and UI indicates the plan may be incomplete according to financial-module metadata/design.

### AC-05-36 — Archived Trip

**DADO** Trip is archived  
**QUANDO** owner views historical details  
**ENTÃO** Savings Plan summary can remain available without pretending active savings are required.

---

## 21. Requirements for downstream agents

### 21.1 Architecture Agent

Must define:

- authoritative calculation boundary (server/domain/shared pure function);
- money precision strategy;
- upward-ceiling utility by currency minor unit;
- calendar-day difference utility;
- derived-data cache/invalidation strategy if any;
- how Module 04 totals are consumed without duplication;
- status derivation;
- no client-trusted derived totals.

### 21.2 Design Agent

Must design:

- no-target empty state;
- partially funded state;
- fully funded state;
- overfunded/surplus state;
- departure-today state;
- trip-started/past state;
- editable current available amount;
- target basis label;
- funding breakdown;
- monthly/weekly/daily pace hierarchy;
- accessible progress indication;
- mobile layout.

Design must not invent additional financial inputs.

### 21.3 Database Agent

Must ensure:

- at most one current-available savings record/settings object per Trip;
- non-negative amount constraint;
- base-currency consistency strategy;
- ownership/RLS;
- no duplicate source-of-truth storage for derived totals.

Do not persist `remaining`, `progress`, `daily pace`, `weekly pace` or `monthly pace` as authoritative mutable values unless Architecture explicitly proves a safe derived-cache design.

### 21.4 Backend Agent

Must:

- authorize owner access;
- validate monetary input;
- read target/forecast/net paid from authoritative sources;
- calculate totals deterministically;
- ignore forged client-derived totals;
- return enough metadata to explain basis and state;
- handle concurrent updates safely.

### 21.5 Frontend Agent

Must:

- render server/domain-authoritative calculation results;
- avoid reimplementing competing business formulas;
- clearly label target basis;
- clearly distinguish available, paid, funded, remaining and surplus;
- show advisory nature of saving pace where appropriate;
- implement all required states and retry behaviour.

### 21.6 QA Agent

Must verify every AC-05 scenario plus:

- money precision;
- no floating-point drift;
- leap-year/date-boundary cases;
- timezone-independent calendar date behaviour;
- zero-target safety;
- refund behaviour;
- no Payment/Actual double counting;
- RLS/ownership;
- stale client data/tampering;
- responsive and accessible core flows.

---

## 22. Definition of Done

Module 05 can be marked implementation-complete only when:

- this spec is APPROVED;
- Architecture plan passes its gate;
- Design covers all mandatory states;
- Database constraints/RLS pass;
- Backend calculations pass automated tests;
- Frontend consumes the canonical calculation without competing formulas;
- all AC-05 scenarios pass or have approved test mappings;
- QA verdict is APPROVED;
- no open P0/P1 security or correctness defect exists;
- Module 09 Dashboard can consume Savings Plan output without independently redefining savings formulas.

---

## 23. Product decisions proposed for owner approval

### D-05-01 — Savings target precedence

Use the approved global rule: **Target Budget when defined; otherwise Current Forecast**.

### D-05-02 — Meaning of current available funds

The manually entered savings value is the amount **still available/unspent today**, not the cumulative amount the user has ever saved.

### D-05-03 — Funding progress formula

```text
total funded = current available funds + eligible net paid
remaining = max(0, savings target - total funded)
```

### D-05-04 — Eligible paid source

Only net Module 04 `Payments` count automatically toward funded progress. `Actual Expenses` do not independently count, preventing double counting.

### D-05-05 — No automatic deduction from saved balance

Adding a Payment does not automatically reduce current available funds because Triply cannot know the funding source. The user maintains the current available balance.

### D-05-06 — No contribution ledger in MVP

MVP stores the current available amount, not a history of every savings deposit/withdrawal.

### D-05-07 — Monthly recommendation method

Monthly pace is a normalized advisory rate based on the average Gregorian month (`365.2425 / 12` days), while daily pace uses exact calendar days to departure.

### D-05-08 — Recommendation rounding

Recommended saving rates round **up** to the currency's smallest unit so the displayed pace does not mathematically undershoot the target.

### D-05-09 — Departure today

When money is still missing and departure is today, show the full remaining amount as needed today rather than fake daily/weekly/monthly rates.

### D-05-10 — Past departure

After the departure date has passed, preserve the funding summary for context but stop calculating future savings pace.

### D-05-11 — Surplus does not rewrite budget

Overfunding displays surplus but never automatically raises target budget or forecast.

### D-05-12 — Planner is advisory

Triply does not recommend loans, investments or financial products and must not frame saving pace as individualized financial advice.


---

## Amendment — Savings simplification (owner request, 2026-10-05)

- The savings page uses the same three editable cards as the budget (Objetivo, Já temos = guardado + pago, Falta) and the suggested pace per month, week and day until departure. The calculation rules are unchanged.
