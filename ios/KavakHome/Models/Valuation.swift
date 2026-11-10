import Foundation

struct SellingForm: Equatable {
    var brand = ""
    var model = ""
    var year = 2022
    var trim = ""
    var mileage = ""

    var sampleVehicle: Vehicle? {
        SampleInventory.vehicles.first { $0.brand == brand && $0.model == model }
    }

    var validationMessage: String? {
        guard sampleVehicle != nil else { return "Selecciona una marca y un modelo de la lista." }
        guard (2015...SampleInventory.referenceYear).contains(year) else { return "Selecciona un año entre 2015 y 2026." }
        let version = trim.trimmingCharacters(in: .whitespacesAndNewlines)
        guard (2...50).contains(version.count) else { return "Escribe una versión de entre 2 y 50 caracteres." }
        guard !mileage.isEmpty, mileage.allSatisfy({ $0.isASCII && $0.isNumber }),
              let kilometers = Int(mileage), (0...300_000).contains(kilometers) else {
            return "Ingresa un kilometraje entre 0 y 300,000, solo con números y sin separadores."
        }
        return nil
    }
}

struct Valuation: Equatable {
    let lower: Double
    let upper: Double

    static func estimate(_ form: SellingForm) -> Valuation? {
        guard form.validationMessage == nil, let vehicle = form.sampleVehicle,
              let kilometers = Double(form.mileage) else { return nil }
        let referenceAge = Double(SampleInventory.referenceYear - vehicle.year)
        let vehicleAge = Double(SampleInventory.referenceYear - form.year)
        let base = vehicle.price * pow(1.12, referenceAge)
        let mileageFactor = max(0.7, 1 - max(0, kilometers - 30_000) / 1_000_000)
        let value = base * pow(0.88, vehicleAge) * mileageFactor
        return Valuation(lower: (value * 0.9 / 1_000).rounded() * 1_000,
                         upper: (value * 1.1 / 1_000).rounded() * 1_000)
    }
}
