# Wholesale

Everything for the **Wholesale** mode lives here. Retail code lives in `src/retail/`.

| Folder        | Holds                                                          |
| ------------- | -------------------------------------------------------------- |
| `components/` | Wholesale screens' UI pieces                                   |
| `viewmodels/` | `useWholesale…ViewModel` hooks (state + logic per screen)      |
| `models/`     | Wholesale data: suppliers, bulk products, MOQ / tier pricing   |
| `lib/`        | Wholesale-only helpers, e.g. the wholesale cart (separate from retail's) |

Routes are in `src/app/wholesale/` (URL `/wholesale/...`).

## Rules

- Never import from `@/retail/...`, and retail never imports from `@/wholesale/...`.
- Code both modes need goes in `src/shared/` (native bridge, router, icons, orders/profile).
- Use a separate localStorage key for the wholesale cart so the two carts never mix.
