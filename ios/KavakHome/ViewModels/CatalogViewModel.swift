import Foundation
import Observation

enum PriceFilter: String, CaseIterable, Identifiable {
    case all = "Todos los precios"
    case under300 = "Hasta $300,000"
    case under400 = "Hasta $400,000"

    var id: Self { self }
    var maximum: Double {
        switch self {
        case .all: .infinity
        case .under300: 300_000
        case .under400: 400_000
        }
    }
}

@MainActor
@Observable
final class CatalogViewModel {
    var query = ""
    var brand = ""
    var priceFilter = PriceFilter.all

    var vehicles: [Vehicle] {
        let search = query.trimmingCharacters(in: .whitespacesAndNewlines)
        return SampleInventory.vehicles.filter { vehicle in
            (brand.isEmpty || vehicle.brand == brand)
                && vehicle.price <= priceFilter.maximum
                && (search.isEmpty || "\(vehicle.name) \(vehicle.trim)".localizedStandardContains(search))
        }
    }

    func reset() {
        query = ""
        brand = ""
        priceFilter = .all
    }
}
