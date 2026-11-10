import Foundation

struct Vehicle: Identifiable, Hashable {
    let id: String
    let brand: String
    let model: String
    let year: Int
    let trim: String
    let mileage: Int
    let price: Double
    let transmission: String
    let image: String
    let features: [String]

    var name: String { "\(brand) \(model)" }
    var mileageLabel: String { "\(mileage.formatted(.number.locale(.mexicanSpanish))) km" }
}

extension Locale {
    static let mexicanSpanish = Locale(identifier: "es_MX")
}

extension Double {
    var mxn: String {
        formatted(.currency(code: "MXN").locale(.mexicanSpanish).precision(.fractionLength(0)))
    }
}

enum SampleInventory {
    static let referenceYear = 2026
    static let vehicles: [Vehicle] = [
        Vehicle(id: "mazda-3", brand: "Mazda", model: "3", year: 2022, trim: "i Grand Touring", mileage: 38_000, price: 349_900, transmission: "Automática", image: "Mazda3", features: ["Cámara de reversa", "Apple CarPlay", "Asientos de piel"]),
        Vehicle(id: "kia-forte", brand: "Kia", model: "Forte", year: 2021, trim: "EX", mileage: 47_000, price: 289_900, transmission: "Automática", image: "Forte", features: ["Pantalla táctil", "Cámara de reversa", "Control de crucero"]),
        Vehicle(id: "nissan-versa", brand: "Nissan", model: "Versa", year: 2023, trim: "Advance", mileage: 29_000, price: 279_900, transmission: "Automática", image: "Versa", features: ["Sensores de reversa", "Conectividad Bluetooth", "Aire acondicionado"]),
        Vehicle(id: "toyota-corolla", brand: "Toyota", model: "Corolla", year: 2022, trim: "LE", mileage: 42_000, price: 339_900, transmission: "Automática", image: "Corolla", features: ["Control de estabilidad", "Cámara de reversa", "Pantalla táctil"]),
        Vehicle(id: "volkswagen-jetta", brand: "Volkswagen", model: "Jetta", year: 2021, trim: "Comfortline", mileage: 56_000, price: 319_900, transmission: "Automática", image: "Jetta", features: ["Control de crucero", "Conectividad Bluetooth", "Rines de aluminio"]),
        Vehicle(id: "chevrolet-onix", brand: "Chevrolet", model: "Onix", year: 2023, trim: "LT", mileage: 26_000, price: 249_900, transmission: "Manual", image: "Onix", features: ["Pantalla táctil", "Sensores de reversa", "Apple CarPlay"]),
        Vehicle(id: "mazda-mx5", brand: "Mazda", model: "MX-5", year: 2023, trim: "Grand Touring", mileage: 20_000, price: 449_900, transmission: "Automática", image: "MX5", features: ["Techo convertible", "Asientos de piel", "Sistema de audio premium"]),
        Vehicle(id: "kia-seltos", brand: "Kia", model: "Seltos", year: 2023, trim: "EX", mileage: 31_000, price: 399_900, transmission: "Automática", image: "Seltos", features: ["Cámara de reversa", "Apple CarPlay", "Espacio para toda la familia"])
    ]

    static var brands: [String] { Array(Set(vehicles.map(\.brand))).sorted() }
    static let garageVehicle = vehicles[6]
}
