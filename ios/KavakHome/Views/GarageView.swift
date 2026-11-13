import SwiftUI

struct GarageView: View {
    @State private var model = GarageViewModel()
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize

    var body: some View {
        PrototypePage {
            ScreenHeading(eyebrow: "Mi Garage · Ejemplo", title: "Hola, María.\nTu auto, bajo control.", subtitle: "Todo lo que necesitas para seguir disfrutando el camino.")

            VStack(alignment: .leading, spacing: 0) {
                VehiclePhoto(vehicle: model.vehicle, height: 195)
                VStack(alignment: .leading, spacing: 16) {
                    Text(model.vehicle.name).font(.title2.bold()).accessibilityAddTraits(.isHeader)
                    Text("\(String(model.vehicle.year)) · \(model.vehicle.trim)")
                        .font(.subheadline).foregroundStyle(.secondary)
                    VStack(alignment: .leading, spacing: 7) {
                        Text("Valor actual estimado").font(.subheadline)
                        Text(model.estimatedValue.mxn).font(.largeTitle.bold())
                        Text("Ejemplo en MXN. No es una oferta ni una valuación real.").font(.caption)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding(18)
                    .foregroundStyle(.white)
                    .background(KavakTheme.background, in: RoundedRectangle(cornerRadius: 18))

                    LazyVGrid(columns: Array(repeating: GridItem(.flexible(), alignment: .leading), count: dynamicTypeSize.isAccessibilitySize ? 1 : 2), alignment: .leading, spacing: 16) {
                        Specification(title: "Kilometraje", value: model.vehicle.mileageLabel, symbol: "speedometer")
                        Specification(title: "Transmisión", value: model.vehicle.transmission, symbol: "gearshape")
                    }
                }
                .padding(20)
            }
            .foregroundStyle(KavakTheme.navy)
            .background(.white)
            .clipShape(RoundedRectangle(cornerRadius: 24))

            Text("Contigo después de cada viaje")
                .font(.title3.bold()).foregroundStyle(.white)
                .accessibilityAddTraits(.isHeader)

            ForEach(GarageAction.allCases) { action in
                Button { model.open(action) } label: {
                    HStack(spacing: 14) {
                        Image(systemName: action.symbol)
                            .font(.title3)
                            .frame(width: 44, height: 44)
                            .foregroundStyle(KavakTheme.blue)
                            .background(KavakTheme.paleBlue, in: RoundedRectangle(cornerRadius: 13))
                        VStack(alignment: .leading, spacing: 5) {
                            Text(action.title).font(.headline)
                            Text(action.subtitle).font(.caption).foregroundStyle(.secondary)
                        }
                        Spacer(minLength: 0)
                        Image(systemName: "chevron.right").font(.caption.weight(.bold))
                    }
                    .foregroundStyle(KavakTheme.navy)
                    .padding(18)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(.white, in: RoundedRectangle(cornerRadius: 22))
                    .contentShape(Rectangle())
                }
                .buttonStyle(KavakButtonStyle())
                .accessibilityIdentifier("garage-\(action.rawValue)")
            }
            DemoDisclaimer(text: "Perfil, auto y servicios de ejemplo. No hay un vehículo registrado, una cobertura contratada ni citas reales.")
        }
        .alert(item: $model.notice) { notice in
            Alert(title: Text(notice.title), message: Text(notice.message), dismissButton: .default(Text("Entendido")))
        }
    }
}
