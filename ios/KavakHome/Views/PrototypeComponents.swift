import SwiftUI

struct PrototypePage<Content: View>: View {
    @ViewBuilder let content: Content

    var body: some View {
        GeometryReader { geometry in
            ZStack {
                KavakTheme.background.ignoresSafeArea()
                ScrollView {
                    VStack(alignment: .leading, spacing: 20) { content }
                        .frame(width: max(0, min(geometry.size.width, 560) - 48), alignment: .leading)
                        .padding(.horizontal, 24)
                        .padding(.top, 18)
                        .padding(.bottom, 28)
                        .frame(maxWidth: .infinity)
                }
                .scrollIndicators(.hidden)
                .scrollDismissesKeyboard(.interactively)
            }
        }
        .toolbarBackground(.white, for: .tabBar)
        .toolbarBackground(.visible, for: .tabBar)
        .toolbarColorScheme(.light, for: .tabBar)
    }
}

struct ScreenHeading: View {
    let eyebrow: String
    let title: String
    let subtitle: String

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(eyebrow.uppercased())
                .font(.caption.weight(.semibold))
                .tracking(1.2)
                .foregroundStyle(.white.opacity(0.8))
            Text(title)
                .font(.largeTitle.bold())
                .tracking(-1)
                .accessibilityAddTraits(.isHeader)
            Text(subtitle)
                .font(.subheadline)
                .foregroundStyle(.white.opacity(0.88))
                .lineSpacing(3)
        }
        .foregroundStyle(.white)
        .fixedSize(horizontal: false, vertical: true)
    }
}

struct WhiteCard<Content: View>: View {
    @ViewBuilder let content: Content

    var body: some View {
        VStack(alignment: .leading, spacing: 18) { content }
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(20)
            .foregroundStyle(KavakTheme.navy)
            .background(.white, in: RoundedRectangle(cornerRadius: 24))
    }
}

struct PrimaryAction: View {
    let title: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.body.weight(.bold))
                .frame(maxWidth: .infinity, minHeight: 24)
                .padding(14)
                .foregroundStyle(.white)
                .background(KavakTheme.blue, in: RoundedRectangle(cornerRadius: 14))
                .contentShape(Rectangle())
        }
        .buttonStyle(KavakButtonStyle())
    }
}

struct InputField<Content: View>: View {
    let title: String
    @ViewBuilder let content: Content

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(title).font(.subheadline.weight(.semibold))
            content
                .frame(maxWidth: .infinity, minHeight: 24, alignment: .leading)
                .padding(12)
                .background(Color(red: 0.95, green: 0.96, blue: 0.98), in: RoundedRectangle(cornerRadius: 12))
        }
    }
}

struct SelectionMenu<Options: View>: View {
    let title: String
    let value: String
    var filled = true
    @ViewBuilder let options: Options
    @Environment(\.isEnabled) private var isEnabled

    var body: some View {
        Menu {
            options
        } label: {
            HStack(spacing: 8) {
                Text(value)
                    .multilineTextAlignment(.leading)
                    .fixedSize(horizontal: false, vertical: true)
                Spacer(minLength: 4)
                Image(systemName: "chevron.up.chevron.down")
                    .font(.footnote.weight(.semibold))
                    .accessibilityHidden(true)
            }
            .font(filled ? .subheadline.weight(.semibold) : .body)
            .foregroundStyle(isEnabled ? KavakTheme.deepBlue : Color.secondary)
            .padding(.horizontal, filled ? 16 : 0)
            .padding(.vertical, filled ? 10 : 0)
            .frame(maxWidth: .infinity, minHeight: 44, alignment: .leading)
            .background(filled ? Color.white : Color.clear, in: RoundedRectangle(cornerRadius: 22))
            .contentShape(Rectangle())
        }
        .accessibilityLabel(title)
        .accessibilityValue(value)
    }
}

struct DemoDisclaimer: View {
    var text = "Prototipo con datos de ejemplo. No se realizan operaciones reales."

    var body: some View {
        Label(text, systemImage: "info.circle")
            .font(.caption)
            .lineSpacing(3)
            .foregroundStyle(.white.opacity(0.85))
            .fixedSize(horizontal: false, vertical: true)
    }
}

struct VehiclePhoto: View {
    let vehicle: Vehicle
    var height: CGFloat = 190

    var body: some View {
        GeometryReader { geometry in
            Image(vehicle.image)
                .resizable()
                .scaledToFill()
                .frame(width: geometry.size.width, height: height)
                .clipped()
        }
        .frame(height: height)
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("Fotografía de referencia de \(vehicle.name)")
    }
}

struct Specification: View {
    let title: String
    let value: String
    let symbol: String

    var body: some View {
        VStack(alignment: .leading, spacing: 7) {
            Label(title, systemImage: symbol)
                .font(.caption)
                .foregroundStyle(.secondary)
            Text(value).font(.subheadline.weight(.semibold))
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .accessibilityElement(children: .combine)
    }
}
