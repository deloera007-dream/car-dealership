import SwiftUI

struct HomeView: View {
    let model: HomeViewModel

    var body: some View {
        ZStack {
            KavakTheme.background.ignoresSafeArea()

            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    header
                    introduction

                    VStack(spacing: 16) {
                        ForEach(model.features) { feature in
                            HomeFeatureCard(feature: feature) {
                                model.open(feature)
                            }
                        }
                    }

                    footer
                }
                .padding(.horizontal, 24)
                .padding(.top, 12)
                .padding(.bottom, 24)
                .frame(maxWidth: 560)
                .frame(maxWidth: .infinity)
            }
            .scrollIndicators(.hidden)
        }
        .toolbarBackground(.white, for: .tabBar)
        .toolbarBackground(.visible, for: .tabBar)
        .toolbarColorScheme(.light, for: .tabBar)
    }

    private var header: some View {
        HStack(alignment: .center) {
            Text("KAVAK")
                .font(.system(size: 32, weight: .black, design: .rounded).italic())
                .tracking(-1.8)
                .accessibilityLabel("Kavak")

            Spacer()

            Label("México", systemImage: "mappin.and.ellipse")
                .font(.subheadline.weight(.medium))
                .padding(.horizontal, 13)
                .padding(.vertical, 9)
                .background(.white.opacity(0.13), in: Capsule())
                .overlay(Capsule().stroke(.white.opacity(0.18), lineWidth: 1))
        }
        .foregroundStyle(.white)
    }

    private var introduction: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Todo para tu auto\nen un solo lugar")
                .font(.system(.largeTitle, design: .default, weight: .bold))
                .tracking(-1.1)
                .lineSpacing(1)
                .fixedSize(horizontal: false, vertical: true)
                .accessibilityAddTraits(.isHeader)

            Text("Compra, vende o cambia tu auto de forma fácil y segura.")
                .font(.body)
                .foregroundStyle(.white.opacity(0.88))
                .lineSpacing(3)
                .fixedSize(horizontal: false, vertical: true)
        }
        .foregroundStyle(.white)
    }

    private var footer: some View {
        VStack(spacing: 10) {
            Label("Contigo en cada kilómetro", systemImage: "checkmark.shield")
                .font(.subheadline.weight(.semibold))

            Text("Prototipo de diseño · Sin operaciones reales\nConcepto independiente, no afiliado a Kavak.")
                .font(.caption2)
                .foregroundStyle(.white.opacity(0.75))
                .multilineTextAlignment(.center)
                .lineSpacing(3)
        }
        .foregroundStyle(.white)
        .frame(maxWidth: .infinity)
        .padding(.top, 4)
    }
}

#Preview {
    HomeShell()
}
