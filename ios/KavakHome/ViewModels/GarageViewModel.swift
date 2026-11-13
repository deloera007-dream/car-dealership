import Observation

enum GarageAction: String, CaseIterable, Identifiable {
    case maintenance, coverage, report
    var id: Self { self }

    var title: String {
        switch self {
        case .maintenance: "Agendar mantenimiento"
        case .coverage: "Ver cobertura"
        case .report: "Reportar problema"
        }
    }

    var subtitle: String {
        switch self {
        case .maintenance: "Cuida lo que te mueve."
        case .coverage: "Conoce un ejemplo de protección."
        case .report: "Estamos para acompañarte."
        }
    }

    var symbol: String {
        switch self {
        case .maintenance: "wrench.and.screwdriver"
        case .coverage: "checkmark.shield"
        case .report: "exclamationmark.bubble"
        }
    }

    var message: String {
        switch self {
        case .maintenance:
            "Aquí podrías elegir un centro y una fecha para un servicio preventivo. Es una demostración: no se agendó ninguna cita."
        case .coverage:
            "En una versión real consultarías vigencia, componentes y condiciones de tu cobertura. Este auto es ficticio y no tiene una póliza activa."
        case .report:
            "En una versión real describirías el problema y solicitarías ayuda. Este aviso es simulado: no se envió ningún reporte."
        }
    }
}

@MainActor
@Observable
final class GarageViewModel {
    let vehicle = SampleInventory.garageVehicle
    let estimatedValue = 388_500.0
    var notice: PrototypeNotice?

    func open(_ action: GarageAction) {
        notice = PrototypeNotice(title: action.title, message: action.message)
    }
}
