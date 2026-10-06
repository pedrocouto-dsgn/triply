# SPEC — Module 04: Budget & Expenses

Version: 1.3  
Status: APPROVED
Module ID: `04-budget-expenses`  
Depends on: `spec/00-product.md`, `spec/02-trips.md`, `spec/03-destinations-legs.md`, `AGENTS.md`, `docs/adr/ADR-002-money-and-currency.md`  
Primary handoff: Module 05 — Savings Plan

---

## 1. Purpose

Give the traveller one reliable financial model for planning and tracking the full trip, without collapsing different financial concepts into one number.

This module must answer, at any point:

1. How much do I intend to spend?
2. How much do I currently expect the trip to cost?
3. How much have I already committed to?
4. How much have I already paid?
5. How much did I actually spend?
6. Where is the money going by destination and category?
7. Am I above or below the plan?
8. How do costs in other currencies affect my trip total?

The financial model must work for single-destination and multi-destination trips.

---

## 2. Product outcome

When this module is complete, the user can:

1. view or edit the optional overall target budget of the Trip;
2. create planned cost items before anything is booked;
3. associate costs with the whole Trip, a Stop, a Travel Leg, and later-compatible entities;
4. categorise each cost;
5. distinguish `estimated`, `committed`, `paid`, and `actual` amounts;
6. record partial or multiple payments toward the same cost;
7. record real expenses that had no prior plan or reservation;
8. record refunds/negative adjustments without rewriting history;
9. use default and custom expense categories;
10. enter costs in a currency different from the Trip base currency;
11. provide/confirm the conversion used when automatic FX is unavailable;
12. preserve original and normalized historical monetary values;
13. see consolidated totals in the Trip base currency;
14. see totals by category and by destination;
15. compare estimated/committed baselines with actual spend;
16. see target-budget remaining or target-budget overrun;
17. retain financial records even when related route objects change, unless deletion is explicitly confirmed under safe dependency rules;
18. continue to Module 05 with a deterministic financial target for savings calculations.

---

## 3. Actors

### 3.1 Authenticated Trip owner

Can create, read, edit and remove financial records belonging to their Trip.

### 3.2 Authenticated non-owner

Cannot access financial records from another user's Trip.

### 3.3 Visitor

Cannot access Trip financial data.

---

## 4. Scope

### Included

- overall Trip target budget;
- planned cost items;
- estimated amount;
- committed/booked amount;
- payment records;
- actual expenses;
- refunds and negative adjustments;
- partial payments;
- trip-level costs;
- Stop-associated costs;
- Travel-Leg-associated costs;
- category assignment;
- custom categories;
- multi-currency entry;
- explicit conversion rate/value confirmation;
- preserved normalized historical values;
- totals in Trip base currency;
- totals by category;
- totals by Stop;
- budget vs forecast;
- planned vs actual variance;
- empty/loading/error/success states;
- RLS/ownership requirements;
- audit-safe financial history semantics;
- QA acceptance scenarios.

### Explicitly out of scope

- live FX feeds;
- automatic exchange-rate providers;
- bank account connections;
- card transaction imports;
- receipt OCR;
- invoice generation;
- group expense splitting or settlement;
- traveller-by-traveller balances;
- accounting/bookkeeping features;
- tax reporting;
- AI spending forecasts;
- automatic destination price estimates;
- recurring personal-finance budgets outside a Trip;
- savings-plan calculations (Module 05);
- reservation lifecycle management (Module 07);
- document/receipt file storage (Module 08).

---

## 5. Canonical financial concepts

### 5.1 Target budget

The optional maximum/intended total amount the traveller wants to allocate to the whole Trip.

It is stored in the Trip base currency and belongs conceptually to Module 02, while this module owns its financial behaviour and reporting.

Target budget is **not** the same as current forecast.

Example:

```text
Target budget: €3,000
Current estimated forecast: €2,760
```

### 5.2 Cost item

A Cost Item represents a planned or known cost subject.

Examples:
- Hotel Paris
- Train Paris → Brussels
- Louvre ticket
- Travel insurance
- Food budget — Amsterdam
- Airport transfer

A Cost Item may exist before any reservation, payment or actual expense exists.

Conceptual fields:

| Field | Requirement |
|---|---|
| `id` | Stable unique identifier |
| `trip_id` | Required parent Trip |
| `title` | Required human-readable label |
| `category_id` | Required |
| `scope_type` | Required association scope |
| `scope_id` | Optional depending on scope |
| `estimated_amount_original` | Optional non-negative money |
| `estimated_currency` | Required when estimate exists |
| `estimated_base_amount` | Required when normalized estimate exists |
| `estimated_conversion_rate` | Required when currencies differ |
| `committed_amount_original` | Optional non-negative money |
| `committed_currency` | Required when committed amount exists |
| `committed_base_amount` | Required when normalized committed amount exists |
| `committed_conversion_rate` | Required when currencies differ |
| `notes` | Optional |
| `created_at` | Required |
| `updated_at` | Required |

Architecture/Database agents may normalize this model but may not merge distinct financial states without a spec change.

### 5.3 Estimated

The user's current planning estimate before the final committed price is known.

Example:

```text
Hotel Paris — estimated €300
```

The estimate must remain available after a committed price is later entered, so planned-vs-known comparisons remain possible.

### 5.4 Committed / booked

The agreed or committed cost after a booking/purchase decision.

Example:

```text
Hotel Paris
Estimated: €300
Committed: €276
```

Committed does not imply fully paid.

### 5.5 Payment

A Payment represents money actually paid toward a cost.

Payments are transaction-like records and must not be represented only as a mutable boolean.

Conceptual fields:

| Field | Requirement |
|---|---|
| `id` | Stable unique identifier |
| `trip_id` | Required |
| `cost_item_id` | Optional when payment is linked to a planned cost |
| `amount_original` | Positive money amount |
| `currency` | Required |
| `base_amount` | Required normalized snapshot |
| `conversion_rate` | Required when currency differs from base |
| `paid_at` | Required date; time optional |
| `notes` | Optional |
| `created_at` | Required |

A Cost Item can have zero, one or many Payments.

### 5.6 Actual expense

An Actual Expense represents real spend attributed to the Trip.

It may:
- relate to an existing Cost Item;
- exist independently with no prior plan/reservation;
- differ from both the committed amount and sum of payments in legitimate scenarios.

Conceptual fields:

| Field | Requirement |
|---|---|
| `id` | Stable unique identifier |
| `trip_id` | Required |
| `cost_item_id` | Optional |
| `title` | Required when standalone |
| `category_id` | Required |
| `scope_type` | Required |
| `scope_id` | Optional depending on scope |
| `amount_original` | Positive money amount for normal expense |
| `currency` | Required |
| `base_amount` | Required normalized snapshot |
| `conversion_rate` | Required when currencies differ |
| `expense_date` | Required |
| `notes` | Optional |
| `created_at` | Required |

### 5.7 Financial adjustment / refund

Refunds and reversals must preserve the original transaction.

They are represented as explicit negative adjustments, not by silently mutating or deleting the original Payment/Actual Expense.

Example:

```text
Museum ticket payment: +€30
Refund:               -€30
Net paid:              €0
```

The UI may visually group the refund with the original record.

---

## 6. Association model

Financial records must support contextual association without becoming structurally dependent on a single destination.

### Supported MVP scopes

1. `trip` — applies to the whole Trip;
2. `stop` — applies to a specific destination/Stop;
3. `travel_leg` — applies to transport between route points.

The schema should remain extensible for:
- `reservation`;
- `itinerary_item`;
without Module 04 requiring those modules to exist yet.

### RN-04-01 — Scope validity

If a record is scoped to a Stop or Travel Leg:
- the referenced object must belong to the same Trip;
- a user cannot attach a financial record to another user's object;
- invalid cross-Trip references are rejected server-side.

### RN-04-02 — Destination totals are derived

The MVP must **not** create an independent manually-entered destination budget envelope.

A destination financial total is derived from financial items associated with that Stop and any reporting rules explicitly defined here.

This avoids contradictory states such as:

```text
Paris destination budget manually entered: €500
Sum of Paris planned items:                 €720
```

The overall Trip target budget remains the only high-level manually entered budget cap in MVP.

---

## 7. Categories

### 7.1 Default MVP categories

The product provides at least:

1. Transport between destinations
2. Local transport
3. Accommodation
4. Food & drink
5. Attractions & activities
6. Events
7. Shopping
8. Insurance
9. Documents / visa
10. Connectivity / SIM / internet
11. Fees / taxes
12. Emergency / contingency
13. Other

### 7.2 Custom categories

Users may create custom categories in MVP.

Rules:
- category name is required;
- trim whitespace;
- category names need not be globally unique;
- within one user's active category set, duplicate names should be prevented case-insensitively where practical;
- custom categories belong to the user, not a single Trip;
- deleting a custom category that is already referenced must not orphan existing financial records.

Recommended behaviour when a referenced custom category is removed:
- archive/deactivate it for future selection;
- preserve existing references and historical labels.

Hard deletion of an in-use category is not allowed.

---

## 8. Monetary representation

### RN-04-03 — Exact money semantics

Authoritative monetary values must not use JavaScript binary floating-point calculations.

Implementation must follow `ADR-002-money-and-currency.md` and use deterministic exact monetary semantics.

### RN-04-04 — Currency code

Every monetary amount has an explicit supported ISO 4217 currency code.

### RN-04-05 — Original values are immutable historical context

When a record is entered in a currency different from the Trip base currency, Triply preserves:
- original amount;
- original currency;
- conversion rate/value used;
- normalized Trip-base-currency amount.

Historical normalized values must not change merely because a new market exchange rate exists later.

### RN-04-06 — No automatic live FX in MVP

Automatic live exchange-rate retrieval is not required in MVP.

When original currency differs from Trip base currency, the user must be able to provide or confirm the conversion used.

Recommended UX:

```text
Amount: 10,000 JPY
Trip currency: EUR

Conversion
1 JPY = 0.0058 EUR
Calculated Trip value: €58.00
```

Alternatively the UX may ask directly for the normalized base value, provided the derived rate is then persisted deterministically.

### RN-04-07 — Same-currency normalization

If original currency equals Trip base currency:
- normalized amount equals original amount;
- effective conversion rate is 1;
- user is not asked for an FX rate.

---

## 9. Trip base currency changes

### RN-04-08 — Before financial data

Changing the Trip base currency before any financial record exists is allowed according to Module 02.

### RN-04-09 — After financial data exists

Changing Trip base currency after any estimated, committed, payment, expense or adjustment record exists is a **sensitive operation**.

For MVP, the recommended rule is:

> Do not allow direct base-currency change while financial records exist.

The UI must explain that existing historical normalized values depend on the current base currency.

The user may only change it after removing all financial records, or through a future explicit currency-migration flow.

Agents must not implement silent mass reconversion.

---

## 10. Cost Item rules

### RN-04-10 — Title

A Cost Item requires a non-empty title after trimming.

Recommended maximum: 120 characters.

### RN-04-11 — Estimate is optional

A Cost Item may exist without an estimate when the user knows the subject but not yet the price.

Example:

```text
Hotel Berlin — price not known yet
```

### RN-04-12 — Committed value may exist without estimate

A user may directly record a committed amount without first entering an estimate.

### RN-04-13 — Estimate is not overwritten by committed value

Entering a committed amount must preserve the prior estimate.

### RN-04-14 — Zero is valid

A monetary field may intentionally be zero.

`0` must remain distinguishable from `null / not entered`.

### RN-04-15 — Negative estimate/committed values

Estimated and committed amounts cannot be negative.

Negative money is only valid through explicit adjustment/refund semantics.

---

## 11. Payment rules

### RN-04-16 — Multiple/partial payments

A Cost Item can receive multiple payments.

Example:

```text
Hotel committed: €600
Deposit paid:    €150
Final payment:   €450
Total paid:      €600
```

### RN-04-17 — Payment may exceed committed amount

Triply should warn, not necessarily block, when cumulative net payments exceed the current committed amount.

Legitimate reasons include:
- fees;
- deposits changed after booking;
- foreign card charges;
- user data entered before committed amount was updated.

The UI must surface the inconsistency.

### RN-04-18 — Payment date

Every Payment requires a payment date.

Future dates are not valid for a record representing money already paid. Future scheduled payments belong to reservation/checklist planning, not the paid ledger.

### RN-04-19 — Payments are preserved

Editing the committed amount later must not rewrite historical Payment records.

### RN-04-20 — Deleting paid Cost Items

A Cost Item with Payment or Actual Expense history cannot be hard-deleted through a casual delete action.

Recommended MVP behaviour:
- archive/remove it from active planning views;
- preserve its financial history;
- destructive permanent deletion, if supported at all, requires an explicit dependency-aware flow.

---

## 12. Actual Expense rules

### RN-04-21 — Standalone actual expense

A user may create an Actual Expense without an existing Cost Item.

Example:

```text
Coffee in Prague — 180 CZK
```

This is an approved core MVP behaviour.

### RN-04-22 — Actual does not automatically equal paid

Recording a Payment must not automatically create or overwrite an Actual Expense unless a later approved interaction explicitly asks the user to do so.

Likewise, entering an Actual Expense does not automatically create a Payment.

The UI may offer a convenience action, but the underlying concepts remain distinct.

### RN-04-23 — Expense date

Every Actual Expense requires a date.

An expense date may be outside the Trip dates only through an intentional warning-confirmation flow, because legitimate pre-trip purchases exist.

Examples:
- flight bought two months before departure;
- visa paid before the Trip;
- insurance bought before departure.

Therefore the system must **not** enforce “expense date must fall inside trip dates” as a hard rule.

### RN-04-24 — Actual expense association

A standalone Actual Expense may be:
- Trip-level;
- Stop-level;
- Travel-Leg-level.

---

## 13. Refunds and adjustments

### RN-04-25 — Original record preservation

A refund/reversal creates a new negative adjustment linked to the original record where possible.

The original transaction remains unchanged.

### RN-04-26 — Adjustment magnitude

The system may allow cumulative refunds to exceed the original transaction only with a strong warning, because this is usually a data-entry error.

QA must cover this state.

### RN-04-27 — Net totals

Paid and actual aggregates use net transaction values:

```text
net paid = positive payments + negative payment adjustments
net actual = positive actual expenses + negative actual adjustments
```

A net total may theoretically become negative due to user-entered adjustments; the UI must not crash or clamp historical financial truth to zero.

---

## 14. Forecast and baseline rules

### 14.1 Per-item forecast

For each Cost Item, the primary current forecast is:

```text
if committed amount exists:
    forecast = committed
else if estimated amount exists:
    forecast = estimated
else:
    forecast = 0 for aggregation, while UI still shows “not priced”
```

A missing amount must not be visually represented as if the user intentionally entered zero.

### 14.2 Trip forecast

```text
trip forecast = sum(current forecast of active Cost Items)
```

Standalone Actual Expenses with no corresponding Cost Item do **not** retroactively alter the original planned forecast.

The UI may show a current “expected total including unplanned actuals” later, but it must not rewrite the planned baseline.

### 14.3 Estimated total

```text
estimated total = sum(all entered estimated base amounts)
```

### 14.4 Committed total

```text
committed total = sum(all entered committed base amounts)
```

This metric is independent of payment status.

### 14.5 Paid total

```text
paid total = sum(net Payment base amounts)
```

### 14.6 Actual total

```text
actual total = sum(net Actual Expense base amounts)
```

Actual should not be inferred from paid totals.

---

## 15. Budget calculations

### RN-04-28 — Target budget remaining during planning

When a target budget exists, the default planning view uses the current forecast:

```text
target remaining (forecast basis) = target budget - current forecast
```

If result > 0:
- user is under target by that amount.

If result = 0:
- forecast matches target.

If result < 0:
- forecast exceeds target by `abs(result)`.

The UI must label the basis as forecast/current plan.

### RN-04-29 — Target budget vs actual

During/after travel, the user must also be able to see:

```text
target remaining (actual basis) = target budget - actual total
```

The UI must not silently switch between forecast and actual basis without a clear label.

### RN-04-30 — No target budget

If the Trip has no target budget:
- budget-remaining metrics are not shown as zero;
- the UI shows `No target budget set` or equivalent;
- all forecast and actual totals still work.

### RN-04-31 — Zero target budget

If target budget is explicitly `0`:
- it is a real target;
- any positive forecast is over target;
- do not treat it as “not configured”.

---

## 16. Planned vs actual variance

### 16.1 Default final variance

For a Cost Item with an estimate:

```text
variance vs estimate = actual - estimated
```

For a Cost Item with a committed value:

```text
variance vs committed = actual - committed
```

The interface must explicitly state which baseline is being compared.

### 16.2 Sign semantics

```text
positive variance = spent more than baseline
negative variance = spent less than baseline
zero = matched baseline
```

Do not reverse this meaning between screens.

### 16.3 Missing actual

If there is no Actual Expense associated with a Cost Item:
- variance is `not available`;
- do not assume actual = 0 for user-facing variance.

### 16.4 Standalone actuals

Actual Expenses without a planned Cost Item appear as **unplanned spend**.

They must be included in overall actual totals and category/destination actual reporting.

---

## 17. Aggregation and reporting

The module must support deterministic aggregated views by:

### 17.1 Whole Trip

At minimum:
- target budget;
- estimated total;
- current forecast;
- committed total;
- paid total;
- actual total;
- unplanned actual total;
- target remaining on forecast basis;
- target remaining on actual basis when relevant.

### 17.2 Category

For each category, where data exists:
- estimated;
- forecast;
- committed;
- paid;
- actual;
- variance.

### 17.3 Stop

For each Stop, where data exists:
- estimated;
- forecast;
- committed;
- paid;
- actual;
- variance.

Travel-Leg costs may be shown separately from Stop totals rather than arbitrarily assigned to a departure or arrival Stop.

### RN-04-32 — No double counting across scopes

A record linked to a Travel Leg must not also be counted as a Stop cost merely because the Leg connects to that Stop.

Reporting scopes must be deterministic and mutually understood.

---

## 18. Travel Leg financial integration

Module 03 allows an optional transport price snapshot on a Travel Leg.

### RN-04-33 — One source of financial truth

The Travel Leg's contextual `price_amount` must not independently be counted in financial aggregates **and** also be represented as a Cost Item.

For MVP, recommended behaviour:

- when the user chooses to include a Travel Leg price in the budget, Triply creates or links one Cost Item scoped to that Travel Leg;
- the financial Cost Item becomes the authoritative aggregated financial record;
- the Travel Leg may retain contextual display information/reference, but aggregation occurs exactly once.

Architecture must document the synchronization strategy before implementation.

### RN-04-34 — Route changes

If a Travel Leg becomes `needs_review` because the route is reordered:
- its linked financial history remains preserved;
- Triply must not delete committed, payment or actual records;
- the UI surfaces that financial cost is linked to a route item requiring review.

---

## 19. Deletion and dependency integrity

### RN-04-35 — Stop deletion with financial data

If Module 03 attempts to delete a Stop with financial records:
- the user must be warned;
- financial history must not disappear silently;
- the operation requires a defined strategy before confirmation.

Recommended MVP choices presented to user where feasible:
1. cancel and keep Stop;
2. move eligible planning items to Trip-level, then delete Stop;
3. preserve historical records with a deleted/archived scope reference.

Agents must not invent cascade deletion of money records.

### RN-04-36 — Travel Leg deletion with financial data

Same principle as Stop deletion: no silent cascade deletion of financial history.

### RN-04-37 — Trip deletion

Permanent deletion of the parent Trip follows Module 02's destructive-delete flow and may cascade child financial data only as part of the explicitly confirmed full Trip deletion.

---

## 20. Primary user flows

### Flow A — Build an initial budget

```text
Open Trip
→ Budget & Expenses
→ Add cost item
→ Enter title
→ choose category
→ choose Trip / Stop / Travel Leg
→ enter estimated amount
→ choose original currency
→ confirm conversion if needed
→ save
→ totals update
```

### Flow B — Replace estimate with known booking price

```text
Open existing cost item
→ add committed amount
→ preserve original estimate
→ save
→ current forecast now uses committed amount
→ variance between estimate and committed can be derived
```

### Flow C — Record partial payment

```text
Open committed cost
→ Record payment
→ enter amount + currency + date
→ confirm conversion if needed
→ save
→ paid total updates
→ unpaid committed balance can be displayed
```

### Flow D — Record unplanned real spend

```text
Add actual expense
→ enter title
→ category
→ optional Stop/Leg scope
→ amount + currency
→ expense date
→ confirm conversion if needed
→ save
→ actual total and “unplanned spend” update
```

### Flow E — Refund

```text
Open original payment/expense
→ Add refund/adjustment
→ enter refunded amount
→ save
→ original record remains
→ negative adjustment appears
→ net total updates
```

### Flow F — Multi-currency purchase

```text
Trip base currency = EUR
→ user enters 20,000 JPY expense
→ Triply asks for conversion/normalized value
→ user confirms rate/value
→ original JPY amount preserved
→ EUR normalized snapshot stored
→ Trip totals aggregate in EUR
```

---

## 21. UX states and required communication

### 21.1 Empty budget state

Must explain that the user can start by adding expected costs.

Primary CTA: `Add first cost` or equivalent.

### 21.2 No target budget

The financial screen must still be useful without a target budget.

Offer a non-blocking CTA to set one.

### 21.3 Unpriced item

A Cost Item with no estimate/commitment displays `Price not set` or equivalent, not `€0`.

### 21.4 FX required

When original currency differs from base currency and no conversion exists:
- saving must be blocked until the user confirms enough information to normalize the record;
- error text must explain why.

### 21.5 Over target

Going over target is allowed.

It is a planning signal, not a validation failure.

### 21.6 Paid > committed

Show warning but preserve user agency.

### 21.7 Loading/error safety

Network failures during creation/editing must not result in duplicate financial transactions after retry.

Architecture/Backend must define idempotency or equivalent protections for transaction-like writes where necessary.

---

## 22. Security and privacy requirements

Financial data is private user data.

Requirements:
- all records are owner-isolated through server authorization/RLS;
- ownership is derived from the parent Trip and not trusted from client input;
- cross-Trip `scope_id` injection must fail;
- users cannot query aggregates containing another user's financial records;
- transaction writes must validate currency, amount and scope server-side;
- no secret/provider keys may be exposed client-side if FX integrations are added later;
- logs must avoid unnecessary exposure of sensitive free-text notes.

QA must include explicit cross-user isolation tests.

---

## 23. Data consistency requirements

Architecture/Database must ensure:

1. monetary values have deterministic precision;
2. required currency exists for every amount;
3. normalized amount and conversion metadata remain consistent;
4. foreign keys/scopes cannot cross Trips;
5. categories cannot become orphaned;
6. refunds/adjustments preserve original records;
7. aggregate queries cannot double-count a financial event;
8. retries cannot silently duplicate a Payment or Actual Expense;
9. `0` remains distinguishable from missing;
10. changing related route records cannot cascade-delete financial history unexpectedly.

---

## 24. Acceptance scenarios — DADO / QUANDO / ENTÃO

### AC-04-01 — Add estimated Trip-level cost

**DADO** uma viagem em EUR  
**QUANDO** o utilizador adiciona `Seguro de viagem` estimado em €80 ao nível da Trip  
**ENTÃO** o custo é guardado e o total estimado aumenta €80.

### AC-04-02 — Stop-level cost

**DADO** uma viagem com Paris e Berlim  
**QUANDO** o utilizador associa um hotel de €300 a Paris  
**ENTÃO** o valor entra no total da Trip e no relatório de Paris, mas não no de Berlim.

### AC-04-03 — Estimate becomes committed

**DADO** `Hotel Paris` estimado em €300  
**QUANDO** o utilizador regista preço comprometido de €276  
**ENTÃO** o estimate de €300 é preservado e o forecast corrente desse item passa a €276.

### AC-04-04 — Direct committed amount

**DADO** um novo custo sem estimate  
**QUANDO** o utilizador regista diretamente um preço reservado de €120  
**ENTÃO** o custo é válido e o forecast usa €120.

### AC-04-05 — Partial payment

**DADO** um hotel comprometido em €600  
**QUANDO** o utilizador paga €150 de depósito  
**ENTÃO** committed continua €600 e paid torna-se €150.

### AC-04-06 — Multiple payments

**DADO** o mesmo hotel com €150 já pagos  
**QUANDO** é registado um segundo pagamento de €450  
**ENTÃO** paid total do item é €600 sem apagar o primeiro pagamento.

### AC-04-07 — Paid exceeds committed

**DADO** committed €100  
**QUANDO** os pagamentos líquidos totalizam €110  
**ENTÃO** a Triply preserva €110 e apresenta um aviso de inconsistência.

### AC-04-08 — Standalone actual expense

**DADO** nenhuma estimativa para café em Praga  
**QUANDO** o utilizador regista um gasto real de 180 CZK  
**ENTÃO** o gasto entra em actual total como unplanned spend sem exigir Cost Item prévio.

### AC-04-09 — Payment does not imply actual

**DADO** uma reserva paga de €200  
**QUANDO** o pagamento é registado  
**ENTÃO** paid aumenta €200 e actual não é automaticamente criado.

### AC-04-10 — Actual does not imply payment

**DADO** um gasto real de €35 pago em dinheiro  
**QUANDO** o utilizador o regista apenas como Actual Expense  
**ENTÃO** actual aumenta €35 e o ledger de Payments não é automaticamente alterado.

### AC-04-11 — Refund preserves original

**DADO** um pagamento de €50  
**QUANDO** é registado um reembolso de €20  
**ENTÃO** o pagamento original continua visível, o ajuste -€20 é preservado e net paid torna-se €30.

### AC-04-12 — Full refund

**DADO** um gasto real de €30  
**QUANDO** é registado ajuste de -€30  
**ENTÃO** net actual desse conjunto torna-se €0 sem apagar o gasto original.

### AC-04-13 — Multi-currency entry

**DADO** Trip em EUR  
**QUANDO** o utilizador regista 10,000 JPY e confirma conversão para €58  
**ENTÃO** JPY 10,000 e €58 ficam ambos preservados com os metadados de conversão.

### AC-04-14 — Same-currency entry

**DADO** Trip em EUR  
**QUANDO** o utilizador regista €42  
**ENTÃO** não é pedida taxa FX e normalized amount é €42.

### AC-04-15 — Missing FX conversion

**DADO** Trip em EUR  
**QUANDO** o utilizador tenta guardar 500 CZK sem conversão confirmada  
**ENTÃO** o save é bloqueado com erro claro e nenhum registo parcial é criado.

### AC-04-16 — Historical FX does not drift

**DADO** um gasto antigo de 100 USD normalizado para €90  
**QUANDO** a taxa de mercado muda posteriormente  
**ENTÃO** o histórico continua a usar a snapshot de €90 até o utilizador executar uma edição explícita permitida.

### AC-04-17 — Base currency locked after finance data

**DADO** uma Trip em EUR com pelo menos um registo financeiro  
**QUANDO** o utilizador tenta mudar a base currency para GBP  
**ENTÃO** a operação é bloqueada e a UI explica que seria necessária migração financeira explícita.

### AC-04-18 — Target budget remaining

**DADO** target €3,000 e forecast €2,700  
**QUANDO** o resumo financeiro é calculado  
**ENTÃO** remaining on forecast basis é €300.

### AC-04-19 — Over target

**DADO** target €2,000 e forecast €2,250  
**QUANDO** o resumo é mostrado  
**ENTÃO** a Triply mostra €250 acima do target sem impedir o utilizador de continuar.

### AC-04-20 — No target budget

**DADO** uma Trip sem target budget  
**QUANDO** existem €1,500 em custos planeados  
**ENTÃO** forecast €1,500 é mostrado e budget remaining aparece como não configurado, não como €0.

### AC-04-21 — Explicit zero target

**DADO** target budget explicitamente igual a €0  
**QUANDO** existe forecast de €100  
**ENTÃO** a Triply mostra €100 acima do target.

### AC-04-22 — Variance vs estimate

**DADO** estimate €100 e actual €120  
**QUANDO** a comparação usa estimate como baseline  
**ENTÃO** variance é +€20 e significa acima do planeado.

### AC-04-23 — Negative variance

**DADO** committed €300 e actual €270  
**QUANDO** committed é o baseline  
**ENTÃO** variance é -€30 e significa abaixo do baseline.

### AC-04-24 — Missing actual variance

**DADO** estimate €100 e nenhum actual  
**QUANDO** a UI mostra variance  
**ENTÃO** mostra indisponível/pendente e não `-€100`.

### AC-04-25 — Category totals

**DADO** vários custos de Accommodation em Stops diferentes  
**QUANDO** o relatório por categoria é aberto  
**ENTÃO** todos são agregados exatamente uma vez na categoria Accommodation.

### AC-04-26 — Custom category

**DADO** o utilizador cria `Coworking`  
**QUANDO** associa um gasto à categoria  
**ENTÃO** a categoria pode ser usada nos relatórios como qualquer categoria padrão.

### AC-04-27 — In-use custom category removal

**DADO** `Coworking` já referenciada por despesas  
**QUANDO** o utilizador a remove da lista ativa  
**ENTÃO** os registos históricos preservam a categoria e ela deixa de ser usada em novos itens.

### AC-04-28 — Travel Leg not double counted

**DADO** uma Travel Leg com preço contextual e Cost Item financeiro ligado  
**QUANDO** os totais são calculados  
**ENTÃO** o custo entra exatamente uma vez.

### AC-04-29 — Reordered leg keeps money history

**DADO** uma Travel Leg paga que entra em `needs_review` após reorder  
**QUANDO** a rota muda  
**ENTÃO** committed, paid e actual permanecem preservados.

### AC-04-30 — Stop deletion warning

**DADO** Paris com registos financeiros  
**QUANDO** o utilizador tenta apagar Paris  
**ENTÃO** não ocorre cascade silencioso e é apresentado um fluxo de resolução explícito.

### AC-04-31 — Pre-trip expense date

**DADO** viagem em novembro  
**QUANDO** o utilizador regista em setembro o voo comprado antecipadamente  
**ENTÃO** a despesa é permitida porque gastos pré-viagem são válidos.

### AC-04-32 — Future paid date rejected

**DADO** hoje 31 de agosto  
**QUANDO** o utilizador tenta registar como já pago um pagamento com data futura  
**ENTÃO** a operação é rejeitada como Payment realizado.

### AC-04-33 — Zero vs missing

**DADO** um Cost Item  
**QUANDO** estimate é explicitamente €0  
**ENTÃO** a UI mostra €0 e não `Price not set`.

### AC-04-34 — Non-owner isolation

**DADO** dois utilizadores diferentes  
**QUANDO** User B tenta ler/criar/editar um custo da Trip de User A  
**ENTÃO** o acesso falha no servidor/RLS e nenhum dado financeiro é exposto.

### AC-04-35 — Retry safety

**DADO** um pagamento enviado e uma falha de rede durante a resposta  
**QUANDO** o cliente faz retry da mesma intenção  
**ENTÃO** a arquitetura deve impedir duplicação silenciosa do pagamento.

### AC-04-36 — Deterministic aggregation

**DADO** o mesmo conjunto imutável de registos financeiros  
**QUANDO** os totais são recalculados  
**ENTÃO** o resultado em base currency é sempre o mesmo, sem drift de floating point.

---

## 25. Architecture Agent requirements

Before implementation, Architecture must explicitly decide and document:

1. authoritative money representation;
2. Cost Item / Payment / Actual Expense / Adjustment persistence model;
3. conversion snapshot model;
4. how polymorphic financial scopes are represented safely;
5. how Travel Leg prices connect to Cost Items without double counting;
6. aggregation strategy;
7. retry/idempotency strategy for transaction-like writes;
8. archive/delete behaviour for financial records;
9. category ownership/deactivation strategy;
10. indexes required for Trip/category/Stop aggregation;
11. server/client responsibility boundaries for financial calculations.

Architecture may not remove the domain distinctions approved here.

---

## 26. Database Agent requirements

Database must verify:

- RLS for every financial table;
- parent Trip ownership propagation;
- exact monetary precision;
- currency constraints;
- non-negative constraints where applicable;
- explicit adjustment semantics for negative values;
- scope referential integrity;
- no accidental cascade from Stop/Leg deletion into financial history;
- archived custom categories retain historical references;
- deterministic ordering for transaction history;
- idempotency key uniqueness if architecture chooses that pattern.

---

## 27. Backend Agent requirements

Backend owns authoritative validation/calculation for:

- ownership;
- monetary input;
- conversion completeness;
- future Payment dates;
- aggregate formulas;
- over-target/variance calculations;
- refund validation;
- scope validation;
- duplicate transaction prevention;
- base-currency change guard.

Frontend-only validation is insufficient.

---

## 28. Frontend Agent requirements

Frontend must clearly distinguish at minimum:

- Target budget
- Estimated
- Current forecast
- Committed
- Paid
- Actual

It must never use one ambiguous label such as `Spent` for multiple concepts.

The financial experience must be usable on mobile and desktop, support multi-currency inputs, and expose warnings without blocking valid over-budget states.

---

## 29. QA Agent requirements

QA must cover:

- every acceptance scenario in §24;
- rounding/precision boundaries;
- zero-value vs null-value states;
- multiple currencies;
- negative adjustments;
- partial payments;
- overpayment warning;
- standalone actual spend;
- no double counting;
- cross-user isolation;
- route-delete dependency safety;
- duplicate retry protection;
- accessible financial status communication.

Financial calculation defects, double counting, cross-user exposure or silent history deletion are **blocking defects**.

---

## 30. Product decisions proposed for approval

The following decisions are recommended for the MVP:

### D-04-01 — One high-level manual budget cap

Only the overall Trip target budget is manually entered as a high-level envelope. Destination/category totals are derived from items.

**Recommendation:** APPROVE.

### D-04-02 — Forecast precedence

Current forecast uses committed amount when available, otherwise estimated amount.

**Recommendation:** APPROVE.

### D-04-03 — Payment and Actual remain separate

Payments never silently become Actual Expenses and vice versa.

**Recommendation:** APPROVE.

### D-04-04 — Multiple partial payments

Allow multiple Payments for one Cost Item.

**Recommendation:** APPROVE.

### D-04-05 — Standalone actual expenses

Allow Actual Expenses without a prior Cost Item.

**Recommendation:** ALREADY APPROVED globally; reaffirm.

### D-04-06 — Refund model

Use explicit negative adjustments while preserving originals.

**Recommendation:** ALREADY APPROVED globally; reaffirm.

### D-04-07 — Custom categories

Custom user categories are included and become inactive rather than hard-deleted when referenced.

**Recommendation:** APPROVE.

### D-04-08 — Manual FX confirmation in MVP

No live FX dependency. User confirms conversion for cross-currency records.

**Recommendation:** APPROVE.

### D-04-09 — Lock Trip base currency after financial data

Do not support mass currency migration in MVP.

**Recommendation:** APPROVE.

### D-04-10 — Pre-trip actual expenses allowed

Actual expense dates can precede Trip dates because bookings, visas and insurance are often purchased in advance.

**Recommendation:** APPROVE.

### D-04-11 — Over-budget is not an error

Triply warns and reports over-budget states but never blocks spending/planning data because of the target.

**Recommendation:** APPROVE.

### D-04-12 — Financial history beats cascade deletion

Deleting/reordering Stops or Legs never silently destroys financial history.

**Recommendation:** APPROVE.

---

## 31. Approval gate

This spec may become `APPROVED` when the Product Owner accepts §30 or explicitly changes the relevant decisions.

After approval:

`Architecture → Design → Database → Backend → Frontend → QA`

may consume this specification without inventing financial product behaviour.

The next Product specification is:

`05-savings-plan.md`



---

## Amendment — Budget simplification (owner request, 2026-10-05)

- The budget page shows three cards only. **Objetivo** is the trip target budget. **Já temos** is money saved (savings "current available") plus net paid. **Falta** is Objetivo minus Já temos. Each card can be edited in place: Objetivo through the target budget, Já temos through the saved amount.
- When no Objetivo is set, the planned expenses total is used as the goal and labelled as such.
- **Gastos por categoria**: one card per category with its total and paid amount. Alojamento, Transportes and Atividades always appear. A card lists its expenses and supports inline add, edit (description, value, destination), mark paid / unpaid, and remove. Users can create a category or show any existing one.
- Simplified expense model on the existing schema. An expense is a cost item with one value, stored as committed in the base currency. "Mark paid" records a payment for the unpaid remainder. "Mark unpaid" and "remove" record refunds (negative adjustments), and removing also archives the item. No financial history is deleted.
- Kept: forecast per destination (bar list, with an add-destination action), forecast per category (donut) and a collapsed payment history. Removed from the UI: the estimated / forecast / committed / paid / actual metric grid and the separate cost, payment, actual and refund forms in the main flow. Their routes still exist for legacy data.


## Amendment v1.2 — Paid expenses and ticket expenses (owner request, 2026-10-05)

- Paid expenses are listed after unpaid ones inside each category.
- Creating an expense already marked "Já está pago" is idempotent (a retry never duplicates it) and payment dates use the UTC calendar date so they are never ahead of the database date.
- Travel-leg ticket prices appear automatically as expenses (see Module 03 amendment v1.2).

## Amendment v1.3 — "Já temos" is not increased by payments (owner request, 2026-10-06)

"Já temos" is the money the traveller has set aside for the trip and changes only when they edit it. Marking expenses as paid spends from that money: it is shown as "Já pago com este valor" and "Ainda livre", but never added to "Já temos". "Falta" = objective − "Já temos". The same rule applies to the dashboard and savings progress (spec 05).
