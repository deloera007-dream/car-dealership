import SwiftUI

struct VehicleDetailView: View {
    let vehicle: Vehicle
    @State private var showsInterest = false
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize

    var body: some View {
        PrototypePage {
            VStack(alignment: .leading, spacing: 0) {
                VehiclePhoto(vehicle: vehicle, height: 230)
                VStack(alignment: .leading, spacing: 12) {
                    Text(vehicle.name).font(.largeTitle.bold()).accessibilityAddTraits(.isHeader)
                    Text("\(vehicle.year.formatted(.number.grouping(.never))) · \(vehicle.trim)").foregroundStyle(.secondary)
                    Text(vehicle.price.mxn).font(.title.bold()).foregroundStyle(KavakTheme.deepBlue)
                    Text("Precio de ejemplo en MXN").font(.caption).foregroundStyle(.secondary)
                }
                .padding(20)
            }
            .foregroundStyle(KavakTheme.navy)
            .background(.white)
            .clipShape(RoundedRectangle(cornerRadius: 24))

            WhiteCard {
                Text("Conoce cada detalle").font(.title3.bold())
                LazyVGrid(columns: Array(repeating: GridItem(.flexible(), alignment: .leading), count: dynamicTypeSize.isAccessibilitySize ? 1 : 2), alignment: .leading, spacing: 20) {
                    Specification(title: "Año", value: String(vehicle.year), symbol: "calendar")
                    Specification(title: "Kilometraje", value: vehicle.mileageLabel, symbol: "speedometer")
                    Specification(title: "Transmisión", value: vehicle.transmission, symbol: "gearshape")
                    Specification(title: "Versión", value: vehicle.trim, symbol: "car.side")
                }
                Divider()
                ForEach(vehicle.features, id: \.self) { feature in
                    Label(feature, systemImage: "checkmark.circle.fill")
                        .font(.subheadline)
                        .foregroundStyle(KavakTheme.deepBlue)
                }
            }

            WhiteCard {
                Label("Más confianza en cada kilómetro", systemImage: "checkmark.shield.fill")
                    .font(.headline).foregroundStyle(KavakTheme.deepBlue)
                Text("La experiencia de Kavak incluye una inspección de más de 240 puntos mecánicos, estéticos y de seguridad, además de reacondicionamiento.")
                    .font(.subheadline)
                Text("Esta ficha es ilustrativa: no acredita la inspección, disponibilidad ni garantía de un auto real. Consulta las condiciones vigentes antes de comprar.")
                    .font(.caption).foregroundStyle(.secondary)
                PrimaryAction(title: "Me interesa") { showsInterest = true }
                    .accessibilityIdentifier("vehicle-interest")
                NavigationLink {
                    FinancingView(initialPrice: vehicle.price)
                } label: {
                    Label("Simular financiamiento", systemImage: "arrow.right")
                        .font(.subheadline.weight(.semibold))
                        .frame(maxWidth: .infinity, minHeight: 48)
                }
                .foregroundStyle(KavakTheme.deepBlue)
            }
            DemoDisclaimer(text: "Datos ficticios y fotografía de referencia. Versión, año, color y equipamiento pueden variar.")
        }
        .navigationTitle("Detalle del auto")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar(.visible, for: .navigationBar)
        .toolbarBackground(KavakTheme.blue, for: .navigationBar)
        .toolbarBackground(.visible, for: .navigationBar)
        .toolbarColorScheme(.dark, for: .navigationBar)
        .alert("Interés simulado", isPresented: $showsInterest) {
            Button("Entendido", role: .cancel) {}
        } message: {
            Text("Elegiste el \(vehicle.name). Esto es una demostración: no se enviaron datos ni se solicitó contacto o reservación.")
        }
    }
}
