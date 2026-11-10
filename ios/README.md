# Kavak-inspired native iOS prototype

Independent SwiftUI design prototype, not affiliated with Kavak. This is a
separate iOS application; it does not change or embed the Next.js web app.

## Scope

The approved blue **Inicio** design is preserved, with working navigation to
the remaining Spanish-language screens through its cards and a native `TabView`.

| Flow | Behavior |
| --- | --- |
| Inicio | Four feature cards open the matching tab. |
| Comprar | Eight mock vehicles across six brands; search, brand and maximum-price filters combine; empty state can reset filters. |
| Vehicle details | Model photo, MXN price, specifications, features, inspection information, mock interest confirmation, and a prefilled financing simulator. |
| Vender | Marca, Modelo, Año, Versión and Kilometraje form; inline validation and an explicitly illustrative valuation range. |
| Mi Garage | Example Mazda MX-5, estimated value, specifications and mock maintenance, coverage and issue-report confirmations. |
| Financiamiento | Price, down-payment percentage and term update monthly payment, interest, and total immediately. |

All data is bundled and temporary. No account, network, analytics, real
inventory, purchase, booking, credit request, or backend is involved. Input
stays in memory and resets when the app process ends. Service/interest actions
say explicitly that nothing was submitted or booked.

## Build and run

- macOS with Xcode 16 or newer, and an installed iOS Simulator runtime.
- Minimum deployment target: **iOS 17.0**. iPhone portrait layout.
- No packages, CocoaPods, backend, API keys, or web setup are required.

Open `ios/KavakHome.xcodeproj`, select the **KavakHome** scheme and an iPhone
Simulator, then Run (`⌘R`). Simulator builds do not need a development team.
For a physical iPhone, choose your own signing team in the app target.

From the repository root:

```sh
xcodebuild -project ios/KavakHome.xcodeproj \
  -scheme KavakHome -configuration Debug \
  -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' \
  -derivedDataPath ios/build CODE_SIGNING_ALLOWED=NO build
```

To run the model tests, replace the simulator name with one installed locally
(`xcrun simctl list devices available`):

```sh
xcodebuild -project ios/KavakHome.xcodeproj \
  -scheme KavakHome -destination 'platform=iOS Simulator,name=iPhone 17,OS=26.5' \
  -derivedDataPath ios/build CODE_SIGNING_ALLOWED=NO test
```

## Architecture

Simple MVVM using the iOS 17 Observation framework:

- `App/`: SwiftUI app entry point and Mexican Spanish locale.
- `Models/`: local inventory, tab metadata, validated selling inputs, valuation and amortization calculations.
- `ViewModels/`: observable, main-actor navigation, filters, form results, garage actions and financing inputs.
- `Views/`: native tab/navigation stacks, screens and shared cards, fields, headings and buttons.
- `Design/`: shared colors, gradients, spacing token, button interaction style.
- `Assets.xcassets/`: local car artwork and app icon; no runtime network calls.
- `KavakHomeTests/`: navigation, combined filters, form validation, quote invalidation, garage actions and financing edge cases.

Layout respects safe areas and Dynamic Type. Compact cards switch to stacked
artwork at accessibility text sizes. Vehicle artwork is decorative; titles and
buttons have accessible labels. Primary buttons have at least 48-point touch height.

### Mock calculations

The fixed reference year is **2026**, not the device clock. Selling supports
the six catalog brands and their bundled models, years 2015–2026, a trimmed
2–50-character version and integer mileage 0–300,000. Number inputs must use
digits without separators. Changing brand clears model; any edit clears a
previous quote so stale results are never shown.

Valuation uses the model's sample price and sample year:
`base = price × 1.12^(2026 − sampleYear)`;
`value = base × 0.88^(2026 − inputYear) × mileageFactor`;
`mileageFactor = max(0.7, 1 − max(0, km − 30000) / 1000000)`.
The range is 90–110% of that value, rounded to MXN 1,000. It intentionally does
not model condition, history or trim. The UI calls this a fictitious range,
not a purchase offer or a current-market valuation.

Financing accepts an integer price of MXN 1–3,000,000, a 10–80% down payment in
5-point steps, and 12/24/36/48/60 months. It uses standard amortization with a
fixed **14.9% nominal annual example rate** divided by 12, no fees, insurance,
taxes or CAT. The total includes down payment. Results round only for display;
the model also safely handles zero interest and invalid/nonfinite inputs.
The UI says this is not a credit offer or approval.

## Artwork and licenses

Car images are illustrative only; they are not inventory or a user's vehicle.
Two sample photographs are used under the [Unsplash License](https://unsplash.com/license),
which permits downloading, modification, and redistribution, including commercial
use. Source references are retained here:

- White Chevrolet Camaro (`CamaroCutout`):
  https://images.unsplash.com/photo-1492144534655-ae79c964c9d7
- Black Porsche Panamera (`PorscheCutout`):
  https://images.unsplash.com/photo-1503376780353-7e6692767b70

Both were background-masked locally with Apple's Vision framework for this
prototype. Vision is not required at build time or runtime. The KAVAK wordmark
is a native text treatment, not a copied screenshot or original logo asset.
The eight catalog/model photographs are licensed **CC BY-SA 4.0**, with source,
author and license links in [Artwork/CREDITS.md](Artwork/CREDITS.md) and a
bundled [license copy](Artwork/CC-BY-SA-4.0.txt). These photographs remain under
that license, independently of the application source. Their year, trim, color
and market specification may differ from the fictitious inventory, as stated
in the UI. All other graphics are SwiftUI shapes or SF Symbols. No reference
screenshot is included in the running app.

## Verification limits

Deployment target 17.0 does not mean the app was tested on an iOS 17 runtime.
Actual builds, model tests and simulator UI checks are reported in the PR.
No physical-device or production-service behavior is claimed. The iOS workflow
builds and tests on an available hosted iPhone Simulator; existing web CI is
unchanged.
