import SwiftUI

struct CatalogView: View {
    @State private var model = CatalogViewModel()

    var body: some View {
        PrototypePage {
            ScreenHeading(eyebrow: "Comprar", title: "Tu próximo auto\nempieza aquí", subtitle: "Explora autos de ejemplo y encuentra tu favorito.")

            HStack(spacing: 10) {
                Image(systemName: "magnifyingglass").foregroundStyle(.secondary)
                TextField("Buscar marca o modelo", text: $model.query)
                    .submitLabel(.search)
                    .autocorrectionDisabled()
                    .accessibilityIdentifier("catalog-search")
                if !model.query.isEmpty {
                    Button { model.query = "" } label: { Image(systemName: "xmark.circle.fill") }
                        .accessibilityLabel("Borrar búsqueda")
                        .frame(minWidth: 44, minHeight: 44)
                }
            }
            .padding(.horizontal, 14)
            .frame(minHeight: 52)
            .foregroundStyle(KavakTheme.navy)
            .background(.white, in: RoundedRectangle(cornerRadius: 15))

            ViewThatFits(in: .horizontal) {
                HStack { brandPicker; pricePicker }
                VStack(alignment: .leading) { brandPicker; pricePicker }
            }
            .tint(KavakTheme.deepBlue)

            Text("\(model.vehicles.count) autos de ejemplo · Precios en MXN")
                .font(.caption.weight(.medium))
                .foregroundStyle(.white.opacity(0.9))
                .accessibilityIdentifier("catalog-result-count")

            if model.vehicles.isEmpty {
                WhiteCard {
                    ContentUnavailableView("Sin resultados", systemImage: "magnifyingglass", description: Text("Prueba otra marca o amplía el precio."))
                    PrimaryAction(title: "Limpiar filtros", action: model.reset)
                }
            } else {
                LazyVStack(spacing: 18) {
                    ForEach(model.vehicles) { vehicle in
                        NavigationLink(value: vehicle) { VehicleListingCard(vehicle: vehicle) }
                            .buttonStyle(KavakButtonStyle())
                            .accessibilityIdentifier("vehicle-\(vehicle.id)")
                    }
                }
            }
            DemoDisclaimer(text: "Inventario y precios ficticios. Las fotografías son de referencia; versión, año y color pueden variar.")
        }
        .toolbar(.hidden, for: .navigationBar)
    }

    private var brandPicker: some View {
        SelectionMenu(title: "Marca", value: model.brand.isEmpty ? "Todas las marcas" : model.brand) {
            Picker("Marca", selection: $model.brand) {
                Text("Todas las marcas").tag("")
                ForEach(SampleInventory.brands, id: \.self) { Text($0).tag($0) }
            }
        }
        .accessibilityIdentifier("brand-filter")
    }

    private var pricePicker: some View {
        SelectionMenu(title: "Precio máximo", value: model.priceFilter.rawValue) {
            Picker("Precio máximo", selection: $model.priceFilter) {
                ForEach(PriceFilter.allCases) { Text($0.rawValue).tag($0) }
            }
        }
        .accessibilityIdentifier("price-filter")
    }
}

private struct VehicleListingCard: View {
    let vehicle: Vehicle

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            VehiclePhoto(vehicle: vehicle)
            VStack(alignment: .leading, spacing: 12) {
                Text(vehicle.name).font(.title2.bold())
                Text("\(vehicle.year.formatted(.number.grouping(.never))) · \(vehicle.mileageLabel) · \(vehicle.transmission)")
                    .font(.caption)
                    .foregroundStyle(.secondary)
                ViewThatFits(in: .horizontal) {
                    HStack { price; Spacer(minLength: 8); detailLabel }
                    VStack(alignment: .leading, spacing: 12) { price; detailLabel }
                }
            }
            .padding(18)
        }
        .foregroundStyle(KavakTheme.navy)
        .background(.white)
        .clipShape(RoundedRectangle(cornerRadius: 24))
        .accessibilityElement(children: .combine)
    }

    private var price: some View {
        Text(vehicle.price.mxn).font(.title3.bold()).foregroundStyle(KavakTheme.deepBlue)
    }

    private var detailLabel: some View {
        Label("Ver detalles", systemImage: "arrow.right")
            .font(.subheadline.weight(.semibold))
            .foregroundStyle(KavakTheme.deepBlue)
            .padding(.vertical, 12)
    }
}
