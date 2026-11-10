import Foundation

enum HomeFeature: String, CaseIterable, Identifiable {
    case buy, sell, garage, financing

    var id: Self { self }

    var title: String {
        switch self {
        case .buy: "Comprar un auto"
        case .sell: "Vender mi auto"
        case .garage: "Mi Garage"
        case .financing: "Financiamiento"
        }
    }

    var subtitle: String {
        switch self {
        case .buy: "Encuentra el auto que va contigo."
        case .sell: "Descubre cuánto vale tu auto."
        case .garage: "Tu auto, siempre al día."
        case .financing: "Más caminos para estrenar."
        }
    }

    var actionTitle: String {
        switch self {
        case .buy: "Explorar autos"
        case .sell: "Cotizar mi auto"
        case .garage: "Ver mi auto"
        case .financing: "Conocer opciones"
        }
    }
}

enum HomeTab: String, CaseIterable, Identifiable {
    case home, buy, sell, garage, financing

    var id: Self { self }

    var title: String {
        switch self {
        case .home: "Inicio"
        case .buy: "Comprar"
        case .sell: "Vender"
        case .garage: "Mi Garage"
        case .financing: "Financiamiento"
        }
    }

    var symbol: String {
        switch self {
        case .home: "house.fill"
        case .buy: "car.side"
        case .sell: "tag"
        case .garage: "key.horizontal"
        case .financing: "creditcard"
        }
    }

    var feature: HomeFeature? {
        switch self {
        case .home: nil
        case .buy: .buy
        case .sell: .sell
        case .garage: .garage
        case .financing: .financing
        }
    }
}

struct PrototypeNotice: Identifiable {
    let id = UUID()
    let title: String
    let message: String
}
