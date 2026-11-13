import SwiftUI

struct HomeFeatureCard: View {
    let feature: HomeFeature
    let action: () -> Void
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize

    private var isLight: Bool { feature == .sell || feature == .financing }
    private var foreground: Color { isLight ? KavakTheme.navy : .white }

    var body: some View {
        Group {
            if feature == .buy {
                buyCard
            } else {
                compactCard
            }
        }
        .background { cardBackground }
        .clipShape(RoundedRectangle(cornerRadius: KavakTheme.cornerRadius))
        .overlay {
            RoundedRectangle(cornerRadius: KavakTheme.cornerRadius)
                .strokeBorder(.white.opacity(isLight ? 0.7 : 0.22), lineWidth: 1)
        }
        .shadow(color: KavakTheme.deepBlue.opacity(0.2), radius: 16, x: 0, y: 8)
        .accessibilityIdentifier("feature-\(feature.rawValue)")
    }

    private var buyCard: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text("TU PRÓXIMO GRAN COMIENZO")
                    .font(.caption2.weight(.semibold))
                    .tracking(1.1)
                    .foregroundStyle(.white.opacity(0.75))
                Spacer(minLength: 0)
                Image(systemName: "sparkle")
                    .foregroundStyle(.white.opacity(0.8))
                    .accessibilityHidden(true)
            }

            heading

            Image("CamaroCutout")
                .resizable()
                .scaledToFit()
                .frame(maxWidth: .infinity)
                .frame(height: 136)
                .offset(x: 14)
                .shadow(color: .black.opacity(0.25), radius: 12, x: 0, y: 14)
                .padding(.vertical, 1)
                .accessibilityHidden(true)

            actionButton(filled: true)
        }
        .padding(20)
    }

    private var compactCard: some View {
        VStack(alignment: .leading, spacing: 18) {
            heading
                .padding(.trailing, dynamicTypeSize.isAccessibilitySize ? 0 : 102)

            if dynamicTypeSize.isAccessibilitySize {
                artwork
                    .frame(height: 100)
                    .frame(maxWidth: .infinity)
            }

            actionButton(filled: false)
        }
        .frame(maxWidth: .infinity, minHeight: 142, alignment: .leading)
        .padding(20)
        .background(alignment: .trailing) {
            if !dynamicTypeSize.isAccessibilitySize {
                artwork
                    .frame(width: feature == .financing ? 128 : 185, height: 132)
                    .offset(x: feature == .financing ? 27 : 46, y: 5)
                    .allowsHitTesting(false)
            }
        }
    }

    private var heading: some View {
        VStack(alignment: .leading, spacing: 7) {
            Text(feature.title)
                .font(.system(.title2, design: .default, weight: .bold))
                .tracking(-0.5)
                .foregroundStyle(foreground)
                .accessibilityAddTraits(.isHeader)

            Text(feature.subtitle)
                .font(.subheadline)
                .foregroundStyle(foreground.opacity(isLight ? 0.8 : 0.86))
                .fixedSize(horizontal: false, vertical: true)
        }
    }

    @ViewBuilder
    private var artwork: some View {
        switch feature {
        case .buy, .sell:
            Image("PorscheCutout")
                .resizable()
                .scaledToFit()
                .rotationEffect(.degrees(-7))
                .shadow(color: KavakTheme.navy.opacity(0.15), radius: 8, y: 9)
                .accessibilityHidden(true)
        case .garage:
            ZStack(alignment: .topTrailing) {
                Image("CamaroCutout")
                    .resizable()
                    .scaledToFit()
                    .offset(y: 30)

                Image(systemName: "checkmark.shield.fill")
                    .font(.system(size: 43, weight: .medium))
                    .foregroundStyle(.white, KavakTheme.blue)
                    .padding(.trailing, 45)
            }
            .accessibilityHidden(true)
        case .financing:
            ZStack {
                Circle().stroke(KavakTheme.blue.opacity(0.08), lineWidth: 20)
                Circle().fill(KavakTheme.blue.opacity(0.1)).padding(16)
                Image(systemName: "percent")
                    .font(.system(size: 42, weight: .bold, design: .rounded))
                    .foregroundStyle(KavakTheme.blue)
                    .rotationEffect(.degrees(-12))
            }
            .accessibilityHidden(true)
        }
    }

    @ViewBuilder
    private var cardBackground: some View {
        switch feature {
        case .buy:
            LinearGradient(
                colors: [Color(red: 0.06, green: 0.38, blue: 0.97), KavakTheme.deepBlue],
                startPoint: .topLeading, endPoint: .bottomTrailing
            )
            .overlay(alignment: .trailing) {
                Circle()
                    .fill(.white.opacity(0.05))
                    .frame(width: 250, height: 250)
                    .offset(x: 95, y: -20)
            }
        case .sell:
            LinearGradient(colors: [.white, KavakTheme.paleBlue], startPoint: .topLeading, endPoint: .bottomTrailing)
        case .garage:
            LinearGradient(colors: [KavakTheme.navy, Color(red: 0.04, green: 0.19, blue: 0.42)], startPoint: .leading, endPoint: .trailing)
        case .financing:
            LinearGradient(colors: [.white, KavakTheme.paleBlue], startPoint: .leading, endPoint: .trailing)
        }
    }

    private func actionButton(filled: Bool) -> some View {
        Button(action: action) {
            HStack(spacing: 10) {
                Text(feature.actionTitle)
                    .font(.subheadline.weight(.bold))

                if filled { Spacer(minLength: 8) }

                Image(systemName: "arrow.right")
                    .font(.subheadline.weight(.semibold))
            }
            .foregroundStyle(filled || isLight ? KavakTheme.deepBlue : .white)
            .padding(.horizontal, filled ? 16 : 0)
            .padding(.vertical, 13)
            .frame(minHeight: 48)
            .background(filled ? .white : .clear, in: RoundedRectangle(cornerRadius: 14))
            .contentShape(Rectangle())
        }
        .buttonStyle(KavakButtonStyle())
        .accessibilityIdentifier("action-\(feature.rawValue)")
    }
}
